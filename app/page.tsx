"use client";

import { useState, useEffect } from "react";
import { PdfUpload } from "@/components/process-pdf/pdf-upload";
import { PdfViewer } from "@/components/process-pdf/pdf-viewer";
import { PDFDataList } from "@/components/process-pdf/pdf-data-list";
import { ApiKeyWarning } from "@/components/api-key-warning";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { BoundingBox } from "@/components/PDFViewer";
import { useAtom } from "jotai";
import { pdfDataAtom } from "@/store/pdf-atoms";

export default function ProcessDocumentPage() {
  const [pdfData, setPdfData] = useAtom(pdfDataAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [visibleBoxes, setVisibleBoxes] = useState<Record<string, boolean>>({});
  const [pageWidth, setPageWidth] = useState<number>(8.5);
  const [pageHeight, setPageHeight] = useState<number>(11);

  // Load PDF data from storage when component mounts
  useEffect(() => {
    if (pdfData.lastProcessed) {
      if (pdfData.width) setPageWidth(pdfData.width);
      if (pdfData.height) setPageHeight(pdfData.height);
      
      // If we have a base64 file and no selected file, convert it back to a File object
      if (pdfData.base64File && !selectedFile && pdfData.fileName) {
        const byteString = atob(pdfData.base64File);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'application/pdf' });
        const file = new File([blob], pdfData.fileName, { type: 'application/pdf' });
        setSelectedFile(file);
      }
    }
  }, [pdfData, selectedFile]);

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  const handlePdfProcessed = (summaryText: string, markdownText: string = "") => {
    setPdfData(prev => ({
      ...prev,
      summary: summaryText,
      rawMarkdown: markdownText,
      lastProcessed: new Date().toISOString()
    }));
  };

  const handleFileSelected = async (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64.split(',')[1];
        
        setPdfData(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: file.size,
          base64File: base64Data,
          lastProcessed: null // Reset last processed since we have a new file
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPdfData(prev => ({
        ...prev,
        fileName: null,
        fileSize: null,
        base64File: undefined,
        lastProcessed: null
      }));
    }
  };

  const handleTestJsonGenerated = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      setPdfData(prev => ({
        ...prev,
        analysisData: parsedData
      }));
    } catch (error) {
      console.error("Error parsing JSON data:", error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPdfData({
      pdfUrl: undefined,
      summary: '',
      rawMarkdown: '',
      fileName: null,
      fileSize: null,
      lastProcessed: null,
      analysisData: {},
      width: undefined,
      height: undefined,
      base64File: undefined
    });
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
            onTestJsonGenerated={handleTestJsonGenerated}
          />
        </div>

        {(selectedFile || pdfData.summary || isLoading) && (
          <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 mt-2">
            {selectedFile && (
              <div className={`w-full ${pdfData.summary || isLoading ? "lg:w-1/2" : "lg:w-full"}`}>
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300 mb-2 lg:mb-4">
                  Document View
                </h2>
                <PdfViewer
                  file={selectedFile}
                  visibleBoxes={visibleBoxes}
                  pageWidthInches={pageWidth}
                  pageHeightInches={pageHeight}
                />
              </div>
            )}

            {(pdfData.summary || isLoading) && (
              <div className={`w-full ${selectedFile ? "lg:w-1/2" : "lg:w-full"} mt-4 lg:mt-0`}>
                <div className="flex items-center justify-between mb-2 lg:mb-4">
                  <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300">
                    Items
                  </h2>
                  {pdfData.summary && !isLoading && (
                    <Button
                      variant="indigo"
                      size="sm"
                      onClick={handleReset}
                      className="flex items-center gap-1 text-sm"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                  )}
                </div>
                <PDFDataList
                  data={pdfData.summary}
                  isLoading={isLoading}
                  rawMarkdown={pdfData.rawMarkdown}
                  maxHeight="70vh"
                  streaming={isLoading && Boolean(pdfData.summary)}
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
