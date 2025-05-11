'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useHover } from './process-pdf/hover-context';

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
    const { hoveredCommission } = useHover();
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [textPositions, setTextPositions] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
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

    // Extract text positions from the PDF page
    async function extractTextPositions(pdfUrl: string | File, pageNumber: number) {
        let loadingTask;
        if (typeof pdfUrl === 'string') {
            loadingTask = pdfjs.getDocument(pdfUrl);
        } else {
            loadingTask = pdfjs.getDocument({ data: await pdfUrl.arrayBuffer() });
        }
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });
        const items = textContent.items.map((item: any) => {
            const transform = item.transform;
            const x = transform[4];
            const y = transform[5];
            const width = item.width;
            const height = item.height;
            return {
                text: item.str,
                x,
                y,
                width,
                height,
                page: pageNumber,
            };
        });
        setTextPositions(items);
    }

    useEffect(() => {
        if (objectUrl && pageNumber) {
            extractTextPositions(objectUrl, pageNumber);
        }
    }, [objectUrl, pageNumber]);

    // Find matches for hoveredCommission
    const highlightBoxes = hoveredCommission
        ? textPositions.filter(
            (item) => item.text.trim() === hoveredCommission.trim()
        )
        : [];

    if (!objectUrl) {
        return <div className="text-lg">Preparing PDF...</div>;
    }

    return (
        <div className={`flex flex-col items-center ${className}`} ref={containerRef}>
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
                
                {/* Highlight overlays for hovered commission */}
                {highlightBoxes.length > 0 && (
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
                        {highlightBoxes.map((item, idx) => {
                          const pdfPageHeight = pageHeightInches * 72; // 1 inch = 72 points
                          const flippedY = pdfPageHeight - item.y - item.height;
                          const svgX = (item.x / pageWidthInches / 72) * pageSize.width;
                          const svgY = (flippedY / pageHeightInches / 72) * pageSize.height;
                          const svgWidth = (item.width / pageWidthInches / 72) * pageSize.width;
                          const svgHeight = (item.height / pageHeightInches / 72) * pageSize.height;
                          const padding = 8;
                          return (
                            <rect
                              key={idx}
                              x={svgX - padding}
                              y={svgY - padding}
                              width={svgWidth + 2 * padding}
                              height={svgHeight + 2 * padding}
                              fill="rgba(255,0,0,0.3)"
                              stroke="black"
                              strokeWidth={4}
                              rx={2}
                            />
                          );
                        })}
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