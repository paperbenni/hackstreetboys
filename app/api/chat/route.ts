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

    // Make request to OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages,
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
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}