"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import the PDF viewer component to avoid SSR issues
const PDFViewerInner = dynamic(
  () => import('./pdf-viewer-inner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }
);

interface PdfViewerProps {
  file: File | null;
  url?: string;
}

export function PdfViewer({ file, url }: PdfViewerProps) {
  // If neither file nor URL is provided, don't render anything
  if (!file && !url) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/30">
        <CardContent className="p-4 h-full">
          <PDFViewerInner file={file} url={url} />
        </CardContent>
      </Card>
    </div>
  );
}