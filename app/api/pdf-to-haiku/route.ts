import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_URL, getApiHeaders } from '@/lib/api/openrouter';
import { extractTextFromPdf } from '@/lib/pdf/pdf-parser';
import fs from 'fs';
import path from 'path';

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

    // Parse the PDF file using our custom wrapper
    let pdfText = "";
    try {
      pdfText = await extractTextFromPdf(buffer);
    } catch (err) {
      console.error('PDF extraction error:', err);
      return NextResponse.json(
        { error: 'Failed to parse the PDF. The file might be corrupted or password-protected.' },
        { status: 400 }
      );
    }

    // If the PDF is empty or has minimal text, return an error
    if (!pdfText || pdfText.trim().length < 10) {
      return NextResponse.json(
        { error: 'The PDF appears to be empty or contains too little text' },
        { status: 400 }
      );
    }

    // Truncate the text if it's too long (limit to ~4000 characters to avoid token limits)
    const truncatedText = pdfText.length > 4000
      ? pdfText.substring(0, 4000) + '...'
      : pdfText;

    // Create a prompt for generating a haiku from the PDF text
    const prompt = `
      Create a beautiful, thoughtful haiku inspired by the following text from a PDF document. 
      Follow the traditional 5-7-5 syllable pattern. Use vivid imagery and capture the essence 
      of the text in a poetic way.
      
      Text from PDF:
      ${truncatedText}
    `;

    // Send request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku:beta', // Using Claude Haiku for thematic consistency
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
    const haikuContent = data.choices?.[0]?.message?.content || 'Could not generate haiku from the provided PDF.';

    return NextResponse.json({ haiku: haikuContent });
    
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

// Create the test directory if it doesn't exist
// This is to handle pdf-parse's expectation for test files
try {
  const testDir = path.join(process.cwd(), 'test', 'data');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create empty test files that pdf-parse might look for
  const testFiles = ['05-versions-space.pdf'];
  testFiles.forEach(file => {
    const filePath = path.join(testDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '%PDF-1.5\n%Test');
    }
  });
} catch (err) {
  console.warn('Warning: Could not create test directory for pdf-parse:', err);
}