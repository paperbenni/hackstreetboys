"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload, FileText, AlertTriangle } from "lucide-react";
import { processJsonStreamingResponse } from "@/lib/utils";

interface PdfUploadProps {
  onPdfProcessedAction: (summary: string, rawMarkdown?: string) => void;
  onProcessingStartAction: () => void;
  onFileSelectedAction: (file: File | null) => void;
  onTestJsonGenerated?: (jsonData: string) => void;
}

export function PdfUpload({
  onPdfProcessedAction,
  onProcessingStartAction,
  onFileSelectedAction,
  onTestJsonGenerated,
}: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelectedAction(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check if file is a PDF
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are accepted");
      return false;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return false;
    }

    // Clear any previous errors
    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelectedAction(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadPdf = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      onProcessingStartAction();

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/process-pdf-parallel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.error || `Request failed with status ${response.status}`,
        );
      }

      // Check response content type to determine if we got a streaming response
      const contentType = response.headers.get("Content-Type") || "";
      
      if (contentType.includes("x-ndjson") || contentType.includes("text/event-stream")) {
        // Handle streaming response
        let rawMarkdownText = "";
        let accumulatedContent = "";
        
        await processJsonStreamingResponse(response, {
          onInit: (data) => {
            // Initialize with raw markdown and Azure bounding box data
            rawMarkdownText = data.rawMarkdown ? String(data.rawMarkdown) : "";
            // Immediately update the UI with the raw markdown and Azure data (empty summary at this point)
            onPdfProcessedAction("", rawMarkdownText);
            // Pass Azure bounding box data to the PDF viewer if available
            if (data.azureResult && onTestJsonGenerated) {
              onTestJsonGenerated(JSON.stringify(data.azureResult));
            }
          },
          onDelta: (content) => {
            // Ensure content is a string before adding to accumulated content
            const contentStr = String(content);
            accumulatedContent += contentStr;
            // Update UI with each new piece of content
            // For the debug view, append the streaming content to the original raw markdown
            // This preserves the header information while showing streaming updates
            onPdfProcessedAction(accumulatedContent, `${rawMarkdownText}\n\n--- Streaming Content ---\n\n${accumulatedContent}`);
          },
          onComplete: (summary) => {
            // Final update with complete summary
            // Include both the raw markdown and the final summary in the debug view
            onPdfProcessedAction(summary, `${rawMarkdownText}\n\n--- Complete Summary ---\n\n${summary}`);
            setError(null);
            // Only stop loading when complete
            setIsUploading(false);
          },
          onError: (error) => {
            throw new Error(error);
          }
        });
      } else {
        // Handle non-streaming response
        const data = await response.json();
        
        if (data.summary) {
          onPdfProcessedAction(String(data.summary || ""), String(data.rawMarkdown || ""));
          setError(null);
        } else {
          throw new Error("No summary returned from server");
        }
        
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Error uploading PDF:", err);
      // Handle specific error messages from the server
      if (err instanceof Error) {
        const errorMsg = err.message;
        if (
          errorMsg.includes("empty") ||
          errorMsg.includes("too little text")
        ) {
          setError(
            "The PDF appears to be empty or contains too little text to generate a summary.",
          );
        } else if (errorMsg.includes("PDF parsing failed")) {
          setError(
            "Failed to read the PDF. The file might be corrupted or password-protected.",
          );
        } else {
          setError(errorMsg);
        }
      } else {
        setError("An unknown error occurred");
      }
      onPdfProcessedAction("", ""); // Clear any previous response
      setIsUploading(false); // Make sure to set loading state to false on error
    }
    // Removed finally block to manage loading state within the request callbacks
  };

  // Generate test JSON data for demo purposes
  const generateTestJsonData = () => {
    const sampleJson = `
[
  {
    "name": "Innentüren",
    "content": [
      {
        "name": "Holztüren mit Stahl-U-Zarge",
        "content": [
          {
            "sku": "620001",
            "description": "Nuss furniert - 80cm Breite",
            "price": 399.99,
            "available": true,
            "properties": {
              "material": "Nuss furniert",
              "width": 80,
              "height": 200,
              "warranty": "5 Jahre"
            }
          },
          {
            "sku": "620002",
            "description": "Eiche furniert - 80cm Breite",
            "price": 349.99,
            "available": true,
            "properties": {
              "material": "Eiche furniert",
              "width": 80,
              "height": 200,
              "warranty": "5 Jahre"
            }
          }
        ]
      },
      {
        "name": "Glastüren mit Holzzarge",
        "content": [
          {
            "sku": "620010",
            "description": "Milchglas - 80cm Breite",
            "price": 499.99,
            "available": false,
            "properties": {
              "material": "Milchglas",
              "width": 80,
              "height": 200,
              "warranty": "3 Jahre"
            }
          }
        ]
      }
    ]
  },
  {
    "name": "Außentüren",
    "content": [
      {
        "name": "Haustüren",
        "content": [
          {
            "sku": "630001",
            "description": "Sicherheitstür Stahl - 100cm Breite",
            "price": 899.99,
            "available": true,
            "properties": {
              "material": "Stahl",
              "width": 100,
              "height": 210,
              "warranty": "10 Jahre",
              "securityClass": "RC3"
            }
          }
        ]
      }
    ]
  }
]`;
    
    // Generate a fake summary and store sample JSON in rawMarkdown
    const summary = "Sample summary of items ordered from the catalog.";
    const rawMarkdown = `\`\`\`json\n${sampleJson}\n\`\`\``;
    
    // Call the processing action with our sample data
    onPdfProcessedAction(summary, rawMarkdown);
    
    // If we have a callback for JSON data, extract the JSON and call it
    if (onTestJsonGenerated) {
      onTestJsonGenerated(sampleJson);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30">
        <CardHeader className="pb-5">
          <CardTitle className="text-xl text-slate-800 dark:text-slate-300">
            Process Documents
          </CardTitle>
          <CardDescription className="mt-1">
            Upload a PDF document to extract the orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-500 bg-slate-50 dark:bg-slate-800/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="application/pdf"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-4">
              {selectedFile ? (
                <>
                  <FileText className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium mt-2">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium mt-2">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 rounded-md flex items-start animate-fade-in">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            {/* Always show Test JSON button */}
            <Button
              type="button"
              variant="outline"
              className="mr-auto border-slate-200 dark:border-slate-700"
              onClick={generateTestJsonData}
              disabled={isUploading}
            >
              Generate Test JSON
            </Button>
            
            {selectedFile && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="mr-3 border-slate-200 dark:border-slate-700"
                  onClick={resetState}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                  onClick={uploadPdf}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Process"
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}