"use client";

import { useState } from "react";
import { PdfUpload } from "@/components/process-pdf/pdf-upload";
import { PdfViewer } from "@/components/process-pdf/pdf-viewer";
import { PDFDataList } from "@/components/process-pdf/pdf-data-list";
import { ApiKeyWarning } from "@/components/api-key-warning";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { BoundingBox } from "@/components/PDFViewer";

import { useHover } from '@/components/process-pdf/hover-context';
import { HoverProvider } from '@/components/process-pdf/hover-context';


export default function ProcessDocumentPage() {
  const [summary, setSummary] = useState<string>("");
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [visibleBoxes, setVisibleBoxes] = useState<Record<string, boolean>>({});
  const [pageWidth, setPageWidth] = useState<number>(8.5);
  const [pageHeight, setPageHeight] = useState<number>(11);
  const [hoveredCommission, setHoveredCommission] = useState<string | null>(null);

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  const handlePdfProcessed = (summaryText: string, markdownText: string = "") => {
    setSummary(summaryText);
    setRawMarkdown(markdownText);
    // Keep loading state true while streaming is happening
    // The loading state will be set to false only when processing is complete
    // in the PdfUpload component's onComplete handler
  };

  const handleTestJsonGenerated = (jsonData: string) => {
    try {
      // Parse the JSON data
      const data = JSON.parse(jsonData);
      
      // If it's from Azure processing, extract bounding boxes
      if (data.commissionData && Array.isArray(data.commissionData)) {
        // Process to our BoundingBox format
        const boxes: BoundingBox[] = data.commissionData.map((item: {
          id: string;
          coordinates: number[];
          commission: string;
        }) => ({
          id: item.id,
          coordinates: item.coordinates,
          color: "rgba(255, 0, 0, 0.2)",
          strokeColor: "red",
        }));
        
        // Set the bounding boxes and make all visible by default
        setBoundingBoxes(boxes);
        const boxVisibility: Record<string, boolean> = {};
        boxes.forEach(box => {
          boxVisibility[box.id] = true;
        });
        setVisibleBoxes(boxVisibility);
        
        // Set page dimensions if provided
        if (data.pageWidthInches && data.pageHeightInches && data.pageWidthInches > 1 && data.pageHeightInches > 1) {
          setPageWidth(data.pageWidthInches);
          setPageHeight(data.pageHeightInches);
        } else {
          setPageWidth(8.27); // A4 width in inches
          setPageHeight(11.69); // A4 height in inches
        }
      }
      
      // No longer processing JSON content
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing JSON data:", err);
      setIsLoading(false);
    }
  };

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
    // Reset bounding boxes when a new file is selected
    setBoundingBoxes([]);
    setVisibleBoxes({});
  };

  const handleNewSummary = () => {
    setSummary("");
    setRawMarkdown("");
    setIsLoading(false);
    // Keep the file selected so user can still see the PDF
    // But reset the bounding boxes
    setBoundingBoxes([]);
    setVisibleBoxes({});
  };

  const value = {
    hoveredCommission,
    setHoveredCommission,
    // ...other context values
  };

  return (
    <HoverProvider>
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

          {(selectedFile || summary || isLoading) && (
            <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 mt-2 min-h-0 flex-grow">
              {selectedFile && (
                <div
                  className={`w-full ${summary || isLoading ? "lg:w-1/2" : "lg:w-full"} flex flex-col min-h-0 flex-grow`}
                >
                  <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300 mb-2 lg:mb-4">
                    Document View
                  </h2>
                  <div className="flex-grow min-h-0 overflow-hidden">
                    <PdfViewer 
                      file={selectedFile} 
                      boundingBoxes={boundingBoxes}
                      visibleBoxes={visibleBoxes}
                      pageWidthInches={pageWidth}
                      pageHeightInches={pageHeight}
                    />
                  </div>
                </div>
              )}

              {(summary || isLoading) && (
                <div
                  className={`w-full ${selectedFile ? "lg:w-1/2" : "lg:w-full"} mt-4 lg:mt-0 flex flex-col min-h-0 flex-grow`}
                >
                  <div className="flex items-center justify-between mb-2 lg:mb-4">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-300">
                      Items
                    </h2>
                    {summary && !isLoading && (
                      <Button
                        variant="indigo"
                        size="sm"
                        onClick={handleNewSummary}
                        className="flex items-center gap-1 text-sm"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" /> Restart
                      </Button>
                    )}
                  </div>
                  <div className="flex-grow min-h-0 overflow-hidden">
                    <PDFDataList 
                      data={summary} 
                      isLoading={isLoading} 
                      rawMarkdown={rawMarkdown}
                      maxHeight="70vh"
                      streaming={isLoading && Boolean(summary)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        <footer className="row-start-2 py-3 px-6"></footer>
      </div>
    </HoverProvider>
  );
}
