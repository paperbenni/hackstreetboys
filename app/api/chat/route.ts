import { NextRequest } from 'next/server';
import { OPENROUTER_API_URL, getApiHeaders } from '@/lib/api/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Override streaming if disabled in environment variables
    const disableStreaming = process.env.DISABLE_STREAMING === 'true';
    const { model, messages, stream: requestedStream = true } = body;
    const shouldStream = disableStreaming ? false : requestedStream;

    // Get API key from environment variable
    const apiKey = process.env.OPENAPI_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Make request to OpenRouter API with streaming enabled
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 100000, // Ensure we have enough tokens for complete responses
        stream: shouldStream, // Enable streaming by default, can be disabled via request param
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({ 
          error: errorData?.error?.message || `API request failed with status ${response.status}` 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If streaming is disabled, handle response normally
    if (!shouldStream) {
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        return new Response(
          JSON.stringify({
            error: "Failed to parse LLM response",
            details: e instanceof Error ? e.message : String(e)
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // If streaming is enabled, pass through the streaming response directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}