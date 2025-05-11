import { atomWithStorage } from 'jotai/utils';

interface PDFData {
    pdfUrl: string | undefined;
    summary: string;
    rawMarkdown: string;
    fileName: string | null;
    fileSize: number | null;
    lastProcessed: string | null;
    analysisData: Record<string, unknown>;
    width?: number;
    height?: number;
    base64File?: string; // Store the PDF file as base64
}

// Use atomWithStorage to persist the state with a default value
export const pdfDataAtom = atomWithStorage<PDFData>('pdfData', {
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