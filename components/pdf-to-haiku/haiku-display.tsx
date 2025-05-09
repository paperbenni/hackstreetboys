"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface HaikuDisplayProps {
  haiku: string;
  isLoading: boolean;
}

export function HaikuDisplay({ haiku, isLoading }: HaikuDisplayProps) {
  // Process the haiku text to separate it into lines
  const formatHaiku = (text: string): string[] => {
    // Check if the text is empty
    if (!text) return [];

    // Try to identify haiku format (typically 3 lines with 5-7-5 syllables)
    // Look for common haiku patterns in the response
    const haikuRegex = /([^.,!?;:\n]+[.,!?;:]?)\n([^.,!?;:\n]+[.,!?;:]?)\n([^.,!?;:\n]+[.,!?;:]?)/;
    const match = text.match(haikuRegex);

    if (match && match.length >= 4) {
      // Return the three lines of the haiku
      return [match[1].trim(), match[2].trim(), match[3].trim()];
    }

    // If no clear pattern is found, try to extract lines by looking for line breaks
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
    
    // Take the first three lines if they exist, or the whole text otherwise
    if (lines.length >= 3) {
      return lines.slice(0, 3);
    } else if (lines.length > 0) {
      return lines;
    }

    // Fallback: just return the text as a single line
    return [text];
  };

  const haikuLines = formatHaiku(haiku);

  return (
    <div className="w-full mt-8">
      {(haiku || isLoading) && (
        <Card className="w-full border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/30 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 pb-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
                    <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4"></div>
                    <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-4/5"></div>
                    <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  <div className="flex flex-col items-center text-center my-8 py-6 px-4 sm:px-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    {haikuLines.map((line, index) => (
                      <p 
                        key={index} 
                        className={`my-1.5 font-medium text-lg sm:text-xl text-blue-800 dark:text-blue-300 ${
                          index === 1 ? 'text-lg sm:text-2xl' : ''
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}