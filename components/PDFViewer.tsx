'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker for react-pdf
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface BoundingBox {
    id: string;
    coordinates: number[];  // Flat array format: [x1,y1,x2,y2,x3,y3,x4,y4]
    color?: string;
    strokeColor?: string;
}

interface PDFViewerProps {
    pdfUrl: string | File;
    boundingBoxes?: BoundingBox[];
    visibleBoxes?: Record<string, boolean>;
    showControls?: boolean;
    className?: string;
    pageWidthInches?: number;
    pageHeightInches?: number;
}

export default function PDFViewer({
    pdfUrl,
    boundingBoxes = [],
    visibleBoxes = {},
    showControls = true,
    className = '',
    pageWidthInches = 8.2639,
    pageHeightInches = 11.6806
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const FIXED_PDF_WIDTH = 500; // px (smaller display)
    const aspectRatio = pageHeightInches / pageWidthInches;
    const renderedHeight = FIXED_PDF_WIDTH * aspectRatio;
    const pageSize = { width: FIXED_PDF_WIDTH, height: renderedHeight };
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        // If pdfUrl is a File, create an object URL
        if (pdfUrl instanceof File) {
            const url = URL.createObjectURL(pdfUrl);
            setObjectUrl(url);
            
            // Clean up the URL when component unmounts
            return () => {
                URL.revokeObjectURL(url);
            };
        } else if (typeof pdfUrl === 'string') {
            // If it's already a string URL, just use it
            setObjectUrl(pdfUrl);
        }
    }, [pdfUrl]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    if (!objectUrl) {
        return <div className="text-lg">Preparing PDF...</div>;
    }

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="relative" style={{ width: FIXED_PDF_WIDTH, height: renderedHeight }}>
                <Document
                    file={objectUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center"
                    loading={<div className="text-lg">Loading PDF...</div>}
                    error={<div className="text-lg text-red-500">Error loading PDF!</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-lg"
                        loading={<div className="text-lg">Loading page...</div>}
                        width={FIXED_PDF_WIDTH}
                    />
                </Document>
                {/* Polygon overlays */}
                {boundingBoxes.length > 0 && (
                    <svg
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: pageSize.width,
                            height: pageSize.height,
                            pointerEvents: 'none',
                        }}
                        width={pageSize.width}
                        height={pageSize.height}
                    >
                        {boundingBoxes.map((box) =>
                            visibleBoxes[box.id] && (
                                <polygon
                                    key={box.id}
                                    points={box.coordinates.map((coord, index) => {
                                        const isX = index % 2 === 0;
                                        const value = isX
                                            ? (coord / pageWidthInches) * pageSize.width
                                            : (coord / pageHeightInches) * pageSize.height;
                                        return value;
                                    }).join(",")}
                                    fill={box.color || "rgba(255,0,0,0.2)"}
                                    stroke={box.strokeColor || "red"}
                                    strokeWidth={2}
                                />
                            )
                        )}
                    </svg>
                )}
            </div>

            {showControls && numPages && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                        onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                        disabled={pageNumber <= 1}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <p className="text-lg text-center">
                        Page {pageNumber} of {numPages}
                    </p>
                    <button
                        onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                        disabled={pageNumber >= numPages}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}