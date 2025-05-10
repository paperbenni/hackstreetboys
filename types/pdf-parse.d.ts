declare module 'pdf-parse/lib/pdf-parse' {
  interface PdfData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: unknown;
    };
    metadata: {
      [key: string]: unknown;
    };
    version: string;
  }

  interface PdfParseOptions {
    max?: number;
    renderImages?: boolean;
    renderPages?: boolean;
    version?: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfData>;

  export default pdfParse;
}