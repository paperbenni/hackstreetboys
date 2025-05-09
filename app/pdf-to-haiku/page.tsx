"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/pdf-to-haiku/pdf-upload";
import { HaikuDisplay } from "@/components/pdf-to-haiku/haiku-display";
import { ApiKeyWarning } from "@/components/api-key-warning";

export default function PdfToHaikuPage() {
  const [haiku, setHaiku] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  const handlePdfProcessed = (haikuText: string) => {
    setHaiku(haikuText);
    setIsLoading(false);
  };

  return (
    <div className="grid grid-rows-[1fr_20px] items-center justify-items-center min-h-[calc(100vh-64px)] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900">
      <main className="flex flex-col gap-[32px] row-start-1 items-center w-full max-w-4xl bg-white/50 dark:bg-black/20 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-blue-200 dark:border-blue-800">
        <ApiKeyWarning />

        <PdfUpload 
            onPdfProcessedAction={handlePdfProcessed}
            onProcessingStartAction={handleProcessingStart}
          />

        <HaikuDisplay
          haiku={haiku}
          isLoading={isLoading}
        />
      </main>
      <footer className="row-start-2 py-3 px-6"></footer>
    </div>
  );
}