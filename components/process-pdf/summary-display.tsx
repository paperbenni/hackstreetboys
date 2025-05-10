"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DebugTab from "@/components/DebugTab";
import { scrollableContainerStyle, ensureNoTruncation } from "@/lib/utils";

interface SummaryDisplayProps {
  summary: string;
  isLoading: boolean;
  rawMarkdown?: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  streaming?: boolean;
}

export function SummaryDisplay({ 
  summary, 
  isLoading, 
  rawMarkdown, 
  maxHeight = "70vh",
  preventTruncation = true,
  streaming = false
}: SummaryDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'debug'>('summary');
  
  // No JSON processing needed anymore
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when content updates during streaming
  useEffect(() => {
    if ((streaming || (isLoading && summary)) && contentRef.current) {
      // Auto-scroll during streaming or when both loading and has content
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [summary, isLoading, streaming]);
  
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
        <Card className="w-full h-full border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <Button
              onClick={() => setActiveTab('summary')}
              variant={activeTab === 'summary' ? 'indigo' : 'outline'}
              size="sm"
              className="rounded-b-none border-b-0"
            >
              Summary
            </Button>
            {rawMarkdown && (
              <Button
                onClick={() => setActiveTab('debug')}
                variant={activeTab === 'debug' ? 'indigo' : 'outline'}
                size="sm"
                className="rounded-b-none border-b-0"
              >
                Debug
              </Button>
            )}
          </div>
          <CardContent className="p-0 h-full">
            <div>
              <div>
                {activeTab === 'summary' && (
                  <div 
                    ref={contentRef}
                    className="p-3 sm:p-6 pb-4 sm:pb-8 h-[calc(100%-40px)] scrollable" 
                    style={{
                      ...scrollableContainerStyle(maxHeight),
                      ...(preventTruncation ? ensureNoTruncation() : {})
                    }}
                  >
                    {isLoading && !summary ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                        <div className="animate-pulse flex flex-col items-center space-y-3 sm:space-y-4 w-full">
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none h-full">
                        <div className="py-4 sm:py-6 px-3 sm:px-6 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                          {summaryParagraphs.map((paragraph, index) => (
                            <p 
                              key={`paragraph-${index}-${paragraph.length}`} 
                              className="my-2 sm:my-3 text-sm sm:text-base md:text-lg text-slate-800 dark:text-slate-300 no-truncate"
                            >
                              {paragraph}
                              {(streaming || (isLoading && summary)) && index === summaryParagraphs.length - 1 && (
                                <span className="inline-block animate-pulse">▋</span>
                              )}
                            </p>
                          ))}
                        </div>
                        {(streaming || isLoading) && (
                          <div className="text-center mt-4 text-sm text-slate-500">
                            Processing... this may take a while for large documents
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'debug' && (
                  <div className="p-3 sm:p-6 h-[calc(100%-40px)]">
                    <DebugTab 
                      markdown={rawMarkdown || ''} 
                      maxHeight={maxHeight}
                      preventTruncation={preventTruncation} 
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}