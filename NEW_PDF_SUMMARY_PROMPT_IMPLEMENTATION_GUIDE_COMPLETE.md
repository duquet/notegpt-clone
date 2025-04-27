# PDF Processing and Summarization Implementation Guide

## GOLDEN RULE: Preserve Existing Functionality

The most critical principle of this implementation is that **existing video functionality must remain completely unchanged**. Any deviation from this rule is considered a bug that must be fixed immediately.

### URL Patterns and Content Type Detection

- **Video URLs (Default Behavior)**

  - Standard video URL pattern: `http://localhost:3003/workspace/detail/[videoId]`
  - No `type` parameter needed - any URL without explicit type is treated as YouTube video
  - Supports all YouTube video types (educational, music, tutorials, etc.)
  - Examples:
    ```
    ✅ http://localhost:3003/workspace/detail/[any-valid-youtube-id]
    ✅ http://localhost:3003/workspace/detail/dQw4w9WgXcQ    # Music video
    ✅ http://localhost:3003/workspace/detail/jNQXAC9IVRw    # First YouTube video
    ```
  - Adding `type` parameter is unnecessary and should be avoided:
    ```
    ❌ http://localhost:3003/workspace/detail/[videoId]?type=video    # Don't add type
    ```

- **PDF URLs (Explicit Type Required)**
  - PDF URL pattern: `http://localhost:3003/workspace/detail/[id]?type=pdf&pdfUrl=[url]`
  - Must explicitly include `type=pdf` to override default video behavior
  - Must include `pdfUrl` parameter with valid PDF URL
  - Example:
    ```
    ✅ http://localhost:3003/workspace/detail/doc1?type=pdf&pdfUrl=https://example.com/doc.pdf
    ```

## Table of Contents

1. [Core Features](#core-features)
2. [Architecture](#architecture)
3. [UI/UX Layout & Wireframes](#uiux-layout--wireframes)
4. [Component Breakdown](#component-breakdown)
5. [File & Folder Structure](#file--folder-structure)
6. [Styling & Theming](#styling--theming)
7. [Workflow & User Journey](#workflow--user-journey)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [End-to-End Flow](#end-to-end-flow)
10. [OpenAI Prompt/Response Reference](#openai-promptresponse-reference)
11. [Step-by-Step Cursor Prompts](#step-by-step-cursor-prompts)
12. [PDFWorker Component](#pdfworker-component)
13. [Prompt Management](#prompt-management)
14. [package.json Changes](#packagejson-changes)
15. [Current Code Behavior & Tradeoffs](#current-code-behavior--tradeoffs)
16. [Appendix: Sample Data & URLs](#appendix-sample-data--urls)
17. [Dependency Setup & Worker File Copy](#dependency-setup--worker-file-copy)
18. [PDFWorker Registration & Troubleshooting](#pdfworker-registration--troubleshooting)
19. [Button Behaviors, Tooltips, and Wireframes](#button-behaviors--tooltips--wireframes)
20. [Handling PDFs with Images, Tables, and OCR](#handling-pdfs-with-images--tables--ocr)
21. [Prompt Type Selection UI](#prompt-type-selection-ui)
22. [Logging and Debugging Tips](#logging-and-debugging-tips)
23. [Static Assets and Worker Files](#static-assets-and-worker-files)
24. [Step-by-Step User Story](#step-by-step-user-story)
25. [Global PDFWorker Registration](#global-pdfworker-registration)
26. [Chunk Processing and Translation Limits](#chunk-processing-and-translation-limits)
27. [OCR Integration for Scanned PDFs](#ocr-integration-for-scanned-pdfs)
28. [PDF Prompt Library and Custom Prompt](#pdf-prompt-library-and-custom-prompt)
29. [Pre-Launch Checklist](#pre-launch-checklist)
30. [Cross-Platform Compatibility](#cross-platform-compatibility)
31. [UI Screenshots and Mockups](#ui-screenshots-and-mockups)
32. [References for OCR Integration](#references-for-ocr-integration)
33. [Lessons Learned](#lessons-learned)

## Core Features

- PDF text extraction and structure analysis
- Automatic summarization using OpenAI
- UI/UX mirroring the YouTube video detail page (except left column is PDF viewer, no transcript)
- Shared controls (Summarize, Add Note, Quiz, etc.) with consistent styling
- Dark mode support
- PDF upload (on Create/Home page) and view via URL

## Architecture

| Layer        | Key Components                                     |
| ------------ | -------------------------------------------------- |
| Frontend     | PDFViewer, SummaryCard, SharedControls, Layout     |
| Backend/API  | PDF text extraction, OpenAI summarization endpoint |
| Shared Utils | Prompt generation, error handling, chunking        |

## UI/UX Layout & Wireframes

### Main Detail Page Layout (type=pdf)

#### Left Column (PDF Viewer) Button Groups

| Group      | Alignment     | Buttons/Controls (in order)                           | Notes                                                                |
| ---------- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Top-Left   | Left-aligned  | Edit filename (clickable), Preview mode               | Edit filename is UI-only; Preview mode switches to text view (guess) |
| Top-Center | Centered      | Page navigation (prev/next), Zoom in/out, Page number | Evenly spaced, matches video player nav/zoom controls                |
| Top-Right  | Right-aligned | Download, Print                                       | Standard PDF actions                                                 |
| Below PDF  | Centered      | Copy, Language                                        | Copy copies all PDF text; Language triggers translation              |

**Wireframe (Markdown Table):**

|        | Left (PDF)               | Right (Summary/Notes/Quiz)          |
| ------ | ------------------------ | ----------------------------------- |
| Header | [Edit filename, Preview] | [Summarize, Add Note, Quiz, ...]    |
|        | [Nav, Zoom, Page #]      |                                     |
|        | [Download, Print]        |                                     |
| Main   | PDFViewer                | Summary/Notes/Quiz (cards/sections) |
| Footer | [Copy, Language]         |                                     |

- **Preview Mode (guess):** Shows the PDF as extracted text instead of rendered PDF. Top left column buttons change to reflect this mode.
- **Edit Filename:** UI-only by default; see tradeoffs below.
- **Copy/Language:** Copy copies all extracted PDF text; Language translates the PDF text (not just UI labels).

## Component Breakdown

| Component      | Purpose/Props                                 |
| -------------- | --------------------------------------------- |
| PDFViewer      | Renders PDF, supports nav/zoom/download       |
| SummaryCard    | Displays summary/notes/quiz, markdown support |
| SharedControls | Summarize, Add Note, Quiz buttons (MUI)       |
| Layout         | Responsive grid, dark mode support            |
| UploadPDF      | (Create/Home) Handles PDF upload              |

## File & Folder Structure

**Example (Next.js/MUI):**

```plaintext
src/
  app/
    workspace/
      detail/[id]/page.tsx      # Main detail page (handles both video/pdf)
  components/
    PDFViewer.tsx               # PDF viewer component
    SummaryCard.tsx             # Summary/Note/Quiz card
    SharedControls.tsx          # Shared buttons/controls
    UploadPDF.tsx               # PDF upload (Create/Home)
  utils/
    pdfUtils.ts                 # PDF extraction, structure analysis
    pdfPrompts.ts               # PDF prompt generation
    openAiService.ts            # OpenAI API integration
```

- Use PascalCase for components, kebab-case for files.

## Styling & Theming

- Use MUI for all UI components.
- Match button sizes, colors, and spacing to the YouTube video detail page.
- Use MUI's dark mode support (`ThemeProvider`, `palette.mode`).
- Shared button styles/components for consistency.

## Workflow & User Journey

1. **Upload PDF** (on Create/Home page) or access via URL (e.g., `/workspace/detail/123?type=pdf&pdfUrl=/test.pdf`)
2. **Detail Page Loads**
   - Left: PDFViewer displays the PDF
   - Right: Shared controls (Summarize, Add Note, Quiz, etc.)
3. **On Load**
   - PDF text is extracted
   - Default PDF summary is generated automatically
4. **User Actions**
   - Click Summarize: Regenerates summary
   - Add Note: Creates a note card
   - Quiz: Generates quiz cards
5. **All controls and cards match the video detail page in look and feel**

## Edge Cases & Error Handling

- PDF fails to load: Show error message in PDFViewer
- PDF is empty: Show 'No content found' message
- API errors (summarization): Show error toast/snackbar
- Unsupported file type: Show validation error on upload
- Loading states: Show spinners/placeholders for all async actions

## End-to-End Flow

1. User uploads or opens a PDF
2. App navigates to `/workspace/detail/[id]?type=pdf&pdfUrl=...`
3. PDFViewer loads and displays the PDF
4. App extracts text and structure from PDF
5. App generates and displays the default PDF summary (see prompt below)
6. User can regenerate summary, add notes, or generate quiz cards
7. All UI/UX matches the YouTube video detail page except for the left column (PDF vs. video)

## OpenAI Prompt/Response Reference

**System Prompt:**

```
You are a helpful assistant that summarizes content according to specific instructions. Format your response in Markdown with appropriate headings, paragraphs, and bullet points as needed.
```

**User Prompt (auto-generated, with PDF metadata and extracted text):**

```
You are a specialized PDF document analyzer focused on accuracy and factual representation. Your primary rule is to NEVER add information that is not explicitly present in the document. Analyze and extract key information from this {pageCount}-page PDF document titled "{title}".

IMPORTANT RULES:
1. ONLY include information that is explicitly stated in the document
2. DO NOT make assumptions or inferences beyond what is directly supported by the text
3. If a section would be empty or cannot be filled with factual content from the document, mark it as "Not provided in document"
4. Use direct quotes when possible to support key points
5. If uncertain about any detail, err on the side of omission rather than speculation

[Rest of the prompt template...]
```

## Step-by-Step Cursor Prompts

"Hey Cursor, do this:  
In `package.json`, ensure the following dependencies are present with the **exact versions** currently in use:

- `pdfjs-dist@^3.11.174` (for PDF parsing and rendering)
- `@mui/material@^6.4.8` (for UI components)
- `@mui/icons-material@^6.4.8` (for icons)
- `@emotion/react@^11.14.0` and `@emotion/styled@^11.14.0` (for MUI styling)
- `canvas@^3.1.0` (as an optional dependency, for PDF.js support in Node environments)

[Additional cursor prompts...]

## PDFWorker Component

- **Purpose:** Handles PDF.js worker setup and offloads heavy PDF parsing from the main thread.
- **Current Usage:** Imported and used in the detail page to ensure PDF.js worker is registered before rendering PDFViewer.
- **Tradeoffs:**
  - **Current:** Simple, reliable for most use cases. Keeps worker logic close to where PDF is used.
  - **Alternative:** Could be abstracted into a custom hook or context for global worker management.
- **Integration:** PDFWorker should be rendered before PDFViewer in the left column.

## Prompt Management

### Current Code

- **pdfPrompts.ts:** Contains TypeScript functions for generating PDF-specific prompts.
- **summaryPrompts.json:** Used for video and other content types, not yet for PDFs.

### Tradeoffs

- **Current:** Prompt logic in TypeScript allows for dynamic prompt construction.
- **Alternative:** Moving prompts to JSON allows for easier editing and localization.

### Recommendation

- Extend `summaryPrompts.json` to include PDF prompt types.
- Use placeholders for dynamic values.
- Allow users to select from available prompt types.

## package.json Changes

### Required Dependencies

```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "canvas": "^2.11.2"
  }
}
```

## Current Code Behavior & Tradeoffs

### PDF Processing & Summarization

- **Current:**
  - Extracts text using `pdfjs-dist`
  - Analyzes structure for prompt generation
  - Generates default summary automatically
- **Tradeoffs:**
  - Simple and fast vs. no OCR support
  - Automatic summary vs. manual control

### UI/UX (PDF Detail Page)

- **Current:**
  - Left column: PDFViewer with controls
  - Right column: Summary, notes, quiz cards
- **Tradeoffs:**
  - UI-only filename editing vs. backend persistence
  - Full text copy vs. performance
  - Full translation vs. cost

## Appendix: Sample Data & URLs

- **Test URL:** `/workspace/detail/123?type=pdf&pdfUrl=/test.pdf`
- **Sample PDF:** Place `test.pdf` in `/public` directory
- **Sample OpenAI Prompt/Response:** See OpenAI Prompt/Response Reference

## Dependency Setup & Worker File Copy

- **Package Manager:** Use `npm`
- **Worker File:** Copy from `node_modules/pdfjs-dist/build/pdf.worker.js`
- **Static Assets:** Place PDFs in `/public`

## PDFWorker Registration & Troubleshooting

- **Registration:** Register globally for best performance
- **Troubleshooting:**
  - Check MIME types
  - Verify worker file exists
  - Monitor browser console

## Button Behaviors, Tooltips, and Wireframes

[Detailed button behaviors and wireframes...]

## Handling PDFs with Images, Tables, and OCR

- **Text Extraction:** Default text extraction
- **Tables:** Basic structure analysis
- **Images:** Placeholder support
- **OCR:** Optional integration path

## Prompt Type Selection UI

- **User Selection:** Dropdown for prompt types
- **Custom Prompt:** Modal for custom input
- **UI Integration:** Matches video UI

## Logging and Debugging Tips

- **Worker Loading:** Log registration events
- **API Errors:** Comprehensive error logging
- **User Feedback:** Clear error states

## Static Assets and Worker Files

- **Test PDFs:** `/public` directory
- **Worker File:** Verify after install
- **Reference:** Use absolute paths

## Step-by-Step User Story

1. Upload or access PDF
2. View with controls
3. Generate summaries
4. Add notes/quiz cards
5. Copy/translate as needed

## Global PDFWorker Registration

```typescript
import { pdfjs } from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
}
```

## Chunk Processing and Translation Limits

- **Warning:** Process large PDFs in chunks
- **Translation:** Page-by-page for large docs
- **User Alerts:** Clear size warnings

## OCR Integration for Scanned PDFs

- **Status:** Not currently implemented
- **Recommendation:** Consider Tesseract.js
- **Integration:** Optional per-page OCR

## PDF Prompt Library and Custom Prompt

[Detailed prompt library content...]

## Pre-Launch Checklist

- [ ] Dependencies verified
- [ ] Worker file present
- [ ] Test PDFs available
- [ ] Error handling complete
- [ ] UI consistency checked

## Cross-Platform Compatibility

- Use Node.js scripts for worker copy
- Handle path differences
- Test on all platforms

## UI Screenshots and Mockups

[Placeholder for screenshots/mockups]

## References for OCR Integration

- Tesseract.js documentation
- PDF.js integration guides
- OCR best practices

## Lessons Learned

### 1. Type Detection and URL Patterns

- **Default Video Behavior**: Any URL without explicit type is treated as YouTube video
- **PDF Type Required**: Must explicitly include `type=pdf` to override default behavior
- **URL Pattern Validation**: Strict validation of PDF URLs and parameters
- **Examples and Anti-patterns**: Clear documentation of correct and incorrect URL patterns

### 2. Component Isolation

- **Strict Type Guards**:

  ```typescript
  function isPdfContent(content: ContentDetails): content is PDFContentDetails {
    return content.type === "pdf";
  }

  function isVideoContent(
    content: ContentDetails
  ): content is VideoContentDetails {
    return content.type === "video";
  }
  ```

- **Separate State Management**: PDF and video states must be completely isolated
- **Independent Error Handling**: Each content type handles errors separately

### 3. Style and Layout Management

- **PDF-Specific Classes**: Use unique identifiers for PDF styles
- **No Global Style Changes**: PDF styles must not affect video components
- **Consistent Heights**: Match header heights between columns
- **Button Alignment**: Maintain consistent spacing and alignment

### 4. Worker Setup

- **Correct File Path**: Use `pdf.worker.js`, not `pdf.worker.mjs`
- **Global Registration**: Register worker once at app level
- **Cross-Platform Scripts**: Use Node.js scripts for worker file copy

### 5. Error Handling and Validation

- **Early Type Detection**:
  ```typescript
  useEffect(() => {
    const type = searchParams.get("type");
    const pdfUrl = searchParams.get("pdfUrl");

    if (type === "pdf" && (!pdfUrl || !pdfUrl.startsWith("http"))) {
      setError("Invalid PDF URL provided");
      return;
    }
    // ... rest of the validation
  }, [searchParams]);
  ```
- **Clear Error Messages**: User-friendly error displays
- **Loading States**: Proper loading indicators for all async operations

### 6. Performance Considerations

- **Lazy Loading**: PDF components loaded only when needed
- **Chunk Processing**: Handle large PDFs in chunks
- **Translation Limits**: Page-by-page translation for large documents

### 7. UI/UX Improvements

- **Consistent Headers**: Match header heights between columns
- **Button Placement**: Logical grouping of controls
- **Loading States**: Clear indicators for all operations
- **Error Messages**: User-friendly error displays

### 8. Testing Strategy

- **Regression Testing**: Verify video features remain unchanged
- **PDF Feature Testing**: Comprehensive testing of PDF functionality
- **Edge Cases**: Test error handling and large documents

### 9. Documentation Updates

- **Clear Examples**: Document URL patterns and usage
- **Error Solutions**: Document common issues and fixes
- **Implementation Guide**: Keep updated with lessons learned

Remember: The success of this implementation is measured first by its ability to preserve existing video functionality completely unchanged, and second by its ability to add PDF features seamlessly.
