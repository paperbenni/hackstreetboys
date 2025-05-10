import { NextRequest, NextResponse } from "next/server";
import { OPENROUTER_API_URL, getApiHeaders } from "@/lib/api/openrouter";
import { extractTextFromPdf } from "@/lib/pdf/pdf-parser";

// Set a maximum file size for uploads (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    // Get API key from environment variable
    const apiKey = process.env.OPENAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured on server" },
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

    // Parse the PDF file using our custom wrapper that uses markitdown CLI
    let pdfMarkdown = "";
    try {
      pdfMarkdown = await extractTextFromPdf(buffer);
    } catch (err) {
      console.error("PDF extraction error:", err);
      return NextResponse.json(
        {
          error:
            "Failed to parse the PDF. The file might be corrupted or password-protected.",
        },
        { status: 400 },
      );
    }

    // If the PDF is empty or has minimal markdown, return an error
    if (!pdfMarkdown || pdfMarkdown.trim().length < 10) {
      return NextResponse.json(
        { error: "The PDF appears to be empty or contains too little content" },
        { status: 400 },
      );
    }

    // Use the full markdown content without truncation
    const fullMarkdown = pdfMarkdown;

    // Prompt for extracting the items
    // This is just a placeholder for now
    const prompt = `
      You are a diligent office worker, you know that if you cannot complete
      this task or make even a single mistake there will be grave consequences
      for the people you love and yourself.

      # Instruction overview

      after the marker ((BEGIN_ORDERS)) you will be given a loosely structured list of orders.
      Convert the list into json using the interfaces Order and OrderCategory described below.
      Output nothing else beside the json. Convert the entire list, do not
      leave out any orders or abbreviate anything.


      # Interfaces

      \`\`\`typescript
      interface Order {
        sku: string;
        name: string;
        text: string;
        quantity: string;
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

      - customerId: The ID of the customer, which should be prompted in the interface.
      - commission: The commission for the customer.
      - type: The type of the offer; it can be a static value, such as "A," which stands for 'Angebot' (offer).
      - shippingConditionId: The ID of the shipping condition, also a static value, for example, "2," which represents shipping with DHL.
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

    // Send request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku:beta", // Using a smaller model for efficiency
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            `API request failed with status ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const summaryContent =
      data.choices?.[0]?.message?.content ||
      "Could not generate summary from the provided PDF.";

    return NextResponse.json({ 
      summary: summaryContent,
      rawMarkdown: fullMarkdown // Return the full markdown content
    });
  } catch (error) {
    console.error("Error processing PDF to process request:", error);

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (
        error.message.includes("ENOENT") &&
        error.message.includes("test/data")
      ) {
        return NextResponse.json(
          { error: "PDF parsing configuration issue. Please try again." },
          { status: 500 },
        );
      } else if (error.message.includes("password")) {
        return NextResponse.json(
          {
            error:
              "The PDF appears to be password-protected. Please provide an unprotected PDF.",
          },
          { status: 400 },
        );
      } else if (
        error.message.includes("corrupt") ||
        error.message.includes("malformed")
      ) {
        return NextResponse.json(
          { error: "The PDF file appears to be corrupted or invalid." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error while processing the PDF" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to upload a PDF file" });
}

// No setup needed for markitdown CLI tool as it operates directly on the PDF file
