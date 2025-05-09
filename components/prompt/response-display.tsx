import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatResponseTimestamp } from '@/lib/utils';
import { Markdown } from '@/components/ui/markdown';

interface ResponseDisplayProps {
  response: string;
  modelId?: string;
  timestamp?: Date;
  isLoading?: boolean;
}

export function ResponseDisplay({ 
  response, 
  modelId, 
  timestamp = new Date(),
  isLoading = false 
}: ResponseDisplayProps) {
  if (!response && !isLoading) {
    return null;
  }

  const modelName = modelId ? modelId.split('/').pop()?.replace(/-/g, ' ').replace(/:beta/, '') : 'AI';
  
  return (
    <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-blue-950/50 overflow-hidden">
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
        ) : (
          <Markdown 
            content={response} 
            className="text-gray-700 dark:text-gray-300 prose-sm md:prose-base"
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