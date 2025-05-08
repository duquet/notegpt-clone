# PDF vs Video Handling in NoteGPT

This document explains how the application determines whether to display a PDF or video, and how it processes each type of content.

## URL Parameter Detection

When accessing a URL like `http://localhost:3000/workspace/detail/123?type=pdf&pdfUrl=/test.pdf`, the application processes the parameters as follows:

```typescript
const searchParams = useSearchParams();
const type = searchParams.get("type");
const pdfUrl = searchParams.get("pdfUrl");
const isPDF = type === "pdf" && !!pdfUrl;
```

- Gets `type=pdf` from the URL parameters
- Gets `pdfUrl=/test.pdf` from the URL parameters
- Sets `isPDF` to `true` when both conditions are met:
  - `type === "pdf"`
  - `!!pdfUrl` is true (URL exists)

## Content Loading Logic

### Early Return for PDFs

```typescript
useEffect(() => {
  if (isPDF) {
    setLoading(false);
    return;
  }
  // ... video fetching logic ...
}, [params.id, recentVideos, isPDF]);
```

This effect hook:

- Checks if `isPDF` is true
- If true, sets `loading` to false and returns early
- Prevents video fetching logic from running for PDFs

### PDF Processing

```typescript
useEffect(() => {
  if (isPDF && pdfUrl) {
    setPdfSummaryLoading(true);
    setPdfSummaryError(null);
    extractPdfText(pdfUrl).then(({ text, pages }) => {
      setPdfText(text);
      setPdfNumPages(pages.length);
      // Additional PDF processing...
    });
  }
}, [isPDF, pdfUrl]);
```

A dedicated effect hook:

- Runs when both `isPDF` and `pdfUrl` are present
- Extracts text from the PDF
- Updates state with PDF content and metadata

## Rendering Logic

```typescript
{isPDF ? (
  <PDFViewer url={pdfUrl} />
) : (
  // Video player code...
)}
```

The component:

- Renders `PDFViewer` when `isPDF` is true
- Renders video player when `isPDF` is false

## Flow Summary

When visiting a PDF URL:

1. URL parameters set `isPDF` to `true`
2. Video fetching effect returns early
3. PDF processing effect runs
4. PDFViewer component renders

When visiting a video URL:

1. URL parameters set `isPDF` to `false`
2. Video fetching effect runs
3. Video processing occurs
4. Video player component renders

## Key Points

- The `isPDF` flag is the primary control for PDF vs video behavior
- Early returns prevent unnecessary video processing for PDFs
- Separate effect hooks handle PDF and video processing
- Component rendering is conditionally based on `isPDF`
