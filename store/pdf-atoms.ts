import { atomWithStorage } from 'jotai/utils';

interface PDFData {
    pdfUrl: string;
    analysisData: Record<string, unknown>;
    width?: number;
    height?: number;
}

// Use atomWithStorage to persist the state
export const pdfDataAtom = atomWithStorage<PDFData | null>('pdfData', null);