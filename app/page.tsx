"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/process-pdf/pdf-upload";
import { PdfViewer } from "@/components/process-pdf/pdf-viewer";
import { SummaryDisplay } from "@/components/process-pdf/summary-display";
import { ApiKeyWarning } from "@/components/api-key-warning";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function ProcessDocumentPage() {
  const [summary, setSummary] = useState<string>("");
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  const handlePdfProcessed = (summaryText: string, markdownText: string = "") => {
    setSummary(summaryText);
    setRawMarkdown(markdownText);
    setIsLoading(false);
  };

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleNewSummary = () => {
    setSummary("");
    setRawMarkdown("");
    setIsLoading(false);
    // Keep the file selected so user can still see the PDF
  };

  return (
    <div className="grid grid-rows-[1fr_20px] items-start justify-items-center min-h-[calc(100vh-64px)] p-4 pb-20 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-y-auto">
      <main className="flex flex-col gap-[24px] row-start-1 items-center w-full max-w-7xl bg-white/50 dark:bg-black/20 p-4 md:p-6 rounded-xl shadow-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700">
        <ApiKeyWarning />

        <div className="w-full">
          <PdfUpload
            onPdfProcessedAction={handlePdfProcessed}
            onProcessingStartAction={handleProcessingStart}
            onFileSelectedAction={handleFileSelected}
          />
        </div>

        {(selectedFile || summary || isLoading) && (
          <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 mt-2">
            {selectedFile && (
              <div
                className={`w-full ${summary || isLoading ? "lg:w-1/2" : "lg:w-full"}`}
              >
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300 mb-2 lg:mb-4">
                  Document View
                </h2>
                <PdfViewer file={selectedFile} />
              </div>
            )}

            {(summary || isLoading) && (
              <div
                className={`w-full ${selectedFile ? "lg:w-1/2" : "lg:w-full"} mt-4 lg:mt-0`}
              >
                <div className="flex items-center justify-between mb-2 lg:mb-4">
                  <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300">
                    Items
                  </h2>
                  {summary && !isLoading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewSummary}
                      className="flex items-center gap-1 text-sm border-slate-200 dark:border-slate-700"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> Restart
                    </Button>
                  )}
                </div>
                <SummaryDisplay 
                  summary={summary} 
                  isLoading={isLoading} 
                  rawMarkdown={rawMarkdown}
                  maxHeight="70vh" 
                />
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="row-start-2 py-3 px-6"></footer>
    </div>
  );
}
