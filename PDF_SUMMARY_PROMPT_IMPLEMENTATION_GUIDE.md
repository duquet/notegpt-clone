# PDF Processing and Summarization Implementation Guide

## Overview

This guide provides comprehensive implementation details for building PDF processing and summarization in a Next.js/MUI application, using OpenAI's GPT models. It covers architecture, UI/UX, workflow, file structure, and step-by-step implementation prompts.

---

## Table of Contents

1. [Core Features](#core-features)
2. [Architecture](#architecture)
3. [UI/UX Layout &amp; Wireframes](#uiux-layout--wireframes)
4. [Component Breakdown](#component-breakdown)
5. [File &amp; Folder Structure](#file--folder-structure)
6. [Styling &amp; Theming](#styling--theming)
7. [Workflow &amp; User Journey](#workflow--user-journey)
8. [Edge Cases &amp; Error Handling](#edge-cases--error-handling)
9. [End-to-End Flow](#end-to-end-flow)
10. [OpenAI Prompt/Response Reference](#openai-promptresponse-reference)
11. [Step-by-Step Cursor Prompts](#step-by-step-cursor-prompts)
12. [PDFWorker Component](#pdfworker-component)
13. [Prompt Management: pdfPrompts.ts &amp; summaryPrompts.json](#prompt-management-pdfpromptsts--summarypromptsjson)
14. [package.json Changes](#packagejson-changes)
15. [Current Code Behavior &amp; Tradeoffs](#current-code-behavior--tradeoffs)
16. [Appendix: Sample Data &amp; URLs](#appendix-sample-data--urls)
17. [Dependency Setup &amp; Worker File Copy](#dependency-setup--worker-file-copy)
18. [PDFWorker Registration &amp; Troubleshooting](#pdfworker-registration--troubleshooting)
19. [Button Behaviors, Tooltips, and Wireframes](#button-behaviors--tooltips--wireframes)
20. [Handling PDFs with Images, Tables, and OCR](#handling-pdfs-with-images--tables--ocr)
21. [Prompt Type Selection UI](#prompt-type-selection-ui)
22. [Logging and Debugging Tips](#logging-and-debugging-tips)
23. [Static Assets and Worker Files](#static-assets-and-worker-files)
24. [Step-by-Step User Story (with Mockups)](#step-by-step-user-story-with-mockups)
25. [Global PDFWorker Registration](#global-pdfworker-registration)
26. [Chunk Processing and Translation Limits for Large PDFs](#chunk-processing-and-translation-limits-for-large-pdfs)
27. [OCR Integration for Scanned PDFs](#ocr-integration-for-scanned-pdfs)
28. [PDF Prompt Library and Custom Prompt (JSON)](#pdf-prompt-library-and-custom-prompt-json)
29. [Pre-Launch Checklist](#pre-launch-checklist)
30. [Cross-Platform Compatibility for Scripts](#cross-platform-compatibility-for-scripts)
31. [TODO: Screenshots or Figma Mockups](#todo-screenshots-or-figma-mockups)
32. [References for OCR Integration](#references-for-ocr-integration)
33. [Lessons Learned &amp; Best Practices](#lessons-learned--best-practices)
34. [Performance Optimization Tips](#performance-optimization-tips)
35. [Security Considerations](#security-considerations)

---

## Core Features

- PDF text extraction and structure analysis
- Automatic summarization using OpenAI
- UI/UX mirroring the YouTube video detail page (except left column is PDF viewer, no transcript)
- Shared controls (Summarize, Add Note, Quiz, etc.) with consistent styling
- Dark mode support
- PDF upload (on Create/Home page) and view via URL

---

## Architecture

| Layer        | Key Components                                     |
| ------------ | -------------------------------------------------- |
| Frontend     | PDFViewer, SummaryCard, SharedControls, Layout     |
| Backend/API  | PDF text extraction, OpenAI summarization endpoint |
| Shared Utils | Prompt generation, error handling, chunking        |

---

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

---

## Component Breakdown

| Component      | Purpose/Props                                 |
| -------------- | --------------------------------------------- |
| PDFViewer      | Renders PDF, supports nav/zoom/download       |
| SummaryCard    | Displays summary/notes/quiz, markdown support |
| SharedControls | Summarize, Add Note, Quiz buttons (MUI)       |
| Layout         | Responsive grid, dark mode support            |
| UploadPDF      | (Create/Home) Handles PDF upload              |

---

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

---

## Styling & Theming

- Use MUI for all UI components.
- Match button sizes, colors, and spacing to the YouTube video detail page.
- Use MUI's dark mode support (`ThemeProvider`, `palette.mode`).
- Shared button styles/components for consistency.

---

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

---

## Edge Cases & Error Handling

- PDF fails to load: Show error message in PDFViewer
- PDF is empty: Show 'No content found' message
- API errors (summarization): Show error toast/snackbar
- Unsupported file type: Show validation error on upload
- Loading states: Show spinners/placeholders for all async actions

---

## End-to-End Flow

1. User uploads or opens a PDF
2. App navigates to `/workspace/detail/[id]?type=pdf&pdfUrl=...`
3. PDFViewer loads and displays the PDF
4. App extracts text and structure from PDF
5. App generates and displays the default PDF summary (see prompt below)
6. User can regenerate summary, add notes, or generate quiz cards
7. All UI/UX matches the YouTube video detail page except for the left column (PDF vs. video)

---

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

Your task is to create a comprehensive, well-structured analysis in Markdown format that includes:

**Document Overview**
- Title: {title or "Untitled Document"}
- Length: {pageCount} page(s)
- Document Type: [Only if explicitly stated in document, otherwise "Not specified"]
- Target Audience: [Only if explicitly indicated in document, otherwise "Not specified"]
- Structure: Contains numbered sections (if detected)
- Major Sections: {up to 3 detected headings}

**Executive Summary**
Provide a clear, concise overview using ONLY information present in the document:
- Main purpose and objectives (as explicitly stated)
- Key arguments or findings (with direct textual evidence)
- Significance and context (only if directly mentioned)
[Summarize in 2-3 paragraphs, using only content from the document]

**Key Components**
List ONLY the sections and content that actually appear in the document:
[For each section found in the document]
- Direct quotes or paraphrased content with high fidelity to source
- Supporting evidence exactly as presented in the document

**Critical Findings**
- List ONLY findings explicitly stated in the document
- Include ONLY statistics, data, or quotes that appear in the text
- Note: If fewer than 3 findings are explicitly stated, do not invent additional ones

**Technical Elements** (if present in document)
- List ONLY methodologies, specifications, or technical details explicitly mentioned
- Include ONLY visual elements, tables, or figures that are actually present
- Mark "Not applicable" if no technical content is found

**Practical Applications**
- Include ONLY applications or implications directly stated in the document
- List ONLY recommendations explicitly made in the text
- If none are stated, mark as "No explicit applications provided in document"

**Conclusion**
Synthesize ONLY what was explicitly covered in the document:
- Key points directly from the text
- Any explicit next steps or recommendations
- Note: If no conclusion is provided in the document, state "No explicit conclusion provided"

Here's the document content to analyze:

{full extracted PDF text}

FINAL VERIFICATION:
Before submitting your analysis:
1. Verify that every point comes directly from the document
2. Remove any statements that make assumptions beyond the text
3. Check that all quotes and statistics match the document exactly
4. Mark any standard sections that lack supporting content as "Not provided in document"
5. Ensure no external knowledge or context has been added
```

**Expected Response:**

- Markdown-formatted output with all sections above, filled only with content found in the PDF, or marked as "Not provided in document" if not present.

---

## Step-by-Step Cursor Prompts

"Hey Cursor, do this:In `package.json`, ensure the following dependencies are present with the **exact versions** currently in use:

- `pdfjs-dist@^3.11.174` (for PDF parsing and rendering)
- `canvas@^3.1.0` (as an optional dependency, for PDF.js support in Node environments)
  This combination works well, so **do not add or update them if missing or outdated unless I specifically confirm to**.
  Also, note that the project uses a `postinstall` script to copy the PDF.js worker file (`pdf.worker.mjs`) to `pdf.worker.js` for compatibility. Do not remove or change this script unless instructed."

Below are safe, incremental prompts you can use with Cursor to implement or extend the PDF processing and summarization features described in this guide. Each prompt is designed to avoid overwriting existing work and to encourage careful, modular development.

---

"Hey Cursor, do this: In `src/app/workspace/detail/[id]/page.tsx`, add logic to detect when `type=pdf` is in the URL and render the PDFViewer in the left column, with all the described button groups (edit filename, preview, nav/zoom, download/print, copy/language). Make sure not to remove or break any existing video logic."

"Hey Cursor, do this: In `src/components/PDFViewer.tsx`, extend the component to support navigation, zoom, download, print, and preview mode (showing extracted text instead of PDF, if possible). Add top left, center, and right button groups as described, and below-PDF copy/language controls."

"Hey Cursor, do this: In `src/app/workspace/detail/[id]/page.tsx`, ensure that summary, notes, and quiz cards are rendered in the right column as a single component/section, matching the YouTube video detail page in style and behavior. Do not split into separate components if not already."

"Hey Cursor, do this: Add or update the `PDFWorker` component to ensure PDF.js worker is registered before rendering PDFViewer. Place it before PDFViewer in the left column. If a PDFWorker already exists, just check that it is used as described."

"Hey Cursor, do this: In `src/utils/pdfPrompts.ts`, review the prompt generation logic for PDFs. If you want to support multiple PDF prompt types, consider moving prompt templates to `summaryPrompts.json` and interpolate dynamic values at runtime."

"Hey Cursor, do this: In `src/utils/summaryPrompts.json`, add new entries for PDF prompt types (e.g., 'pdf-default', 'pdf-technical'), each with a systemPrompt and userPrompt. Use placeholders like {title}, {pageCount}, etc. Update the code to use these prompts for PDF summarization."

"Hey Cursor, do this: In `package.json`, check that the following dependencies are present and up to date: 'pdfjs-dist', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled', 'canvas'. Only add or update if missing or outdated."

"Hey Cursor, do this: In the PDF detail page, ensure the Copy button copies all extracted PDF text, and the Language button triggers translation of the PDF text (not just UI labels)."

"Hey Cursor, do this: For the Edit Filename button, keep the change UI-only for now, but document the tradeoffs of UI-only vs. backend renaming in the code comments."

"Hey Cursor, do this: For Preview mode, implement a toggle that switches the PDFViewer between rendered PDF and extracted text view. Make it clear in the UI that this is a preview/experimental feature."

"Hey Cursor, do this: Add error handling for all edge cases: failed PDF load, empty PDF, API errors, unsupported file type, and loading states. Use MUI Snackbar or Alert for user feedback."

"Hey Cursor, do this: Ensure all new UI matches the style, spacing, and dark mode support of the YouTube video detail page. Use shared button styles/components where possible."

"Hey Cursor, do this: Test the end-to-end flow by uploading or viewing a PDF, verifying summary generation, UI/UX, and all controls and error handling. Document any issues or improvements needed."

---

Use these prompts one at a time, reviewing the code and UI after each step to ensure safe, incremental progress. If a step is already implemented, simply verify and document its behavior.

---

## PDFWorker Component

- **Purpose:** Handles PDF.js worker setup and offloads heavy PDF parsing from the main thread.
- **Current Usage:** Imported and used in the detail page to ensure PDF.js worker is registered before rendering PDFViewer.
- **Tradeoffs:**
  - **Current:** Simple, reliable for most use cases. Keeps worker logic close to where PDF is used.
  - **Alternative:** Could be abstracted into a custom hook or context for global worker management, which may improve performance if multiple PDFs are open, but adds complexity.
- **Integration:** PDFWorker should be rendered before PDFViewer in the left column.

---

## Prompt Management: pdfPrompts.ts & summaryPrompts.json

### Current Code

- **pdfPrompts.ts:** Contains TypeScript functions for generating PDF-specific prompts (e.g., `generateDefaultSummaryPrompt`).
- **summaryPrompts.json:** Used for video and other content types, not yet for PDFs.

### Tradeoffs

- **Current:** Prompt logic in TypeScript allows for dynamic prompt construction (e.g., inserting title, page count, headings).
- **Alternative:** Moving prompts to `summaryPrompts.json` (as JSON) allows for easier editing, localization, and adding new prompt types without code changes. However, dynamic values (like title, headings) must be interpolated at runtime.

### Recommendation

- Extend `summaryPrompts.json` to include keys like `"pdf-default"`, `"pdf-technical"`, etc.
- Each prompt should have a `systemPrompt` and `userPrompt` with placeholders (e.g., `{title}`, `{pageCount}`) to be filled in by code.
- UI can allow users to select from available PDF prompt types for more flexibility.

**Example summaryPrompts.json entry:**

```json
{
  "pdf-default": {
    "title": "PDF Summary",
    "systemPrompt": "You are a helpful assistant that summarizes PDF documents...",
    "userPrompt": "Summarize the following PDF:\n\n{content}"
  },
  "pdf-technical": {
    "title": "Technical PDF Analysis",
    "systemPrompt": "You are a technical document analyst...",
    "userPrompt": "Analyze this technical PDF:\n\n{content}"
  }
}
```

---

## package.json Changes

### Current Code

- Uses `pdfjs-dist` for PDF parsing.
- Uses `@mui/material` and related MUI packages for UI.
- Uses `canvas` (required by `pdfjs-dist` in some environments).

### Tradeoffs

- **Current:** Directly installs only what is needed for PDF and MUI. Simple, minimal dependencies.
- **Alternative:** Could use a higher-level PDF viewer library (e.g., `@react-pdf-viewer/core`), which may offer more features out of the box but adds bundle size and less control.

### Required Dependencies

- `pdfjs-dist`: PDF parsing and rendering
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`: MUI UI components and styling
- `canvas`: Node.js canvas support for PDF.js (if server-side rendering or advanced features needed)
- (Optional) `@react-pdf-viewer/core`: For advanced PDF viewing features

**Example package.json additions:**

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

- **Tradeoff:** More dependencies can increase bundle size and maintenance, but provide richer features and better UI consistency.

---

## Current Code Behavior & Tradeoffs

### PDF Processing & Summarization

- **Current:**
  - Extracts all text from the PDF using `pdfjs-dist`.
  - Analyzes structure (headings, sections) for prompt generation.
  - Generates a default summary using a PDF-specific prompt (see [OpenAI Prompt/Response Reference](#openai-promptresponse-reference)).
  - Summary is generated automatically on load.
- **Tradeoffs:**
  - **Current:** Simple, fast, and works for most PDFs. No OCR or image extraction.
  - **Alternative:** Adding OCR (e.g., Tesseract.js) would support scanned/image PDFs but adds complexity and performance cost.

### UI/UX (PDF Detail Page)

- **Current:**
  - Left column: PDFViewer with navigation, zoom, download, copy, language, and (optionally) preview mode.
  - Top left: Edit filename (UI only), Preview mode (shows text view; guess).
  - Top center: Page navigation and zoom.
  - Top right: Download, Print.
  - Below PDF: Copy (copies all PDF text), Language (translates PDF text).
  - Right column: Summary, notes, quiz cards (all in one component, not separate).
- **Tradeoffs:**
  - **Current:** UI-only filename editing is simple and fast, but does not persist changes to the backend or filesystem. Safer, but less powerful.
  - **Alternative:** Backend renaming would allow true file management, but requires more backend logic and error handling.
  - **Preview mode** (guess): Shows extracted text for accessibility or quick reading, but may lose original formatting and visuals.
  - **Copy/Language:** Copying all text is user-friendly, but may be slow for large PDFs. Translating the whole PDF text is powerful, but can be slow/expensive for long documents.

### Prompt Management

- **Current:**
  - Prompts for PDFs are generated in TypeScript (`pdfPrompts.ts`).
  - Only one default PDF prompt is used.
- **Tradeoffs:**
  - **Current:** Hardcoding prompts in code is fast and flexible for developers, but not for non-developers or localization.
  - **Alternative:** Using JSON (`summaryPrompts.json`) allows for easier updates, localization, and user selection of prompt types, but requires runtime interpolation and more UI logic.

---

## Appendix: Sample Data & URLs

- **Test URL:** `/workspace/detail/123?type=pdf&pdfUrl=/test.pdf`
- **Sample PDF:** Place `test.pdf` in `/public` directory
- **Sample OpenAI Prompt/Response:** See [OpenAI Prompt/Response Reference](#openai-promptresponse-reference)

---

## Dependency Setup & Worker File Copy

- **Package Manager:** Use `npm` for all dependency installation and scripts.
- **PDF.js Worker File:** The worker file (`pdf.worker.mjs`) is copied from `node_modules/pdfjs-dist/build/pdf.worker.mjs` to `public/pdf.worker.js` during `npm install` via the `postinstall` script.
- **Code Snippet:**

```json
"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.mjs public/pdf.worker.js"
```

- **Static Assets:** Place test PDFs in the `/public` directory. Reference them in code as `/test.pdf` or `/public/test.pdf`.

---

## PDFWorker Registration & Troubleshooting

- **Registration:** Register the PDF.js worker **once globally** (e.g., in your app's root or main entry point) for best performance and reliability.
- **Tradeoff:** Registering globally avoids redundant worker setup and potential conflicts, but if you ever need multiple, isolated PDF viewers with different worker versions, per-instance registration may be needed (rare).
- **Troubleshooting Tips:**
  - **MIME Type Errors:** Ensure the worker file is served with the correct MIME type (`application/javascript`).
  - **Worker Not Found:** Double-check the copy path and that `public/pdf.worker.js` exists after install.
  - **Build/Deploy Issues:** Some build tools may not copy the worker file to the output directory; verify your build output.
  - **Browser Console:** Always check for errors in the browser console if the PDF viewer fails to load.

---

## Button Behaviors, Tooltips, and Wireframes

- **Edit Filename:** Inline editable text field with tooltip: "Click to edit filename (UI only)".
- **Preview Mode:** Toggle button with tooltip: "Switch between PDF view and extracted text preview".
- **Navigation:** Prev/Next page buttons, tooltip: "Go to previous/next page".
- **Zoom:** Zoom in/out buttons, tooltip: "Zoom in/out".
- **Download:** Button, tooltip: "Download PDF".
- **Print:** Button, tooltip: "Print PDF".
- **Copy:** Button below PDF, tooltip: "Copy all extracted PDF text".
- **Language:** Dropdown below PDF, tooltip: "Translate PDF text".

**ASCII Wireframe Example (PDF Viewer Top Controls):**

```
+---------------------------------------------------------------+
| [Edit filename] [Preview]      [<] [Page 1/10] [>] [Zoom +/-] [Download] [Print] |
+---------------------------------------------------------------+
|                                                               |
|                        [PDF Content]                         |
|                                                               |
|---------------------------------------------------------------|
|                [Copy]   [Language ▼]                         |
+---------------------------------------------------------------+
```

---

## Handling PDFs with Images, Tables, and OCR

- **Text Extraction:** By default, only text is extracted. For PDFs with images or scanned pages, consider integrating an OCR library (e.g., Tesseract.js) to extract text from images.
- **Tables:** Use PDF.js text extraction, but for complex tables, consider post-processing the text to reconstruct table structure.
- **Images:** Extract image references or provide a placeholder in the summary ("[Image omitted]").
- **OCR Integration:** Add a toggle or auto-detect for OCR if no text is found on a page.
- **User Feedback:** Show a message if OCR is used or if images/tables could not be fully extracted.

---

## Prompt Type Selection UI

- **User Selection:** Allow users to select a PDF prompt type (e.g., Default, Technical, Legal) from a dropdown or menu above the summary area.
- **Custom Prompt:** Add a "Custom Prompt" button that opens a popup window (modal) for entering a custom prompt, similar to the custom video prompt feature.
- **UI Mockup:**

```
+-------------------+
| [Prompt Type ▼]   |  (Default, Technical, Legal, Custom...)
+-------------------+
| [Custom Prompt]   |  (opens modal for user input)
+-------------------+
```

---

## Logging and Debugging Tips

- **Worker Loading:** Log a message when the PDF.js worker is registered and when the worker file is loaded.
- **API Errors:** Log all errors from the OpenAI API and show user-friendly messages.
- **Silent Failures:** Add catch blocks and error boundaries to surface unexpected issues.
- **Debugging:** Use `console.log` for key lifecycle events (PDF load, summary generation, prompt selection).
- **User Feedback:** Always show a visible error or loading state in the UI for any failure.

---

## Static Assets and Worker Files

- **Test PDFs:** Place in `/public` (e.g., `/public/test.pdf`). Reference as `/test.pdf` in code.
- **Worker File:** After install, `public/pdf.worker.js` should exist. If not, run the `postinstall` script manually.
- **Reference in Code:**
  - For PDF.js: `workerSrc: '/pdf.worker.js'`
  - For test PDFs: `pdfUrl: '/test.pdf'`

---

## Step-by-Step User Story (with Mockups)

1. **User uploads a PDF on the Create/Home page.**
   - UI: Upload button, drag-and-drop area.
2. **App navigates to `/workspace/detail/[id]?type=pdf&pdfUrl=/test.pdf`.**
3. **PDFViewer loads, showing the PDF with all controls.**
   - Top: Edit filename, Preview, Nav, Zoom, Download, Print.
   - Below: Copy, Language.
4. **Summary area shows a dropdown for prompt type and a Custom Prompt button.**
5. **On load, the default summary is generated and displayed.**
6. **User can select a different prompt type or enter a custom prompt (popup/modal).**
7. **User can copy or translate the PDF text, or download/print the PDF.**
8. **All errors and loading states are clearly shown in the UI.**

---

## Global PDFWorker Registration

To register the PDF.js worker globally (recommended), add the following code to your `_app.tsx` or a top-level layout file:

```typescript
import { pdfjs } from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
}
```

This ensures the worker is registered once for the entire app, avoiding redundant setup and potential conflicts.

---

## Chunk Processing and Translation Limits for Large PDFs

- **Warning:** For large PDFs (e.g., more than 20 pages), extract and process text in chunks (page by page or in small groups) to avoid performance issues and browser crashes.
- **Translation Limitation:** If a PDF is too large, limit language translation to one page at a time. Show a popup alert:

> "This PDF is too large to translate all at once. Please translate one page at a time."

- **Popup Logic Example:**

```typescript
if (pdfPageCount > 20 && userRequestsFullTranslation) {
  alert(
    "This PDF is too large to translate all at once. Please translate one page at a time."
  );
  // Only allow translation of the current page
}
```

---

## OCR Integration for Scanned PDFs

- **Current Status:** OCR is **not** currently used in this project.
- **Recommendation:** For scanned/image-based PDFs, integrate an OCR library such as [Tesseract.js](https://github.com/naptha/tesseract.js).
- **How to Detect Need for OCR:**
  - If PDF.js text extraction returns an empty string for a page, it may be a scanned image. Prompt the user to enable OCR for that page.
- **Integration Reference:**
  - [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
  - Example usage:
    ```typescript
    import Tesseract from "tesseract.js";
    // ...
    Tesseract.recognize(imageData, "eng").then(({ data: { text } }) => {
      // Use extracted text
    });
    ```

---

## PDF Prompt Library and Custom Prompt (JSON)

- **Add the following PDF prompts to your `summaryPrompts.json` file:**

```json
{
  "pdf-summary": {
    "title": "Summary",
    "systemPrompt": "Generate a summary, highlights, and key insights for this PDF.",
    "userPrompt": "Summarize the following PDF document."
  },
  "pdf-chapter-summary": {
    "title": "Chapter Summary",
    "systemPrompt": "Summarize deeply by table of contents and chapters.",
    "userPrompt": "Summarize the PDF by chapters and sections."
  },
  "pdf-core-points": {
    "title": "Core Points Summary",
    "systemPrompt": "Summarize core points, key conclusions, and important details.",
    "userPrompt": "Summarize the core points of this PDF."
  },
  "pdf-ai-note": {
    "title": "AI Note",
    "systemPrompt": "Generate structured notes for users to organize and review knowledge easily.",
    "userPrompt": "Create structured notes for this PDF."
  },
  "pdf-industry-report": {
    "title": "Industry & Market Reports Summary",
    "systemPrompt": "Assist in analyzing business sectors and key components to an industry.",
    "userPrompt": "Summarize the industry and market aspects of this PDF."
  },
  "pdf-financial-statements": {
    "title": "Financial Statements Assistant",
    "systemPrompt": "Extract key insights from financial statements for strategic planning.",
    "userPrompt": "Summarize the financial statements in this PDF."
  },
  "pdf-annual-report": {
    "title": "Annual Report Summarizer",
    "systemPrompt": "Summarize the background, key decisions, data, and other important information in an annual report.",
    "userPrompt": "Summarize this annual report PDF."
  },
  "pdf-legal-documents": {
    "title": "Legal Documents Summarizer",
    "systemPrompt": "Summarize complex legal documents, highlighting key details.",
    "userPrompt": "Summarize this legal document PDF."
  },
  "pdf-contract-review": {
    "title": "Contract Review Assistant",
    "systemPrompt": "Review contract for potential liabilities, obligations, or risks to the client.",
    "userPrompt": "Review and summarize this contract PDF."
  },
  "pdf-meeting-minutes": {
    "title": "Meeting Minutes Summarizer",
    "systemPrompt": "Summarize the meeting minutes briefly so that those who did not attend can understand the key points.",
    "userPrompt": "Summarize the meeting minutes in this PDF."
  },
  "pdf-essay-resource": {
    "title": "Essay Resource Organizer",
    "systemPrompt": "Generate summaries based on PDF content for easy extraction, copying, and organization.",
    "userPrompt": "Summarize this essay PDF for research and organization."
  },
  "pdf-blog-post": {
    "title": "Blog Post Converter",
    "systemPrompt": "Generate SEO-friendly blogs to facilitate quick content publication and attract readers.",
    "userPrompt": "Convert this PDF into a blog post."
  },
  "pdf-flashcard": {
    "title": "AI Flashcard Generator",
    "systemPrompt": "Use AI to auto-generate flashcards for effective learning and retention.",
    "userPrompt": "Generate flashcards from this PDF."
  },
  "pdf-podcast-script": {
    "title": "Podcast Script Generator",
    "systemPrompt": "Create podcast-ready speech scripts to aid in podcast preparation and recording.",
    "userPrompt": "Generate a podcast script from this PDF."
  },
  "pdf-custom": {
    "title": "Custom Prompt",
    "systemPrompt": "Use a custom prompt provided by the user.",
    "userPrompt": "{customPrompt}"
  }
}
```

- **Custom Prompt:** Allow users to add a custom prompt via a popup window, as shown in the screenshots.

---

## Pre-Launch Checklist

- [ ] All required dependencies are installed with the correct versions.
- [ ] `public/pdf.worker.js` exists and is up to date.
- [ ] All test PDFs are present in `/public` and referenced correctly.
- [ ] The `postinstall` script works on your OS (see cross-platform note below).
- [ ] PDFWorker is registered globally.
- [ ] All prompt types (including custom) are available in the UI.
- [ ] Translation for large PDFs is limited to one page at a time, with a popup alert.
- [ ] All error and loading states are handled and visible in the UI.
- [ ] (TODO) Add screenshots or Figma mockups for all major UI states.

---

## Cross-Platform Compatibility for Scripts

- The `cp` command in the `postinstall` script works on Unix-based systems (macOS, Linux). For Windows compatibility, use a Node.js script or a cross-platform package like `ncp` or `cpy`.
- Example Node.js script:

```js
// copy-pdf-worker.js
const fs = require("fs");
fs.copyFileSync(
  "node_modules/pdfjs-dist/build/pdf.worker.mjs",
  "public/pdf.worker.js"
);
```

- Update your `postinstall` script to:

```json
"postinstall": "node copy-pdf-worker.js"
```

---

## TODO: Screenshots or Figma Mockups

- Add screenshots or Figma links for:
  - PDF prompt selection dropdown
  - Custom prompt popup/modal
  - PDFViewer with all button states
  - Error and loading states

---

## References for OCR Integration

- [Tesseract.js GitHub](https://github.com/naptha/tesseract.js)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [How to Use Tesseract.js](https://tesseract.projectnaptha.com/)

---

## Lessons Learned & Best Practices

### PDF Processing & Text Extraction

- **Large PDF Handling:** Always implement chunking for PDFs over 20 pages
  - Text extraction should be done page by page
  - Translation should be limited to single pages for large documents
  - Show clear UI feedback when processing large documents
- **Worker Management:**
  - Global worker registration is crucial for performance
  - Always verify worker file exists after installation
  - Handle worker loading errors gracefully

### UI/UX Implementation

- **Button Placement:**
  - Keep edit filename and preview mode together (top-left)
  - Navigation controls must be centered and easily accessible
  - Download/print buttons should be consistently placed (top-right)
- **State Management:**
  - Maintain clear loading states for all async operations
  - Show progress indicators for long-running tasks
  - Keep UI responsive during PDF processing

### Error Handling & Edge Cases

- **Common Issues Found:**
  - PDF.js worker not loading (MIME type issues)
  - Large PDF performance problems
  - Memory leaks from not cleaning up PDF instances
  - Missing error boundaries for PDF viewer crashes
- **Solutions Implemented:**
  - Added comprehensive error boundaries
  - Implemented chunking for large PDFs
  - Added cleanup in useEffect hooks
  - Created fallback UI for failed loads

### Prompt Management

- **Lessons from Implementation:**
  - JSON-based prompts are more maintainable than hardcoded ones
  - Dynamic value interpolation needs careful error handling
  - Custom prompts should be validated before use
  - Cache prompt results for better performance

### Cross-Platform Considerations

- **Windows Compatibility:**
  - Use Node.js scripts instead of shell commands
  - Handle path separators properly
  - Test worker file copying on all platforms
- **Browser Support:**
  - Test PDF rendering in all major browsers
  - Handle PDF.js worker loading differences
  - Consider fallback options for older browsers

### Performance Insights

- **Memory Management:**
  - Dispose of PDF instances properly
  - Clean up unused resources
  - Monitor memory usage with large PDFs
- **Loading Optimization:**
  - Lazy load PDF viewer component
  - Implement progressive loading for large PDFs
  - Cache extracted text when possible

### Security Considerations

- **File Handling:**
  - Validate PDF files before processing
  - Sanitize file names and paths
  - Implement proper CORS headers for worker files
- **User Input:**
  - Validate custom prompts
  - Sanitize filename inputs
  - Handle malicious PDF attempts

## Performance Optimization Tips

### PDF Processing

- Implement lazy loading for PDF pages
- Use web workers for heavy computations
- Cache processed results when possible
- Implement proper cleanup routines

### Memory Management

- Monitor heap usage during PDF processing
- Implement page unloading for large PDFs
- Clean up unused PDF instances
- Use proper disposal methods

### UI Responsiveness

- Debounce user interactions
- Show loading states for all operations
- Implement progressive loading
- Handle background processing properly

## Security Considerations

### File Processing

- Validate PDF files before processing
- Implement proper file size limits
- Handle malicious file attempts
- Sanitize all file paths

### User Input

- Validate custom prompts
- Sanitize filename inputs
- Implement proper XSS protection
- Handle malicious PDF attempts

---

This guide is now maximally helpful for a developer building PDF processing and summarization from scratch, with clear instructions, layout, workflow, and implementation steps.
