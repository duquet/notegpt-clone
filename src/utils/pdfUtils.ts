import { pdfjs } from "react-pdf";

/**
 * Extracts all text from a PDF file at the given URL.
 * @param pdfUrl - The URL or path to the PDF file (e.g., "/test.pdf")
 * @returns An object with the full text and an array of text per page.
 */
export async function extractPdfText(
  pdfUrl: string
): Promise<{ text: string; pages: string[] }> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pages: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(pageText);
    }

    const text = pages.join("\n\n");
    return { text, pages };
  } catch (err) {
    console.error("Failed to extract PDF text:", err);
    throw new Error("Failed to extract PDF text");
  }
}
