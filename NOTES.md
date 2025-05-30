# NOTES.md – Fixes & Improvements from `LinterFixes`

This branch builds on `LinterFixes` and aims to fix broken features, UI issues, and incomplete functionality across the YouTube and PDF workflows.

---

## ✅ GOALS

- Patch broken or incomplete features
- Clean up legacy/debug code (e.g. performance metrics)
- Improve UX for core features
- Prepare branch for stable deployment or merge

---

## 🔧 TASK CHECKLIST

### 🗑️ General Cleanup
- [ ] Remove Performance Metrics and any related unused debug tools
- [ ] Review and revert/remove any WIP commits like `wtp-split`, `linterfixes` if harmful or redundant

---

### 📺 YouTube Page
- [ ] Fix incorrect AI summaries (verify prompt, chunking, and API payloads)
- [ ] Restore proper video player aspect ratio (unsquash layout)
- [ ] Add editable YouTube video title
- [ ] Fix or re-enable transcript translation feature

---

### 📄 PDF Page
- [ ] Enable editing PDF filename
- [ ] Enable save/download of PDF with edited filename
- [ ] Reconnect or debug PDF summarization
- [ ] Fix dark mode issues in PDF view (e.g. text contrast, backgrounds)
- [ ] Add or restore Flash Card generation from PDF
- [ ] Fix translation rendering across all PDF pages (pagination/render loop)

---

## 🧪 Testing Plan

- [ ] Manual regression test: YouTube workspace load
- [ ] Manual regression test: PDF view, summary, and download
- [ ] Confirm working AI endpoints for summary, translation, flashcards
- [ ] Confirm layout consistency across dark/light mode

---

## 📌 Branch Info

- Branched from: `LinterFixes`
- Branch name: `fix/linter-bugs`
- Type: Stability patch + incremental feature restoration
- Target: Merge back into `LinterFixes` or future stable base

---

## 🗂️ Notes

Keep commits focused and small. Use clear messages like:

