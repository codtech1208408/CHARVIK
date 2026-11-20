declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    enableLinks?: boolean;
    html2canvas?: any;
    jsPDF?: { unit?: string; format?: string | number[]; orientation?: 'portrait' | 'landscape' };
  }
  interface Html2PdfWorker {
    from(src: HTMLElement | string): Html2PdfWorker;
    set(opt: Html2PdfOptions): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    output(type?: string, ...args: any[]): Promise<any>;
    outputPdf(type?: string, ...args: any[]): Promise<any>;
    toPdf(): Html2PdfWorker;
    get(type: string): Promise<any>;
  }
  function html2pdf(element?: HTMLElement | string, opt?: Html2PdfOptions): Html2PdfWorker;
  export default html2pdf;
}
