declare module "pdf-parse" {
  interface PdfParseOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagerender?: (pageData: any) => any;
    max?: number;
    version?: string;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    version: string;
    text: string;
  }

  function pdf(
    data: Buffer | Uint8Array | ArrayBuffer,
    options?: PdfParseOptions,
  ): Promise<PdfParseResult>;

  export default pdf;
}
