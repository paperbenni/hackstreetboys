import { NextRequest, NextResponse } from "next/server";
import {
  OPENROUTER_API_URL,
  getApiHeaders,
  DEFAULT_MODEL,
} from "@/lib/api/openrouter";
import {
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";
import type { AnalyzeOperationOutput } from "@azure-rest/ai-document-intelligence";
import client from "@/lib/client";
import { extractTextFromPdf } from "@/lib/pdf/pdf-parser";

// Set a maximum file size for uploads (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Interface for the LLM processing result
interface LlmProcessResult {
  summary?: string;
  rawMarkdown?: string;
  error?: string;
  streaming?: boolean;
  streamController?: StreamController;
}

// Interface for stream controller
interface StreamController {
  onData: (content: string) => void;
  onComplete: (summary: string) => void;
  onError: (error: string) => void;
}

// Interface for the Azure API response
interface AzureProcessResult {
  commissionData: CommissionData[];
  width: number;
  height: number;
  pageWidthInches: number;
  pageHeightInches: number;
  error?: string;
}

// Interface for commission data with bounding box
interface CommissionData {
  id: string;
  commission: string;
  coordinates: number[]; // Flat array format: [x1,y1,x2,y2,x3,y3,x4,y4]
}

interface CombinedProcessResult {
  llmResult: LlmProcessResult;
  azureResult: AzureProcessResult;
}

export async function POST(request: NextRequest) {
  try {
    // Check if the content type is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data" },
        { status: 400 },
      );
    }

    // Get API keys from environment variables
    const openApiKey = process.env.OPENAPI_KEY;
    const azureKey = process.env.FORM_RECOGNIZER_KEY;
    const azureEndpoint = process.env.FORM_RECOGNIZER_ENDPOINT;

    if (!openApiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured on server" },
        { status: 401 },
      );
    }

    if (!azureKey || !azureEndpoint) {
      return NextResponse.json(
        { error: "Azure Form Recognizer credentials not configured on server" },
        { status: 401 },
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Validate the file
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit" },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    // Convert the file to an ArrayBuffer and then to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a clone of the file for the Azure process since we can't reuse the same FormData
    const azureFile = new File([buffer], file.name, { type: file.type });
    const azureFormData = new FormData();
    azureFormData.append("file", azureFile);

    // Start both processes asynchronously
    const [llmResult, azureResult] = await Promise.allSettled([
      processWithLlm(file, buffer, openApiKey),
      processWithAzure(buffer),
    ]);

    // Prepare combined response object
    const response: CombinedProcessResult = {
      llmResult:
        llmResult.status === "fulfilled"
          ? llmResult.value
          : { error: "LLM process failed" },
      azureResult:
        azureResult.status === "fulfilled"
          ? azureResult.value
          : {
              error: "Azure process failed",
              commissionData: [],
              width: 0,
              height: 0,
              pageWidthInches: 0,
              pageHeightInches: 0,
            },
    };

    // Create a streaming response
    const encoder = new TextEncoder();
    const streamResponse = new ReadableStream({
      start(controller) {
        // Send initial response with Azure data
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "init",
              azureResult: response.azureResult,
              rawMarkdown: response.llmResult.rawMarkdown || "",
            }) + "\n",
          ),
        );

        // If LLM result isn't a streaming result, send the full result
        if (!response.llmResult.streaming) {
          // Send complete message
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                summary: response.llmResult.summary || "",
              }) + "\n",
            ),
          );
          controller.close();
          return;
        }

        // Listen to streaming result events
        if (response.llmResult.streamController) {
          const streamController = response.llmResult.streamController;

          // Set up event handlers for the stream
          streamController.onData = (content: string) => {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "delta",
                  content,
                }) + "\n",
              ),
            );
          };

          streamController.onComplete = (summary: string) => {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "complete",
                  summary,
                }) + "\n",
              ),
            );
            controller.close();
          };

          streamController.onError = (error: string) => {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  error,
                }) + "\n",
              ),
            );
            controller.close();
          };
        } else {
          // If for some reason streamController isn't available but streaming was expected
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "Stream controller not available",
              }) + "\n",
            ),
          );
          controller.close();
        }
      },
    });

    // Return a streaming response
    return new Response(streamResponse, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in parallel PDF processing:", error);

    return NextResponse.json(
      { error: "Internal server error while processing the PDF" },
      { status: 500 },
    );
  }
}

// Process the PDF with LLM
async function processWithLlm(
  file: File,
  buffer: Buffer,
  apiKey: string,
): Promise<LlmProcessResult> {
  try {
    // Parse the PDF file using our custom wrapper
    let pdfMarkdown = "";
    try {
      pdfMarkdown = await extractTextFromPdf(buffer);
    } catch (err) {
      console.error("PDF extraction error:", err);
      return {
        error:
          "Failed to parse the PDF. The file might be corrupted or password-protected.",
      };
    }

    // If the PDF is empty or has minimal markdown, return an error
    if (!pdfMarkdown || pdfMarkdown.trim().length < 10) {
      return {
        error: "The PDF appears to be empty or contains too little content",
      };
    }

    // Use the full markdown content without truncation
    const fullMarkdown = pdfMarkdown;

    // Prompt for extracting the items
    const prompt = `
      You are a diligent accountant who knows that getting a number wrong
      will result in losing a lot of money

      # Instruction overview

      after the marker ((BEGIN_ORDERS)) you will be given a loosely structured list of orders.
      Convert the list into json using the interfaces Order and OrderCategory described below.
      Output nothing else beside the json. Convert the entire list, do not
      leave out any orders or abbreviate anything.

      Do not modify the quantity values, copy them as is. Do not do any
      processing or leave anything out.

      # Tree Structure

      The orders are sometimes formatted into a tree structure for different
      categories. This may be through numbers or category headings. If there is
      no discernible structure, come up with categories on your own. The
      interfaces below allow for representing trees.


      # Interfaces

      \`\`\`typescript
      interface Order {
        sku: string;
        name: string;
        text: string;
        quantity: string; // do not do any processing to this, just copy it verbatim
        quantityUnit: string;
        price: string;
        priceUnit: string;
        purchasePrice: string;
        commission: string;
        relevant: bool,
        unsure: bool
      }

      interface OrderCategory {
        name: string;
        content: OrderCategory[] | Order[];
      }
      \`\`\`

      The list is generated from a PDF converted to markdown and is also called Service Specification Document.
      The List will in most cases be written in German.

      Here is a description of what the fields mean and which orders are relevant to us

      Pay special attention to the "##Additional Guidelines"
      section, where it asks for the output of a list of required Artikel. For
      this purpose, provide a summary of items based on the sku: accumulate the
      quantity numbers for each element, with a simple explanation of Element in
      German language. The element should be one word, like "50
      Holzelemente" or "10 Stahltüren", if the element has two or more items,
      identify the exact item and summarize its quantity with respect to the
      Artikel name. Also take extra care with the Extra guideline under "#
      Guidelines" ## Elements, where the Türblatt is decisive over Zarge, and
      for Verglasungen, Zarge is decisive over Festverglasungen.

      # Format explanation:

      - items: The items included in the offer, represented as an array. Each item is an object with the following properties:
        - sku: The SKU of the item, corresponding to the article numbers from the product and service catalog.
        - name: The name of the item.
        - text: The description of the item.
        - quantity: The quantity of the item.
        - quantityUnit: The unit of measurement for the quantity.
        - price: The price of the item.
        - priceUnit: The unit of measurement for the price.
        - commission: The commission for the item.

      # Guidelines

      ## Additional Guidelines:

      - Supplier Information: Store supplier in item (according to Fabrikat, only for elements, not for accessories and services)
      - Review and List Requirements:
        - Check the specifications and output a list of required Gewerke / Artikel with page references as preparation for forwarding to manufacturers, including quantities.
        - Example: 50 Holzelemente (pp. 7 - 15), 10 Stahltüren (pp. 16 - 20), 60 Beschläge (pp. 21 - 23), 3 Obentürschließer, 1 Drehtürantrieb.
        - Suggestions for Distribution: Provide suggestions on who the specifications or individual parts can be sent to.
      - The UI interface should be easy to use and understand, it should be self explanatory.
      - All kinds of advanced UX that simplify the generation of offers are appreciated. For example, a live representation of the offer as a PDF, which users can edit inline before exporting the desired output, would be beneficial.
      - The commission acts like an ID for the order. It can be a number or a hierarchical notation or some other format

      #### Breakdown by product groups:

      - Holztüren
      - Stahltüren
      - Rohrrahmentüren
      - Tore
      - Stahlzargen
      - Zubehör (Drückergarnituren, Obentürschließer)
      - Drehtürantriebe
      - Haustüren
      - Fluchtwegssicherung / Fluchttürsteuerung

      #### Identification of specific requirements

      - Schallschutz
      - Einbruchschutz
      - Brandschutz
      - Rauchschutz
      - Nassraum
      - Feuchtraum
      - Klimaklasse
      - Außentüren
      - Pfosten-Riegelkonstruktion
      - Wärmedämmung (U-Wert)
      - Strahlenschutz
      - Barrierefreiheit
      - Einfachfalz
      - Stumpf
      - Doppelfalz

      ## General Overview of Service Specification Document

      What is included in the specifications?

      - Which products?
      - What quantity of each product?
      - What requirements do these products have? (Summed up by product group)
      - Which brands are required? (Within the product group)
        Example: Holztüren, 20 Stk., Schallschutzklasse 3, Klimaklasse 3, Gefälzt, Fabrikat Jeld-Wen

      List optional positions / on-demand positions separately and do not include them in the total quantity of the product groups.
      Provide a separate overview of any additional allowances required in the specifications.
      (Example 02, service-specification.pdf: Pos. 01.6 HPL-Beschichtung)

      ## Product and Service Catalog with article numbers mapping:

      ### Elements

      These are needed for the sku mapping

      - Holztüren, Holzzargen - Divers-Artikelnr.: 620001
      - Stahltüren, Stahlzargen, Rohrrahmentüren - Divers-Artikelnr.: 670001
      - Haustüren - Divers-Artikelnr.: 660001
      - Glastüren - Divers-Artikelnr.: 610001
      - Tore - Divers-Artikelnr.: 680001
      - Extra guideline:
        - The Türblatt is decisive. For instance, if a Holztürblatt with a Stahlzarge is listed, classify it under 620001.
        - For Verglasungen, the Zarge is decisive, such as Festverglasungen with Stahlzarge classified under 670001.

      ### Accessories

      - Beschläge - Divers-Artikelnr.: 240001
      - Türstopper - Divers-Artikelnr.: 330001
      - Lüftungsgitter - Divers-Artikelnr.: 450001
      - Türschließer - Divers-Artikelnr.: 290001
      - Schlösser / E-Öffner - Divers-Artikelnr.: 360001

      ### Services

      - Wartung - Artikelnr.: DL8110016
      - Stundenlohnarbeiten - Artikelnr.: DL5010008
      - Sonstige Arbeiten (z.B. Baustelleneinrichtung, Aufmaß, Mustertürblatt, etc.) - Artikelnr.: DL5019990



      ((BEGIN_ORDERS))
      ${fullMarkdown}
    `;

    // Set request options
    const requestOptions = {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: DEFAULT_MODEL, // Use default model from configuration
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100000, // Ensure we have enough tokens for complete responses
        stream: true, // Enable streaming for large responses
      }),
    };

    // Override streaming if disabled in environment variables
    const disableStreaming = process.env.DISABLE_STREAMING === "true";
    if (disableStreaming) {
      requestOptions.body = JSON.stringify({
        ...JSON.parse(requestOptions.body as string),
        stream: false,
      });
    }

    // Send request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        error:
          errorData?.error?.message ||
          `API request failed with status ${response.status}`,
      };
    }

    // If streaming is disabled, handle response normally
    if (disableStreaming) {
      const responseData = await response.json();
      const summaryContent =
        responseData.choices?.[0]?.message?.content ||
        "Could not generate summary from the provided PDF.";

      return {
        summary: summaryContent,
        rawMarkdown: fullMarkdown,
      };
    }

    // Create a streaming controller for the LLM response
    const streamController: StreamController = {
      onData: () => {},
      onComplete: () => {},
      onError: () => {},
    };

    // Set up the streaming response processing in a separate task
    processStreamingResponse(response, streamController);

    // Return the controller with the raw markdown
    return {
      rawMarkdown: fullMarkdown,
      streaming: true,
      streamController,
    };
  } catch (error) {
    console.error("Error in LLM processing:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error in LLM processing",
    };
  }
}

// Process the PDF with Azure Document Intelligence
async function processWithAzure(buffer: Buffer): Promise<AzureProcessResult> {
  try {
    // Convert buffer to base64
    const base64Source = buffer.toString("base64");

    // Process with Azure Document Intelligence
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source,
        },
        queryParameters: { locale: "en-IN" },
      });

    if (isUnexpected(initialResponse)) {
      throw new Error(
        initialResponse.body?.error?.message ||
          "Unexpected response from Azure",
      );
    }

    const poller = getLongRunningPoller(client, initialResponse);
    const analyzeResult = (
      (await poller.pollUntilDone()).body as AnalyzeOperationOutput
    ).analyzeResult;

    // Extract commission data (this is a placeholder - in a real scenario
    // you would train a custom model to detect orders)
    // For now, we'll extract paragraphs and tables as potential orders
    const commissionData: CommissionData[] = [];

    // Extract tables as potential orders
    analyzeResult?.tables?.forEach((table, tableIndex) => {
      // Get the bounding polygon for the table
      const polygon = table.boundingRegions?.[0]?.polygon || [];
      if (polygon.length === 8) {
        // Ensure we have a valid polygon
        commissionData.push({
          id: `table-${tableIndex}`,
          commission: `Table ${tableIndex + 1}`,
          coordinates: polygon,
        });
      }
    });

    // Extract paragraphs that might be orders
    analyzeResult?.paragraphs?.forEach((paragraph, paraIndex) => {
      // Get the bounding polygon for the paragraph
      const polygon = paragraph.boundingRegions?.[0]?.polygon || [];
      if (polygon.length === 8) {
        // Ensure we have a valid polygon
        // Check if the paragraph contains order-related keywords
        const content = paragraph.content || "";
        if (
          content.match(
            /pos\.?|position|auftrag|order|commission|nr\.?|st(ü|u)ck|menge|quantity/i,
          )
        ) {
          commissionData.push({
            id: `para-${paraIndex}`,
            commission:
              content.length > 30 ? content.substring(0, 30) + "..." : content,
            coordinates: polygon,
          });
        }
      }
    });

    // Get page dimensions with fallbacks to default values
    const width = analyzeResult?.pages?.[0]?.width || 612; // Default to 8.5 inches in points
    const height = analyzeResult?.pages?.[0]?.height || 792; // Default to 11 inches in points

    return {
      commissionData,
      width,
      height,
      pageWidthInches: width / 72, // Converting points to inches (72 points = 1 inch)
      pageHeightInches: height / 72,
    };
  } catch (error) {
    console.error("Error in Azure processing:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error in Azure processing",
      commissionData: [],
      width: 612,
      height: 792,
      pageWidthInches: 612 / 72,
      pageHeightInches: 792 / 72,
    };
  }
}

// Process streaming response from OpenRouter
async function processStreamingResponse(
  response: Response,
  controller: StreamController,
) {
  try {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is null");

    let summaryContent = "";
    let buffer = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer with streaming mode
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        let foundLine = true;
        while (foundLine) {
          const lineEnd = buffer.indexOf("\n");
          if (lineEnd === -1) {
            foundLine = false;
            continue;
          }

          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (!line || line === "data: [DONE]") continue;

          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            // Skip OpenRouter processing messages
            if (data.includes("OPENROUTER PROCESSING")) continue;

            try {
              const parsed = JSON.parse(data);
              const contentDelta =
                parsed.choices[0]?.delta?.content ||
                parsed.choices[0]?.message?.content ||
                "";

              if (contentDelta) {
                // Append to the accumulated summary content
                summaryContent += contentDelta;

                // Send delta to the client via controller
                controller.onData(contentDelta);
              }
            } catch (e) {
              // Ignore invalid JSON
              console.error(
                "Error parsing JSON:",
                e instanceof Error ? e.message : String(e),
              );
            }
          }
        }
      }
    } finally {
      // Make sure to clean up
      reader.cancel().catch(console.error);

      // Send complete message when done
      controller.onComplete(
        summaryContent || "Could not generate summary from the provided PDF.",
      );
    }
  } catch (error) {
    console.error("Streaming error:", error);
    controller.onError(error instanceof Error ? error.message : String(error));
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to upload a PDF file" });
}
