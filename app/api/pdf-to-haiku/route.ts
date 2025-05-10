import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_URL, getApiHeaders } from '@/lib/api/openrouter';
import { extractTextFromPdf } from '@/lib/pdf/pdf-parser';

// Set a maximum file size for uploads (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check if the content type is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate the file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
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
      console.error('PDF extraction error:', err);
      return NextResponse.json(
        { error: 'Failed to parse the PDF. The file might be corrupted or password-protected.' },
        { status: 400 }
      );
    }

    // If the PDF is empty or has minimal markdown, return an error
    if (!pdfMarkdown || pdfMarkdown.trim().length < 10) {
      return NextResponse.json(
        { error: 'The PDF appears to be empty or contains too little content' },
        { status: 400 }
      );
    }

    // Truncate the markdown if it's too long (limit to ~4000 characters to avoid token limits)
    const truncatedMarkdown = pdfMarkdown.length > 4000
      ? pdfMarkdown.substring(0, 4000) + '...'
      : pdfMarkdown;

    // Create a prompt for generating a summary from the PDF markdown content
    const prompt = `
      Create a clear, concise summary of the following markdown content from a PDF document.
      Capture the main ideas, key points, and important details in a well-structured summary.
      Keep the summary informative and comprehensive, focusing on the most important information.
      
      Markdown content from PDF:
      ${truncatedMarkdown}
    `;

    // Send request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku:beta', // Using a smaller model for efficiency
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          error: errorData?.error?.message || `API request failed with status ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summaryContent = data.choices?.[0]?.message?.content || 'Could not generate summary from the provided PDF.';

    return NextResponse.json({ summary: summaryContent });
    
  } catch (error) {
    console.error('Error processing PDF to Haiku request:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') && error.message.includes('test/data')) {
        return NextResponse.json(
          { error: 'PDF parsing configuration issue. Please try again.' },
          { status: 500 }
        );
      } else if (error.message.includes('password')) {
        return NextResponse.json(
          { error: 'The PDF appears to be password-protected. Please provide an unprotected PDF.' },
          { status: 400 }
        );
      } else if (error.message.includes('corrupt') || error.message.includes('malformed')) {
        return NextResponse.json(
          { error: 'The PDF file appears to be corrupted or invalid.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error while processing the PDF' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to upload a PDF file' });
}

// No setup needed for markitdown CLI tool as it operates directly on the PDF file