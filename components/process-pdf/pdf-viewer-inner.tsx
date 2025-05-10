"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from "lucide-react";

interface PDFViewerInnerProps {
  file: File | null;
  url?: string;
}

export default function PDFViewerInner({ file, url }: PDFViewerInnerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create object URL from File if provided
  useEffect(() => {
    let newUrl: string | null = null;

    if (file) {
      newUrl = URL.createObjectURL(file);
      setObjectUrl(newUrl);
      setIsLoading(false);
    } else if (url) {
      setObjectUrl(url);
      setIsLoading(false);
    } else {
      setObjectUrl(null);
      setIsLoading(false);
    }
    
    // Clean up the URL when component unmounts or when dependencies change
    return () => {
      if (newUrl) {
        URL.revokeObjectURL(newUrl);
      }
    };
  }, [file, url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load PDF. The file might be corrupted or your browser might not support PDF viewing.");
  };

  if (!file && !url) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full h-full max-w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      )}

      <div className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 overflow-hidden relative h-[400px] sm:h-[500px] lg:h-[600px]">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-red-500">
            <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-4" />
            <p className="text-center text-sm sm:text-base">{error}</p>
          </div>
        ) : (
          objectUrl && (
            <object
              data={objectUrl}
              type="application/pdf"
              className="w-full h-full object-contain"
              onLoad={handleLoad}
              onError={handleError}
            >
              <embed
                src={objectUrl}
                type="application/pdf"
                className="w-full h-full object-contain"
              />
              <p className="text-center p-4 text-sm sm:text-base">
                Your browser doesn&apos;t support embedded PDFs. 
                <a href={objectUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-2">
                  Click here to download the PDF
                </a>.
              </p>
            </object>
          )
        )}
      </div>
    </div>
  );
}