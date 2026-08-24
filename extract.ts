/**
 * Client-side text extraction.
 * - PDF: pdfjs-dist, grouping text items into lines/paragraphs to keep formatting.
 * - Images: tesseract.js OCR.
 * Both are dynamically imported so nothing browser-only runs during SSR.
 */

export type ExtractProgress = (stage: string, pct: number) => void;

export interface ExtractionResult {
  text: string;
  kind: "pdf" | "image";
  pages?: number;
  confidence?: number;
}

export function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImage(file: File) {
  return file.type.startsWith("image/");
}

export async function extractFromPdf(
  file: File,
  onProgress?: ExtractProgress,
): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    onProgress?.(`Reading page ${p} of ${doc.numPages}`, Math.round((p / doc.numPages) * 100));
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Group items by their vertical position so line breaks survive.
    const lines = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!("transform" in item)) continue;
      const y = Math.round(item.transform[5] ?? 0);
      const x = item.transform[4] ?? 0;
      const bucket = [...lines.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      const arr = lines.get(bucket) ?? [];
      arr.push({ x, str: item.str });
      lines.set(bucket, arr);
    }

    const ordered = [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join("")
          .replace(/\s+/g, " ")
          .trim(),
      );

    pageTexts.push(ordered.join("\n").replace(/\n{3,}/g, "\n\n").trim());
  }

  return { text: pageTexts.join("\n\n").trim(), kind: "pdf", pages: doc.numPages };
}

export async function extractFromImage(
  file: File,
  onProgress?: ExtractProgress,
): Promise<ExtractionResult> {
  const { default: Tesseract } = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status && typeof m.progress === "number") {
        onProgress?.(m.status.replace(/_/g, " "), Math.round(m.progress * 100));
      }
    },
  });
  return {
    text: (data.text ?? "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    kind: "image",
    confidence: data.confidence,
  };
}

export async function extractText(
  file: File,
  onProgress?: ExtractProgress,
): Promise<ExtractionResult> {
  if (isPdf(file)) return extractFromPdf(file, onProgress);
  if (isImage(file)) return extractFromImage(file, onProgress);
  throw new Error("Unsupported file type. Upload a PDF or an image (PNG, JPG, WEBP).");
}
