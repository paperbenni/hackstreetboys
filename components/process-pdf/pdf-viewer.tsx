"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';
import { BoundingBox } from '../../components/PDFViewer';

// Dynamically import the PDF viewer component to avoid SSR issues
const PDFViewer = dynamic(
  () => import('../../components/PDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }
);

interface PdfViewerProps {
  file: File | null;
  url?: string;
  boundingBoxes?: BoundingBox[];
  visibleBoxes?: Record<string, boolean>;
  pageWidthInches?: number;
  pageHeightInches?: number;
}

export function PdfViewer({ file, url, boundingBoxes = [], visibleBoxes = {}, pageWidthInches, pageHeightInches }: PdfViewerProps) {
  // If neither file nor URL is provided, don't render anything
  if (!file && !url) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30">
        <CardContent className="p-4 h-full">
          <PDFViewer
            pdfUrl={file || url || ''}
            showControls={true}
            className="w-full h-full"
            boundingBoxes={boundingBoxes}
            visibleBoxes={visibleBoxes}
            pageWidthInches={pageWidthInches}
            pageHeightInches={pageHeightInches}
          />
        </CardContent>
      </Card>
    </div>
  );
}