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

interface PdfUploadProps {
  onPdfProcessedAction: (summary: string, rawMarkdown?: string) => void;
  onProcessingStartAction: () => void;
  onFileSelectedAction: (file: File | null) => void;
}

export function PdfUpload({
  onPdfProcessedAction,
  onProcessingStartAction,
  onFileSelectedAction,
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

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.error || `Request failed with status ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.summary) {
        onPdfProcessedAction(data.summary, data.rawMarkdown);
        // Don't reset the selected file after successful processing
        setError(null);
      } else {
        throw new Error("No summary returned from server");
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800 dark:text-blue-300">
            Process Documents
          </CardTitle>
          <CardDescription>
            Upload a PDF document extract the orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
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

            <div className="flex flex-col items-center justify-center gap-3">
              {selectedFile ? (
                <>
                  <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium">
                      Drop your PDF here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 rounded-md flex items-start animate-fade-in">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            {selectedFile && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2 border-blue-200 dark:border-blue-800"
                  onClick={resetState}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
