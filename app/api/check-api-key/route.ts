import { NextResponse } from 'next/server';

export async function GET() {
  // Check if the OPENAPI_KEY environment variable is set
  const apiKey = process.env.OPENAPI_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { hasApiKey: false, message: 'API key not configured' },
      { status: 200 }
    );
  }
  
  return NextResponse.json(
    { hasApiKey: true, message: 'API key is configured' },
    { status: 200 }
  );
}