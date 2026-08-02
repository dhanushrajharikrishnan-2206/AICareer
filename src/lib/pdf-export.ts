/**
 * Client-side utility for exporting HTML DOM elements as downloadable PDF files.
 * Dynamically imports html2pdf.js to avoid Next.js SSR issues, with window.print() fallback.
 */

export interface PdfExportOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  scale?: number;
}

export async function downloadElementAsPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`PDF Export Error: Element with ID #${elementId} not found.`);
    window.print();
    return false;
  }

  const rawFilename = options.filename || "Document";
  const sanitizedFilename = rawFilename
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const finalFilename = sanitizedFilename.toLowerCase().endsWith(".pdf")
    ? sanitizedFilename
    : `${sanitizedFilename || "document"}.pdf`;

  try {
    // Dynamically import html2pdf.js to ensure browser compatibility
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: options.margin ?? [8, 8, 8, 8],
      filename: finalFilename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: options.scale ?? 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4",
        orientation: "portrait" as const,
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (error) {
    console.warn("Direct PDF generation fallback to window.print():", error);
    window.print();
    return false;
  }
}
