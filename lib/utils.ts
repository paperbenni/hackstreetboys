import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format timestamps for response display
export function formatResponseTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'short'
  }).format(date);
}

/**
 * Utilities for handling text content that might be very large
 */

// Creates CSS properties for scrollable containers with adjustable height
export function scrollableContainerStyle(maxHeight?: string) {
  return {
    maxHeight: maxHeight || '70vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    scrollbarWidth: 'thin' as const
  };
}

// Truncates text to a specified maximum length with ellipsis
export function truncateText(text: string, maxLength = 1000): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Shorthand function to ensure no text is truncated - for use with the UI
export function ensureNoTruncation() {
  return {
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const, 
    textOverflow: 'unset' as const
  };
}

/**
 * Utilities for handling streaming API responses
 */

// Process streaming SSE responses from OpenRouter API
export async function processStreamingResponse(
  response: Response, 
  onDelta: (content: string) => void,
  onComplete?: (fullContent: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is null");
  
  let accumulatedResponse = "";
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Decode the chunk
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        // Skip lines that don't contain data
        if (!line.startsWith('data:')) continue;
        
        // Skip [DONE] message
        if (line === 'data: [DONE]') continue;
        
        try {
          // Parse the data part of the SSE event
          const data = JSON.parse(line.substring(6));
          
          // Extract content from delta or message
          const contentDelta = data.choices?.[0]?.delta?.content || 
                               data.choices?.[0]?.message?.content || '';
          
          if (contentDelta) {
            // Add to accumulated response
            accumulatedResponse += contentDelta;
            
            // Call the delta handler
            onDelta(contentDelta);
          }
        } catch (err) {
          console.error('Error parsing stream chunk:', err, line);
          // Continue processing other chunks even if one fails
        }
      }
    }
    
    // Call the complete handler with the full accumulated response
    if (onComplete) {
      onComplete(accumulatedResponse);
    }
    
    return accumulatedResponse;
  } catch (error) {
    console.error("Error processing stream:", error);
    throw error;
  }
}

/**
 * Utility function to extract JSON from markdown text (like LLM responses)
 * This handles cases where JSON is wrapped in markdown code blocks
 */
export function extractJsonFromMarkdown(markdown: string): string {
  // First check if the text already appears to be valid JSON
  try {
    JSON.parse(markdown);
    return markdown; // It's already valid JSON
  } catch {
    // Not valid JSON, continue extracting
  }

  // Try to extract JSON from code blocks
  const jsonCodeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/;
  const match = markdown.match(jsonCodeBlockRegex);
  
  if (match && match[1]) {
    try {
      // Validate the extracted content is valid JSON
      JSON.parse(match[1]);
      return match[1];
    } catch {
      // Continue with other extraction methods
    }
  }
  
  // Look for anything that looks like JSON array or object
  const jsonObjectRegex = /(\[[\s\S]*\]|\{[\s\S]*\})/;
  const objectMatch = markdown.match(jsonObjectRegex);
  
  if (objectMatch && objectMatch[1]) {
    try {
      // Validate the extracted content
      JSON.parse(objectMatch[1]);
      return objectMatch[1];
    } catch {
      // Not valid JSON
    }
  }

  // If we couldn't extract valid JSON, return an empty object
  return '{}';
}

// Process custom JSON streaming format used in process-pdf endpoint
export async function processJsonStreamingResponse(
  response: Response,
  handlers: {
    onInit?: (data: Record<string, unknown>) => void;
    onDelta?: (content: string) => void;
    onComplete?: (summary: string) => void;
    onError?: (error: string) => void;
  }
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is null");
  
  let accumulatedSummary = "";
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Decode the chunk
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          // Skip lines that don't look like JSON
          if (!line.startsWith('{') && !line.startsWith('[')) {
            console.warn('Skipping invalid JSON line:', line);
            continue;
          }
          
          const data = JSON.parse(line);
          
          switch (data.type) {
            case 'init':
              // Initialize with metadata (including Azure bounding boxes if present)
              if (handlers.onInit) handlers.onInit(data);
              break;
              
            case 'delta':
              // Add new content to the accumulated summary
              accumulatedSummary += data.content || "";
              if (handlers.onDelta) handlers.onDelta(data.content || "");
              break;
              
            case 'complete':
              // Final complete message
              if (data.summary && data.summary !== accumulatedSummary) {
                accumulatedSummary = data.summary;
              }
              if (handlers.onComplete) handlers.onComplete(accumulatedSummary);
              break;
              
            case 'error':
              if (handlers.onError) handlers.onError(data.error || "Unknown streaming error");
              throw new Error(data.error || "Unknown streaming error");
          }
        } catch (err) {
          console.error('Error parsing JSON stream chunk:', err, 'Line:', line);
          // Continue processing other chunks even if one fails
        }
      }
    }
    
    return accumulatedSummary;
  } catch (error) {
    console.error("Error processing JSON stream:", error);
    throw error;
  }
}