"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/pdf-to-haiku/pdf-upload";
import { PdfViewer } from "@/components/pdf-to-haiku/pdf-viewer";
import { SummaryDisplay } from "@/components/pdf-to-haiku/summary-display";
import { ApiKeyWarning } from "@/components/api-key-warning";

export default function PdfToSummaryPage() {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  const handlePdfProcessed = (summaryText: string) => {
    setSummary(summaryText);
    setIsLoading(false);
  };

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <div className="grid grid-rows-[1fr_20px] items-start justify-items-center min-h-[calc(100vh-64px)] p-4 pb-20 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 overflow-y-auto">
      <main className="flex flex-col gap-[24px] row-start-1 items-center w-full max-w-5xl bg-white/50 dark:bg-black/20 p-6 rounded-xl shadow-lg backdrop-blur-sm border border-blue-200 dark:border-blue-800">
        <ApiKeyWarning />

        <div className="w-full">
          <PdfUpload 
              onPdfProcessedAction={handlePdfProcessed}
              onProcessingStartAction={handleProcessingStart}
              onFileSelected={handleFileSelected}
            />
        </div>
        
        {selectedFile && (
          <div className="w-full mt-2">
            <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4">Document Preview</h2>
            <PdfViewer file={selectedFile} />
          </div>
        )}

        {(summary || isLoading) && (
          <div className="w-full mt-2">
            <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4">Document Summary</h2>
            <SummaryDisplay
              summary={summary}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>
      <footer className="row-start-2 py-3 px-6"></footer>
    </div>
  );
}