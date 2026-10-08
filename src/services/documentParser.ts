export interface ParsedDocumentResult {
  text: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  fileType: "pdf" | "docx" | "txt" | "web" | "unknown";
}

/**
 * Extracts plain text from various file formats (.pdf, .docx, .txt, .md).
 * Uses dynamic imports for pdfjs-dist and mammoth to keep the initial application bundle lightweight.
 * Runs completely locally in the browser/app without sending files to external servers.
 */
export async function parseDocumentFile(file: File): Promise<ParsedDocumentResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf" || file.type === "application/pdf") {
    const [pdfjsLib, { default: pdfjsWorker }] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.mjs?url"),
    ]);

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += `[Seite ${pageNum}]\n${pageText}\n\n`;
    }

    return {
      text: fullText.trim(),
      fileName,
      fileSize,
      pageCount: pdf.numPages,
      fileType: "pdf",
    };
  }

  if (ext === "docx" || file.type.includes("wordprocessingml")) {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value.trim(),
      fileName,
      fileSize,
      fileType: "docx",
    };
  }

  // Fallback for TXT, Markdown, CSV, etc.
  const text = await file.text();
  return {
    text: text.trim(),
    fileName,
    fileSize,
    fileType: ext === "md" || ext === "txt" ? "txt" : "unknown",
  };
}
