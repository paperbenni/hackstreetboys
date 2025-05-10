import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_URL, getApiHeaders } from '@/lib/api/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages } = body;

    // Get API key from environment variable
    const apiKey = process.env.OPENAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 401 }
      );
    }

    // Make request to OpenRouter API with increased token limit
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 100000, // Ensure we have enough tokens for complete responses
        stream: false, // Don't stream the response to avoid truncation
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

    // Process the response carefully to avoid truncation
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      return NextResponse.json({
        error: "Failed to parse LLM response",
        details: e instanceof Error ? e.message : String(e)
      }, { status: 500 });
    }
    
    // Configure the NextResponse with increased size limit
    return new NextResponse(
      JSON.stringify(data),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}