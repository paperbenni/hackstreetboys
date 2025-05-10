"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryDisplayProps {
  summary: string;
  isLoading: boolean;
}

export function SummaryDisplay({ summary, isLoading }: SummaryDisplayProps) {
  // Process the summary text to separate it into paragraphs
  const formatSummary = (text: string): string[] => {
    // Check if the text is empty
    if (!text) return [];

    // Extract paragraphs by looking for line breaks
    const paragraphs = text.split(/\n+/).filter(para => para.trim().length > 0);
    
    // If paragraphs exist, return them, otherwise return the whole text as one paragraph
    if (paragraphs.length > 0) {
      return paragraphs;
    }

    // Fallback: just return the text as a single paragraph
    return [text];
  };

  const summaryParagraphs = formatSummary(summary);

  return (
    <div className="w-full h-full">
      {(summary || isLoading) && (
        <Card className="w-full h-full border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/30 overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="p-3 sm:p-6 pb-4 sm:pb-8 h-full overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                  <div className="animate-pulse flex flex-col items-center space-y-3 sm:space-y-4 w-full">
                    <div className="h-3 sm:h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 dark:bg-blue-800 rounded w-4/5"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 dark:bg-blue-800 rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-blue dark:prose-invert max-w-none h-full">
                  <div className="py-4 sm:py-6 px-3 sm:px-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    {summaryParagraphs.map((paragraph, index) => (
                      <p 
                        key={index} 
                        className="my-2 sm:my-3 text-sm sm:text-base md:text-lg text-blue-800 dark:text-blue-300"
                      >
                        {paragraph}
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