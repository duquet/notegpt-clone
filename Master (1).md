## Table of Contents

1. Notes
   - ToDo List
   - PDF Detail/[id] Page Prototype
     - SimplePDFViewer Reference
     - Prototype Tradeoffs and Notes
   - Misc Notes
2. New Project Setup (Backend Server and Environment Variables)
   - Backend Server
   - Environment Variables
3. Web App Structure & Core TODOs
   - Webpages
     - Overview
4. Features Expected to be Missing in MVP
5. Authentication
6. Feature Table, MVP Priorities & Database Schema
   - Feature Table (Summary)
   - Database Support Needed
7. Known Bugs and Suspected Issues
   - Known Bugs
   - Bugs Observed on NoteGPT.io
8. UI/UX Improvements & Layout Recommendations
9. Competitor Research
   - Key Competitors
   - Observations & Opportunities
10. Suggested Roadmap
    - MVP Core
    - MVP 1.1 (First Improvements)
    - MVP 2.0 (Extended)
11. Non‑Software To‑Dos
12. Questions
13. AI Chat with PDF or Video
    - Implementation Overview
    - Implementation Questions and Considerations
    - Key Feature Comparison & Recommendations
    - Open Source References

---

## 1. Notes

### - ToDo List

- Test Login Page
- Fix whatever auth mistakes I made (also maybe allow a user to experiment without logging in??)
- PDF Detail Page buttons (see section: PDF Detail / \[id] Page below) - remove timestamp from Note
- PDF Uploader/Drag and drop (see section: 3b. SimplePDFViewer repo)
- PDF thumbnail for Notes Page
- Sticky buttons and other UI/UX and Bugs (see UI/UX Improvements & Layout Recommendations)
- streamline create page to add a note -> Notes Page -> Detail/\[id] page
- database
- save and edit custom prompt (after database?)
- mind maps (see prototype \~/Downloads/NoteGPT-Clone-Apr29at1222)
- user subscription level
- browser tab title
- header titles (Details)
- Performance issues?
- language
- User setting (Languages?, Custom Prompt, videos, PDFs, etc)
- usage tracking?
- other non-video, non-pdf formats and other video formats? (Word, TXT, eBook: max 30MB Audio, Video: max 40MB)
- Home page
- Summary Settings (sprocket icon)

### - PDF Detail/[id] Page Prototype

- My PDF Prototype is Working

  - Example URL: save file to /public/test.pdf first
    [https://www.google.com/search?q=http://localhost:3000/workspace/detail/123%3Ftype%3Dpdf%26pdfUrl%3D/test.pdf](https://www.google.com/search?q=http://localhost:3000/workspace/detail/123%3Ftype%3Dpdf%26pdfUrl%3D/test.pdf)

  #### - SimplePDFViewer Reference

  - Repo: [https://github.com/duquet/simplepdfviewer](https://github.com/duquet/simplepdfviewer)
  - Notes: Includes basic README.md documentation about
    - CORS issues
    - PDF.js handling
    - Test environment setup using a local test.pdf

  #### - Prototype Tradeoffs and Notes

### - Misc Notes

- Please commit to Repo daily
- Cursor Account: andrew.duquet.dev@gmail.com pwd: softwaredev
- Preventing Cursor AI from Changing Hand-Edited Code

  - Cursor AI allows you to influence its behavior globally by using a special file in your project directory called `cursor.rules`. This file can be used to set instructions that Cursor will follow whenever it interacts with your codebase.
  - How to Set a Global Rule to Prevent Code Changes

- Dev Commits from Terminal (example: mindmaps)

  ```
  1057  cd notegpt-clone
  1058  ls
  1059  git status
  1060  git stash
  1061  git status
  1062  git branch
  1063  git checkout -b dev
  1064  git branch
  1065  git stash list
  1066  git stash apply
  1067  git branch
  1068  git add .
  1069  git commit -m "MindMaps"
  1070  git push origin dev
  andewduquet@Andews-MBP-2 notegpt-clone %
  ```

- For example, did from
  `andewduquet@Andews-MBP-2 NoteGPT-Clone-Apr29at1222 %` for Mind Maps on Wed Apr30at4:11
- See up to date MD Documents \~/Downloads/NoteGPTClone Folder and messaged to Ahmar on 4/25/25 at 5:30pm
- Also, on cursor, on my macbook:

  - \~/Downloads/NoteGPT-All/
    - note-gpt-clone-main-Apr22at451pm (has token level transcript tracking)
      - latest zip backup: \~/Downloads/notegpt-clone-main-Apr22at451pm 3.zip (April 25,12:03)
  - \~/Downloads/notgpt-pdfviewer2
  - \~/Downloads/firebase-auth-master…
  - \~/Downloads/testdir2 (has both PDF and Auth I think)
  - \~/Downloads/TestPDF (has test.pdf and MD docs for PDF)

- Ok for me to remove:

  - cache: failed SpaCy and NLTK effort

---

## 2. New Project Setup (Backend Server and Environment Variables)

### - Backend Server

- Environment & directory structure

  ```
  cd api
  rm -rf env
  python3 -m venv env
  source env/bin/activate
  pip install -r requirements.txt
  python3 api.py
  ```

### - Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDhfuI1NDRZKGaEXu5HUhyiwU9zz8YigdY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="notegpt-clone-56652.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="notegpt-clone-56652"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="notegpt-clone-56652.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="402711510015"
NEXT_PUBLIC_FIREBASE_APP_ID="1:402711510015:web:0f7e244f7cf089a78845ca"
NEXT_PUBLIC_OPENAI_API_KEY="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"
DATABASE_URL="postgres://notegpt-clone_owner:npg_Ln2CB3afoZpi@ep-empty-morning-a5heol5x-pooler.us-east-2.aws.neon.tech/notegpt-clone?sslmode=require"
```

---

## 3. Web App Structure & Core TODOs

### - Webpages

#### - Overview

- Home (Say PDF as well as Youtube Video)
- Create
  - Tab option 2: PDF Uploader/Drag-Drop (screenshot also shows the PDF thumbnail image of a PDF Note in the middle of the 2nd row) - see
    - Upload or drag a file here.
    - PDF, Image, PPT, Word, TXT, eBook: max 30MB
    - Audio, Video: max 40MB
    - Supported file formats
    - OR
    - Upload to Summarize
  - File (Image, Audio & More) (not in MVP?)
  - Webpage Link (not in MVP?)
  - Long Text File (not in MVP?)
  - Summary Settings (sprocket icon)
  - Language dropdown
  - Batch Summarize
  - Multi-Links
  - Continue Exploring (not in MVP?)
- Recent Notes (with "More" button)
- PDF Detail / \[id] Page
  - Upload and drag-drop from Create or Home Page
  - Top Buttons: Preview, etc.
  - Bottom Buttons: Copy, Download
  - Left Column Top Buttons:
    - Notes
    - Summaries and custom prompt
    - Quiz (working, with console error)
- PDF and Youtube Detail/\[id] Page
  - Copy to Markdown (all) - Upper Left Corner
  - Sticky Buttons for PDFs and YouTube videos
- Login Pages
- Database (User settings - language, etc.)
- Languages (Multi-language dropdown)
- Sidebar Navigation
  - Collapse/Expand partial sidebar (like NoteGPT.io)
  - Sections:
    - AI YouTube: Summarizer, Search, Notes, (Subscriptions not MVP), (Batch Summarize not MVP)
    - AI Flashcards
    - AI Chat (Not in MVP)
    - AI Presentation (Not in MVP)
    - AI Math/Homework (Not in MVP)
    - AI Book Library (Not in MVP)
    - My Notes
    - Subscriptions
    - Community
    - Back Link next to filename.pdf or YouTube title.

---

## 4. Features Expected to be Missing in MVP

- AI Chat ??
- Mindmaps?? - See \~/Downloads/add-mindmap-feature-proposal.md shared in messages and via shared gdoc
- Video Tracking Off ??
- YouTube Video Discover
- Community
- AI Book Library
- Homework Helper
- File (Image, Audio & More) (not in MVP?)
- Webpage Link (not in MVP?)
- Long Text File (not in MVP?)
- Multi-links?
- Batch Summarize?
- Continue Exploring
- Community?
- Chrome Extension
- API Key Management (user supplied)

---

## 5. Authentication

- Login should be optional.
- Firebase Auth currently supports both Google and Email/Password login.
- Minor future improvements suggested (password visibility toggle, optional additional providers).
- I also created a [https://github.com/duquet/firebase-auth](https://github.com/duquet/firebase-auth) which uses a `.env.local`

### - Authentication Questions and Considerations

- **Auth Implementation Details**
#### Auth Implementation Details

  - What specific auth mistakes need to be fixed?
  - What are the specific improvements needed for password visibility toggle?
  - Should we implement social login (Facebook, GitHub, etc.)?
  - How will we handle session management and token refresh?
  - What's the plan for handling password reset flows?

- **Security Considerations**
#### Security Considerations

  - How will we handle API key security?
  - What's the data retention policy for auth logs?
  - How will we handle user data deletion requests?
  - What's the plan for handling brute force protection?
  - Should we implement 2FA for certain features?

- **User Experience**
#### User Experience
  - Should we implement "Remember Me" functionality?
  - How will we handle account recovery?
  - What's the plan for handling concurrent sessions?
  - Should we implement "Sign in with Apple" for iOS users?

---

## 6. Feature Table, MVP Priorities & Database Schema

### - Feature Table (Summary)

| Feature                            | NoteGPT.io | MVP | MVP 2.0 |
| :--------------------------------- | :--------- | :-- | :------ |
| YouTube Transcript Summarization   | ✓          | ✓   | ✓       |
| PDF Summarization                  | ✓          | ✓   | ✓       |
| Image/PPT Summarization            | ✓          | ?   | ✓       |
| Mindmaps                           | ✓          | ?   | ✓       |
| AI Flashcards                      | ✓          | ✓   | ✓       |
| AI Chat                            | ✓          | ?   | ✓       |
| Timestamped Notes                  | ✓          | ✓   | ✓       |
| Subscription/Monetization          | ✓          | ?   | ✓       |
| Chrome Extension                   | ✓          | ✗   | ✓       |
| API Key management (user-supplied) | ?          | ?   | ✓       |

### - Database Support Needed

| Feature                              | Required? |
| :----------------------------------- | :-------- |
| Authentication                       | ✓         |
| Subscriptions                        | ✓         |
| Usage Tracking vs Subscription Level | ✓         |
| Summaries                            | ✓         |
| Flashcards                           | ✓         |
| Notes (YouTube, PDF, Text)           | ✓         |
| Mindmaps                             | ✗ (later) |
| Bug Reports                          | TBD       |
| Batch Summarization                  | TBD       |
| Settings (Language, Theme)           | ✓         |

---

## 7. Known Bugs and Suspected Issues

### - Known Bugs

- in NoteGPT.io, "Add Note" timestamp often reads 00:00.00 (even when playing video)
- In clone, Detail/\[id] page header incorrectly shows "Dashboard" instead of "Details"
- "Summary Edit" button currently does nothing
- Custom Prompt is not saved so I can't run it, edit it and then try again (waiting for database?)
- Excessive ytdl calls on every /video POST
- Summary reload required before Flashcard generation
- Missing shimmer loading (non-MVP)
- Flashcards header formatting mismatch with NoteGPT.io
- Chrome export error: "The default export is not a React Component in /workspace/detail/\[id]/page"
- need to check formatting of Summaries to match NoteGPT.io for both videos and PDFs

### - Bugs Observed on NoteGPT.io

- Can't delete Default Summaries — regenerates immediately after Delete
- Homework Helper sometimes fails to load

---

## 8. UI/UX Improvements & Layout Recommendations

- Sticky transcript controls while scrolling transcript
- Sticky top-right control panel while scrolling Summary Cards
- Sidebar: show collapsed buttons instead of fully hiding sidebar
- Breadcrumb: add \< before YouTube video title (with ellipsize)
- Summaries and Flashcards: consistent title styling with NoteGPT.io (rounded blue box bottom left)
- AI Flashcards page: center Q/A content
- Dark/Light mode toggle: replace moon icon with slider switch
- Add tooltips to buttons
- Summary: "Key Insights" should be bullet points, not far-left numbers
- Search suboption under AI YouTube (Sidebar)
- Smooth onboarding: Summary always visible or toggleable on Detail/\[id] page
- Global header polish: remove underline under logo; align bottom borders
- Suggestions Panel: add 3 suggested next actions at right-column bottom
- **Sticky - Scrolling behavior on Detail/[id] page**

---

## 9. Competitor Research

### - Key Competitors

- Otter.ai
- Descript
- Fireflies.ai
- Tactiq
- Sonix
- Rev
- Zoom AI Companion
- Notion AI
- Mem

### - Observations & Opportunities

- Mind Maps are a differentiator (NoteGPT has it, few others do)
- Multi-Model Support would differentiate (OpenAI, Claude, Gemini, Mistral)
- Interactive Summaries: allow follow-up questions
- Prompt Marketplace: importable/exportable templates
- Smart Tagging & Knowledge Graphs
- Team Collaboration Tools
- Batch Summaries for researchers/students
- Offline Access and Mobile Apps (future)

---

## 10. Suggested Roadmap

### - MVP Core

- Add Note (with timestamp)
- Login/Auth system
- Flashcards and Summaries integration
- Basic Create page: YouTube, PDF
- Sidebar navigation polish
- Free/Pro subscription system

### - MVP 1.1 (First Improvements)

- Save Summaries and Flashcards into Database (reduce API costs)
- Soft-delete user content (is_deleted field)
- Multi-Language UI toggle
- Sticky controls for smoother UX
- Better transcript segment UI (collapsible, timestamps only)

### - MVP 2.0 (Extended)

- Mind Maps generation
- Chrome Extension
- PDF upload refinements (multi-page tests)
- AI Chat/Q&A module
- Mobile-responsive improvements

---

## 11. Non‑Software To‑Dos

- Build a community on Discord (and similar platforms)
- Produce YouTube videos showcasing our clone
- Figure out competitive positioning (very important!)

---

## 12. Questions

- Why does NoteGPT.io append ?from=yt in its detail/\[id] URLs? I'm guessing the URL needs to differentiate different video types or it may be used for the Chrome Extention for different sites?
- I don't understand what "Auto‑snap during playback" means in context of NoteGPT.io (which supports it).
- How hard is it to add MindMaps (mermaid and react-mindmap, Chat, non‑YouTube video support, etc.?
- Discuss Database deletion strategie such as Soft Delete / Retention
- Global header polish: remove underline under logo; align borders, change icon for collapse sidebar to show right and left in the middle horizontal line of the 3 horizontal lines
- Sticky: Vertical Scroll bar on the Details/\[id] right column shouldn't hide top buttons
- Button indicator: shouldn't show circle next to "Add Note"
- Suggestions panel: add three suggestions at right‑column bottom
- Transcript UI: show only start time; collapsible segments
- Dark/Light toggle: slider instead of moon icon
- Video controls: add "i" icon and 3‑dot menu
- Breadcrumb back link: add \< before youtube video title; ellipsize
- Flashcards title: rename to "AI Flash Cards" and put in blue box in lower left
- Nav arrows: ensure \< 1/10 \>
- Sidebar collapse: show sidebar buttons instead of full collapse of sidebar
- Summaries: When user clicks Delete, add a NoteGPT.io -like Alert
  - NOTE: NoteGPT.io bug: Doesn't delete the Summary. All Summaries and Flashcards are automatically regenerated after the Alert's red Delete button is clicked. This means you can never delete the default summary or other summaries!
- Summary tool tip:

### - Critical Questions and Proposed Answers

#### Technical Questions

- What's the specific plan for handling rate limits?
  - Proposed: Implement token bucket algorithm with Redis for rate limiting and exponential backoff for retries
- How will we handle concurrent users?
  - Proposed: Use connection pooling and implement optimistic locking for database operations
- What's the backup strategy?
  - Proposed: Daily automated backups with 30-day retention, plus real-time replication to secondary region
- How will we handle API key rotation?
  - Proposed: Implement automated key rotation every 90 days with 7-day grace period for old keys
- What's the data retention policy?
  - Proposed: Keep user data for 2 years after last activity, with automated cleanup process
- How will we handle security audits?
  - Proposed: Quarterly third-party security audits and automated vulnerability scanning

#### Business Questions

- What's the specific pricing model?
  - Proposed: Freemium with $9.99/month Pro tier and $29.99/month Enterprise tier
- How will we handle customer support?
  - Proposed: Implement ticketing system with 24-hour response time for Pro users
- What's the marketing strategy?
  - Proposed: Focus on content marketing and SEO, with targeted ads for educational sector
- How will we handle refunds?
  - Proposed: 14-day money-back guarantee with automated processing
- What's the plan for handling subscription upgrades/downgrades?
  - Proposed: Prorated billing with immediate feature access changes
- How will we handle payment processing?
  - Proposed: Use Stripe with secure token handling and PCI compliance

#### Performance Questions

- How will we handle large PDF files?
  - Proposed: Implement chunked uploads with progress tracking and background processing
- What's the caching strategy for frequently accessed content?
  - Proposed: Use Redis for hot data with LRU eviction and CDN for static assets
- How will we optimize video transcript processing?
  - Proposed: Use background jobs with parallel processing and result caching
- What's the plan for handling context window limitations?
  - Proposed: Implement smart chunking with overlap and context-aware summarization
- How will we handle API failures and retries?
  - Proposed: Implement circuit breaker pattern with exponential backoff
- Should we implement client-side caching?
  - Proposed: Yes, using IndexedDB for offline access and faster load times

### - Technical Architecture Questions and Proposed Answers

- **Database and Storage**
#### Database and Storage

  - What's the specific plan for database schema?
    - Proposed: Use PostgreSQL with tables for users, documents, summaries, notes, and settings
    - Include soft delete fields and timestamps
    - Consider using JSONB for flexible document metadata
  - How will we handle file storage for PDFs and other documents?
    - Proposed: Use Firebase Storage for user-uploaded files
    - Implement file size limits and type validation
    - Consider CDN integration for faster delivery
  - What's the caching strategy for frequently accessed content?
    - Proposed: Use Redis for caching frequently accessed data
    - Implement cache invalidation strategies
    - Consider edge caching for static content

- **Performance and Optimization**
#### Performance and Optimization
  - How will we handle responsive design for mobile devices?
    - Proposed: Use Tailwind CSS for responsive design
    - Implement mobile-first approach
    - Consider progressive enhancement
  - How will we handle edge cases in PDF parsing?
    - Proposed: Implement robust error handling
    - Add fallback parsing methods
    - Consider OCR for problematic PDFs
  - What's the plan for handling large PDF files?
    - Proposed: Implement chunked uploads
    - Add progress indicators
    - Consider background processing
  - How will we optimize video transcript processing?
    - Proposed: Use background jobs for processing
    - Implement caching for processed transcripts
    - Consider parallel processing for large videos

### - Business and Monetization Questions

- **Pricing and Subscriptions**
#### Pricing and Subscriptions
  - What's the specific pricing model?
    - Proposed: Freemium model with:
      - Free tier: Limited features, basic usage
      - Pro tier: Full features, higher limits
      - Enterprise tier: Custom solutions
  - How will we handle subscription upgrades/downgrades?
    - Proposed: Implement prorated billing
    - Add grace periods for downgrades
    - Consider annual discounts
  - What's the plan for handling payment processing?
    - Proposed: Use Stripe for payment processing
    - Implement secure token handling
    - Add subscription management dashboard

### - Critical Questions and Proposed Answers

#### Technical Questions

- What's the specific plan for handling rate limits?
  - Proposed: Implement token bucket algorithm with Redis for rate limiting and exponential backoff for retries
- How will we handle concurrent users?
  - Proposed: Use connection pooling and implement optimistic locking for database operations
- What's the backup strategy?
  - Proposed: Daily automated backups with 30-day retention, plus real-time replication to secondary region
- How will we handle API key rotation?
  - Proposed: Implement automated key rotation every 90 days with 7-day grace period for old keys
- What's the data retention policy?
  - Proposed: Keep user data for 2 years after last activity, with automated cleanup process
- How will we handle security audits?
  - Proposed: Quarterly third-party security audits and automated vulnerability scanning

#### Business Questions

- What's the specific pricing model?
  - Proposed: Freemium with $9.99/month Pro tier and $29.99/month Enterprise tier
- How will we handle customer support?
  - Proposed: Implement ticketing system with 24-hour response time for Pro users
- What's the marketing strategy?
  - Proposed: Focus on content marketing and SEO, with targeted ads for educational sector
- How will we handle refunds?
  - Proposed: 14-day money-back guarantee with automated processing
- What's the plan for handling subscription upgrades/downgrades?
  - Proposed: Prorated billing with immediate feature access changes
- How will we handle payment processing?
  - Proposed: Use Stripe with secure token handling and PCI compliance

#### Performance Questions

- How will we handle large PDF files?
  - Proposed: Implement chunked uploads with progress tracking and background processing
- What's the caching strategy for frequently accessed content?
  - Proposed: Use Redis for hot data with LRU eviction and CDN for static assets
- How will we optimize video transcript processing?
  - Proposed: Use background jobs with parallel processing and result caching
- What's the plan for handling context window limitations?
  - Proposed: Implement smart chunking with overlap and context-aware summarization
- How will we handle API failures and retries?
  - Proposed: Implement circuit breaker pattern with exponential backoff
- Should we implement client-side caching?
  - Proposed: Yes, using IndexedDB for offline access and faster load times

---

## 13. AI Chat with PDF or Video

### - Implementation Overview

#### 🔧 Core Use Case

- Enable users to chat with AI based on:
  - YouTube video transcripts (already parsed and segmented)
  - Uploaded PDF documents (parsed and enhanced)
- Chat should be context-aware, fast, and scalable — ideally with tools like OpenAI gpt-4-turbo + retrieval + memory.

#### 🧠 High-Level Strategy

- **Define Chat Context Scope**

  - Chat should only use:
    - YouTube transcript (enhanced or raw)
    - PDF extracted text (paragraphs, sections, metadata)
    - Optional: summary/flashcards (if well structured)
  - Avoid:
    - Non-textual PDF content (images, charts, scanned pages unless OCR'd)
    - Full document history unless helpful (adds token bloat)

- **Store Sources Cleanly**

  - For each videoId or pdfId, store:
    - full_transcript.json or full_pdf_text.json
    - enhanced_transcript.json or cleaned_pdf_text.json
    - summary.md or summary.json
    - Optional: metadata.json with author, title, sections

#### 🧱 Implementation Steps

1. **Frontend: Trigger Chat Mode**

   - From /detail/[id] (for both videos and PDFs):
     - Show "Ask AI" or "Chat about this content"
     - On click: open chat UI and send content identifier (type=pdf|yt + id) to backend.

2. **Backend: Prepare Context Window**

   - Basic Strategy:
     - At first load, fetch relevant content (transcript or PDF text)
     - Create a system prompt like:
       ```
       You are an AI assistant helping the user understand the following [video|document].
       Refer to its content when answering.
       ```
     - Inject full cleaned text or smartly chunked context
   - Optional Enhancements:
     - Summarize each section with OpenAI (gpt-3.5-turbo is cheap)
     - Use embeddings + vector search for retrieval-augmented generation (RAG) later
     - Store context chunks in a fast cache (e.g., Redis or file-based)

3. **Chunking and Token Management**

   - For YouTube:
     - Chunk by timestamp groups (~500 tokens per chunk)
     - Include speaker attribution if useful
     - Optionally summarize sections before chat
   - For PDFs:
     - Chunk by:
       - Page
       - Heading/Section titles
       - Paragraphs
     - Strip out footers, page numbers, image tags, etc.

4. **Content Inclusion Strategy**

   | Content Type             | Include?      | Reason                                                         |
   | ------------------------ | ------------- | -------------------------------------------------------------- |
   | Enhanced Transcript Text | ✅            | Primary chat material                                          |
   | Summary Page             | ✅ (optional) | Helps AI answer better but shouldn't replace raw context       |
   | PDF Extracted Text       | ✅            | Use cleaned, readable sections                                 |
   | PDF Metadata             | ✅            | Inject into prompt for more context (title, author, etc.)      |
   | PDF Images/Charts        | ❌\*          | Only include if OCR'd or captioned; ignore for initial version |

5. **AI Chat Prompt Design (Initial MVP)**

   ```json
   [
     {
       "role": "system",
       "content": "You are a helpful assistant answering questions about the following [video/document]. Refer to the content provided."
     },
     {
       "role": "user",
       "content": "What was the main argument in section 2?"
     },
     {
       "role": "assistant",
       "content": "Based on the transcript, section 2 covers..."
     }
   ]
   ```

#### 🧪 Testing Suggestions

- Test with 2-3 documents/videos:
  - "What is this about?"
  - "Summarize section 2"
  - "What did the speaker say about X?"
  - "Who is the author and what is their main claim?"
- Compare answers using:
  - Transcript-only
  - Transcript + Summary
  - Transcript + Summary + Metadata

#### 🚀 Next Steps

- Create utility functions:
  - getChatContext(id, type) → returns cleaned content
  - getSystemPrompt(type) → returns dynamic system prompt
- Add frontend chat modal
- Set up backend /api/chat route
- Use gpt-4-turbo with streaming and context batching
- Add test cases to verify quality

### - Implementation Questions and Considerations

- **Technical Architecture**
#### Technical Architecture

  - What's the specific plan for handling rate limits with OpenAI API?
  - How will we handle concurrent chat sessions?
  - Should we implement a chat history feature?
  - How will we handle API failures and retries?
  - What's the plan for handling context window limitations?

- **Performance and Optimization**
#### Performance and Optimization

  - How will we optimize video transcript processing?
  - What's the caching strategy for frequently accessed content?
  - How will we handle large context windows?
  - What's the plan for handling streaming responses?
  - Should we implement client-side caching?

- **User Experience**
#### User Experience
  - How will we handle chat session persistence?
  - What's the plan for handling long-running conversations?
  - Should we implement conversation threading?
  - How will we handle context switching between different documents?

### - Key Feature Comparison & Recommendations

| Feature                            | NoteGPT.io | MVP | MVP 2.0 |
| :--------------------------------- | :--------- | :-- | :------ |
| YouTube Transcript Summarization   | ✓          | ✓   | ✓       |
| PDF Summarization                  | ✓          | ✓   | ✓       |
| Image/PPT Summarization            | ✓          | ?   | ✓       |
| Mindmaps                           | ✓          | ?   | ✓       |
| AI Flashcards                      | ✓          | ✓   | ✓       |
| AI Chat                            | ✓          | ?   | ✓       |
| Timestamped Notes                  | ✓          | ✓   | ✓       |
| Subscription/Monetization          | ✓          | ?   | ✓       |
| Chrome Extension                   | ✓          | ✗   | ✓       |
| API Key management (user-supplied) | ?          | ?   | ✓       |

### - Open Source References

1. **pdfGPT**

   - Features: Chat with PDFs, semantic search, page citation
   - Open Source: Yes
   - LLM Requirement: Optional (supports local and cloud LLMs)

2. **Chat-with-PDF-Chatbot**

   - Features: Fully open-source, no API key needed, Streamlit UI
   - Open Source: Yes
   - LLM Requirement: No (uses local models)

3. **DocChatAI**

   - Features: RAG pipeline, vector DB, Streamlit UI
   - Open Source: Yes
   - LLM Requirement: Yes

4. **YouTube Transcript Chatbot**

   - Features: Chat with YouTube video content, Streamlit UI
   - Open Source: Yes
   - LLM Requirement: Yes (OpenAI API)

5. **Lobe Chat**
   - Features: File upload, knowledge base, multi-modal, plugins
   - Open Source: Yes
   - LLM Requirement: Optional
