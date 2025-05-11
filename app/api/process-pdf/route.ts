import { NextRequest, NextResponse } from "next/server";

import { getLlmService } from "@/lib/api/llm-service";
import { DEFAULT_MODEL } from "@/lib/api/openrouter";
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

    // Get LLM service
    let llmService;
    try {
      llmService = getLlmService();
    } catch (ignoredError) {
      console.error("LLM Service initialization failed:", ignoredError);
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
      testing stuf
      ${fullMarkdown}
    `;

    // Prepare the messages
    const messages = [{ role: "user" as const, content: prompt }];

    // Override streaming if disabled in environment variables
    const disableStreaming = process.env.DISABLE_STREAMING === "true";

    // Create encoder for output
    const encoder = new TextEncoder();

    if (disableStreaming) {
      // Handle non-streaming case
      try {
        const response = await llmService.process({
          model: DEFAULT_MODEL,
          messages,
          stream: false,
        });

        return new Response(
          JSON.stringify({
            summary: response.content,
            rawMarkdown: fullMarkdown, // Return the full markdown content
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        );
      }
    }

    // Handle streaming case
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Send the initial data with the raw markdown
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "init",
                rawMarkdown: fullMarkdown,
              }) + "\n",
            ),
          );

          // Create a streaming controller
          const streamController = {
            onData: (chunk: { type: string; content?: string }) => {
              if (chunk.type === "delta" && chunk.content) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "delta",
                      content: chunk.content,
                    }) + "\n",
                  ),
                );
              }
            },
            onComplete: (response: { content: string }) => {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "complete",
                    summary:
                      response.content ||
                      "Could not generate summary from the provided PDF.",
                  }) + "\n",
                ),
              );
              controller.close();
            },
            onError: (error: string) => {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    error,
                  }) + "\n",
                ),
              );
              controller.close();
            },
          };

          // Process the streaming request
          await llmService.processStream(
            {
              model: DEFAULT_MODEL,
              messages: messages as Array<{
                role: "user" | "assistant" | "system";
                content: string;
              }>,
              stream: true,
            },
            streamController,
          );
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : String(error),
              }) + "\n",
            ),
          );
          controller.close();
        }
      },
    });

    // Return a streaming response
    return new Response(customReadable, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
