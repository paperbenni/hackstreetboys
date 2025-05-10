import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatResponseTimestamp, extractJsonFromMarkdown } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';
import JsonTreeTab from '@/components/JsonTreeTab';

interface ResponseDisplayProps {
  response: string;
  modelId?: string;
  timestamp?: Date;
  isLoading?: boolean;
  maxHeight?: string;
  preventTruncation?: boolean;
  maxContentSize?: number;
  showJsonTree?: boolean;
  rawJsonData?: string;
}

export function ResponseDisplay({ 
  response, 
  modelId, 
  timestamp = new Date(),
  isLoading = false,
  maxHeight = "70vh",
  preventTruncation = true,
  maxContentSize = 100000000, // Default to 100MB to handle large responses
  showJsonTree = true,
  rawJsonData
}: ResponseDisplayProps) {
  // Define hooks at the top level, before any conditional returns
  const [activeTab, setActiveTab] = useState<'response' | 'json'>('response');
  
  // Extract JSON from the response or use provided rawJsonData
  const jsonData = useMemo(() => {
    if (rawJsonData) return rawJsonData;
    if (!response || !showJsonTree) return null;
    return extractJsonFromMarkdown(response);
  }, [response, showJsonTree, rawJsonData]);
  
  // Check if extracted JSON is valid and non-empty
  const hasValidJson = useMemo(() => {
    if (!jsonData) return false;
    try {
      const parsed = JSON.parse(jsonData);
      return Object.keys(parsed).length > 0 || 
             (Array.isArray(parsed) && parsed.length > 0);
    } catch {
      return false;
    }
  }, [jsonData]);
  
  if (!response && !isLoading) {
    return null;
  }

  const modelName = modelId ? modelId.split('/').pop()?.replace(/-/g, ' ').replace(/:beta/, '') : 'AI';
  
  return (
    <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-blue-950/50 overflow-hidden scrollable">
      <CardHeader className="pb-2 bg-blue-50/70 dark:bg-blue-900/40">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md text-blue-700 dark:text-blue-300 capitalize">
            {modelName} Response
          </CardTitle>
          {timestamp && (
            <CardDescription className="text-blue-600/70 dark:text-blue-400/70 text-xs">
              {formatResponseTimestamp(timestamp)}
            </CardDescription>
          )}
        </div>
        
        {/* Tab buttons - only show when response is loaded and JSON is available */}
        {!isLoading && hasValidJson && (
          <div className="flex mt-2 border-b border-blue-200 dark:border-blue-800">
            <button
              onClick={() => setActiveTab('response')}
              className={`px-3 py-1 text-xs font-medium rounded-t-md ${
                activeTab === 'response'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-blue-600/70 dark:text-blue-400/70 hover:bg-blue-50 dark:hover:bg-blue-900/50'
              }`}
            >
              Response
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 text-xs font-medium rounded-t-md ${
                activeTab === 'json'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-blue-600/70 dark:text-blue-400/70 hover:bg-blue-50 dark:hover:bg-blue-900/50'
              }`}
            >
              JSON Tree
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-blue-400 dark:bg-blue-600 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 dark:bg-blue-600 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 dark:bg-blue-600 rounded-full"></div>
            </div>
          </div>
        ) : activeTab === 'response' ? (
          <Markdown 
            content={response} 
            className="text-gray-700 dark:text-gray-300 prose-sm md:prose-base"
            maxHeight={maxHeight}
            preventTruncation={preventTruncation}
            maxContentSize={maxContentSize}
          />
        ) : (
          <JsonTreeTab
            jsonData={jsonData || '{}'}
            maxHeight={maxHeight}
            preventTruncation={preventTruncation}
          />
        )}
      </CardContent>
      {!isLoading && (
        <CardFooter className="pt-2 pb-3 text-xs text-blue-500 dark:text-blue-400 flex justify-end italic">
          Generated with OpenRouter
        </CardFooter>
      )}
    </Card>
  );
}