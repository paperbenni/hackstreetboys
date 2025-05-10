import { NextResponse } from 'next/server';

// Example JSON to simulate streaming
const exampleJson = {
  name: "Complex JSON Example",
  features: [
    "Real-time validation",
    "Maintains last valid state",
    "Visual feedback"
  ],
  metadata: {
    version: "1.0.0",
    author: "Hack Street Boys",
    created: new Date().toISOString(),
    nested: {
      level1: {
        level2: {
          level3: "Deep nesting example"
        }
      }
    }
  },
  numbers: [1, 2, 3, 4, 5],
  booleans: {
    isTrue: true,
    isFalse: false,
    isNull: null
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const delay = searchParams.get('delay') || '100';
  const mode = searchParams.get('mode') || 'valid';
  
  // Create a TransformStream to gradually emit chunks
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start a background process to write chunks
  streamJson(writer, parseInt(delay as string), mode as string);
  
  // Return the stream as a response
  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function streamJson(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  delay: number,
  mode: string
) {
  try {
    // Convert to string with pretty formatting
    const jsonString = JSON.stringify(exampleJson, null, 2);
    
    // For invalid mode, we'll send incomplete JSON
    const finalPosition = mode === 'invalid' 
      ? jsonString.length - 5  // Cut off before the final closing brackets
      : jsonString.length;
    
    // Stream character by character
    for (let i = 0; i < finalPosition; i++) {
      const char = jsonString[i];
      await writer.write(encoder.encode(char));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Handle different modes
    if (mode === 'valid') {
      // Valid mode already handled by sending the complete JSON
    } else if (mode === 'corrupt') {
      // For corrupt mode, append invalid content at the end
      await writer.write(encoder.encode('"unclosed_string'));
    }
  } catch (error) {
    console.error('Error streaming JSON:', error);
  } finally {
    await writer.close();
  }
}

const encoder = new TextEncoder();