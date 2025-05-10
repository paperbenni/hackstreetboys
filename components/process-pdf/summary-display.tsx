"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DebugTab from "@/components/DebugTab";
import EnhancedJsonTreeTab from "@/components/EnhancedJsonTreeTab";
import { scrollableContainerStyle, ensureNoTruncation, extractJsonFromMarkdown } from "@/lib/utils";

interface SummaryDisplayProps {
  summary: string;
  isLoading: boolean;
  rawMarkdown?: string;
  jsonData?: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  streaming?: boolean;
}

export function SummaryDisplay({ 
  summary, 
  isLoading, 
  rawMarkdown, 
  jsonData,
  maxHeight = "70vh",
  preventTruncation = true,
  streaming = false
}: SummaryDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'debug' | 'json'>('summary');
  
  // Extract JSON from the summary or rawMarkdown
  const extractedJsonData = useMemo(() => {
    // If jsonData is provided directly, use it
    if (jsonData) return jsonData;
    
    // Otherwise try to extract from rawMarkdown first (as it may contain more complete JSON)
    if (rawMarkdown) {
      const extracted = extractJsonFromMarkdown(rawMarkdown);
      try {
        const parsed = JSON.parse(extracted);
        if (Object.keys(parsed).length > 0 || (Array.isArray(parsed) && parsed.length > 0)) {
          return extracted;
        }
      } catch {
        // Failed to parse JSON from rawMarkdown, will try summary next
      }
    }
    
    // If no valid JSON in rawMarkdown, try the summary
    if (summary) {
      return extractJsonFromMarkdown(summary);
    }
    
    return "{}";
  }, [jsonData, rawMarkdown, summary]);
  
  // Check if we have valid JSON to display (or JSON that could be completed)
  const hasValidJson = useMemo(() => {
    try {
      const parsed = JSON.parse(extractedJsonData);
      return Object.keys(parsed).length > 0 || 
             (Array.isArray(parsed) && parsed.length > 0);
    } catch {
      // Try to complete the JSON
      try {
        const stack = [];
        let inString = false;
        let escaped = false;
        
        // Process characters looking for unclosed brackets
        for (let i = 0; i < extractedJsonData.length; i++) {
          const char = extractedJsonData[i];
          
          if (char === '"' && !escaped) {
            inString = !inString;
          }
          
          if (inString) {
            escaped = char === '\\' && !escaped;
            continue;
          }
          
          escaped = false;
          
          if (char === '{' || char === '[') {
            stack.push(char === '{' ? '}' : ']');
          } else if (char === '}' || char === ']') {
            if (stack.length === 0 || stack.pop() !== char) {
              return false;
            }
          }
        }
        
        // Don't consider completable if in middle of string
        if (inString) return false;
        
        // If we have unclosed brackets, it could be completed
        return stack.length > 0;
      } catch {
        return false;
      }
    }
  }, [extractedJsonData]);
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
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'summary'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Summary
            </button>
            {rawMarkdown && (
              <button
                onClick={() => setActiveTab('debug')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'debug'
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                Debug
              </button>
            )}
            {hasValidJson && (
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'json'
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                JSON Tree
              </button>
            )}
          </div>
          <CardContent className="p-0 h-full">
            {activeTab === 'summary' ? (
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
            ) : activeTab === 'debug' ? (
              <div className="p-3 sm:p-6 h-[calc(100%-40px)]">
                <DebugTab 
                  markdown={rawMarkdown || ''} 
                  maxHeight={maxHeight}
                  preventTruncation={preventTruncation} 
                />
              </div>
            ) : activeTab === 'json' ? (
              <div className="p-3 sm:p-6 h-[calc(100%-40px)]">
                <EnhancedJsonTreeTab
                  jsonData={extractedJsonData}
                  maxHeight={maxHeight}
                  preventTruncation={preventTruncation}
                  pollingInterval={300}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}