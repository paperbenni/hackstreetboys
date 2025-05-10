import { NextRequest } from 'next/server';
import { getLlmService } from '@/lib/api/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Override streaming if disabled in environment variables
    const disableStreaming = process.env.DISABLE_STREAMING === 'true';
    const { model, messages, stream: requestedStream = true } = body;
    const shouldStream = disableStreaming ? false : requestedStream;

    try {
      // Get LLM service instance from our new utility
      const llmService = getLlmService();

      if (shouldStream) {
        // Create a streaming response using our service
        const responseStream = await llmService.createResponseStream({
          model,
          messages,
          stream: true,
        });

        // Return the streaming response
        return new Response(responseStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      } else {
        // Handle non-streaming response
        const response = await llmService.process({
          model,
          messages,
        });

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: response.content,
                  role: 'assistant'
                }
              }
            ]
          }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    } catch (llmError) {
      console.error('Error from LLM service:', llmError);
      return new Response(
        JSON.stringify({ 
          error: llmError instanceof Error ? llmError.message : String(llmError)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing chat request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}