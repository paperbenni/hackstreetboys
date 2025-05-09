declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  function parse(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: unknown) => string;
      max?: number;
      version?: string;
    }
  ): Promise<PDFData>;

  namespace parse {
    export { parse as default };
  }

  export = parse;
}