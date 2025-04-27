// Content Type Definitions
export interface ContentType {
  type: "video" | "pdf";
}

export interface VideoContent extends ContentType {
  type: "video";
  videoId: string;
}

export interface PDFContent extends ContentType {
  type: "pdf";
  pdfUrl: string;
}

export type ContentDetails = VideoContent | PDFContent;

// Type Guards
export function isPdfContent(content: ContentDetails): content is PDFContent {
  return content.type === "pdf";
}

export function isVideoContent(
  content: ContentDetails
): content is VideoContent {
  return content.type === "video" || !content.type; // Default to video
}

// URL Validation
export function validatePdfUrl(url: string | null): boolean {
  return (
    url !== null &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/"))
  );
}

// URL Parameter Extraction
export function extractContentDetails(
  id: string,
  type: string | null,
  pdfUrl: string | null
): ContentDetails {
  if (type === "pdf" && validatePdfUrl(pdfUrl)) {
    return {
      type: "pdf",
      pdfUrl: pdfUrl!,
    };
  }

  // Default to video content
  return {
    type: "video",
    videoId: id,
  };
}
