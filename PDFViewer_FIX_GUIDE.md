 # PDF Viewer Issue Fix & Best Practices Guide



## 1. Summary of Issues & Root Causes



### A. Flashing on Load (Small PDFs)



- **Symptom:** PDF viewer flashes or re-renders multiple times when loading certain PDFs.
- **Root Cause:** <Document /> was only rendered when loading was false, causing a deadlock and repeated state changes.



### B. PDF Not Rendering (Stuck on Spinner)



- **Symptom:** Spinner and "Loading PDF..." message show indefinitely, PDF never appears.
- **Root Cause:** <Document /> was not rendered while loading was true, so its callbacks never fired and state never updated.



### C. Hydration Mismatch Warning (Next.js/React)



- **Symptom:** Console warning about hydration mismatch.
- **Root Cause:** Code that behaves differently on the server and client (e.g., using window or other browser-only APIs in the render path).



---



## 2. Best Practice Solution



### **A. Always Render <Document />**



Render <Document /> unconditionally, and overlay a spinner while loading is true.



```tsx
<Box sx={{ position: 'relative' }}>
<Document
file={url}
onLoadSuccess={onDocumentLoadSuccess}
onLoadError={onDocumentLoadError}
loading={null}
error={null}

{renderPages}
</Document>
{loading && (
<Box sx={{
position: 'absolute',
top: '50%',
left: '50%',
transform: 'translate(-50%, -50%)',
zIndex: 10,
bgcolor: 'rgba(255,255,255,0.7)',
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
gap: 2,
}}>
<CircularProgress />
<Typography>Loading PDF...</Typography>
</Box>
)}
</Box>
```



### **B. State Management**



- loading should be set to true initially.
- Set loading to false in onDocumentLoadSuccess and onDocumentLoadError.
- Do **not** conditionally render <Document /> based on loading.



### **C. Avoid SSR/CSR Mismatches**



- Any code using window, document, or browser-only APIs should be inside useEffect or guarded with typeof window !== 'undefined'.
- Do not use random values, time-based values, or browser-only APIs in the render path.



### **D. Clean Up Unused Code**



- Remove unused imports, variables, and debug console.log statements.
- Example linter errors to fix:
- 'useCallback' is defined but never used.
- 'InputAdornment' is defined but never used.
- 'pageHeight' is assigned a value but never used.
- 'entry' is never reassigned. Use 'const' instead.



---



## 3. Code Diff Example



**Before:**



```tsx
{loading ? (
<Box>...spinner...</Box>
) : (
<Document ...>...</Document>
)}
```



**After:**



```tsx
<Box sx={{ position: 'relative' }}>
<Document ...>...</Document>
{loading && (
<Box sx={{ position: 'absolute', ... }}>...spinner...</Box>
)}
</Box>
```



**Remove unused code:**



```diff
-import { useCallback } from 'react';
-import InputAdornment from '@mui/material/InputAdornment';
-const [pageHeight, setPageHeight] = useState<number>(0);
-// ...
-for (let entry of entries) {
+for (const entry of entries) {
```



---



## 4. Developer Checklist



- [ ] Always render <Document /> and overlay spinner for loading.
- [ ] Set loading state correctly in PDF load callbacks.
- [ ] Remove all unused imports, variables, and debug logs.
- [ ] Fix any SSR/CSR mismatches (especially with browser APIs).
- [ ] Wrap disabled buttons in <span> inside <Tooltip>.
- [ ] Test with both small and large PDFs.
- [ ] Confirm no hydration or tooltip warnings in the console.



---



## 5. Example Cursor Prompts



**Prompt to always render Document and overlay spinner:**

Refactor the PDFViewer so that the <Document /> component is always rendered, and the loading spinner is shown as an overlay when loading is true. Do not conditionally render <Document /> based on loading state.

**Prompt to clean up unused code:**

Remove all unused imports, variables, and debug console.log statements from PDFViewer.tsx. Fix any linter errors about unused code.

**Prompt to fix SSR/CSR mismatches:**

Audit PDFViewer.tsx for any code that uses window, document, or browser-only APIs in the render path. Move such code into useEffect or guard with typeof window !== 'undefined'.

**Prompt to fix Tooltip warning:**

Ensure that all disabled buttons inside <Tooltip> are wrapped in a <span> to avoid MUI warnings.

---



**If you need a cleaned-up file or further help, let the AI assistant know!**