"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  TextField,
  Paper,
  InputAdornment,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import LanguageIcon from "@mui/icons-material/Language";
import PreviewIcon from "@mui/icons-material/Preview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FitScreenIcon from '@mui/icons-material/FitScreen';
import EditIcon from '@mui/icons-material/Edit';
import TranslateIcon from '@mui/icons-material/Translate';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { extractPdfText } from "@/utils/pdfUtils";
import { LANGUAGES } from "@/utils/languages";

interface PDFViewerProps {
  url: string;
  onBack?: () => void;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
}

export function PDFViewer({ url, onBack, title: initialTitle = "PDF Document", onTitleChange }: PDFViewerProps) {
  const theme = useTheme();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>("1");
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<null | HTMLElement>(null);
  const zoomMenuOpen = Boolean(zoomAnchorEl);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [titleValue, setTitleValue] = useState<string>(initialTitle);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const languageMenuOpen = Boolean(languageAnchorEl);

  // --- New State for Translation ---
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(true); // Default to showing PDF
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageHeight(window.innerHeight * 0.55);

      const handleResize = () => {
        setPageHeight(window.innerHeight * 0.55);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (url) {
      setExtracting(true);
      setExtractError(null);
      extractPdfText(url)
        .then(({ text, pages }) => {
          setPdfText(text);
          setPdfPages(pages);
        })
        .catch(() => {
          setExtractError("Failed to extract PDF text.");
          setPdfText("");
          setPdfPages([]);
        })
        .finally(() => setExtracting(false));
    }
  }, [url]);

  useEffect(() => {
    setPageInputValue(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    if (initialTitle) {
      setTitleValue(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
      setContainerWidth(currentRef.clientWidth);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onPageLoadSuccess({ width, height }: { width: number; height: number }) {
    setPdfDimensions({ width, height });
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF. Please try again.");
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setPageNumber((page) => Math.min(numPages, page + 1));
  };

  const handlePageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    
    if (/^\d*$/.test(input)) {
      setPageInputValue(input);
      
      if (input !== '') {
        const value = parseInt(input);
        
        if (value >= 1 && value <= numPages) {
      setPageNumber(value);
        }
      }
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.1));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.1));
  };

  const handleCopy = () => {
    if (pdfText) {
      navigator.clipboard.writeText(pdfText);
      console.log("Copied extracted PDF text");
    } else {
      console.log("No PDF text to copy");
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = titleValue || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedTranslationLanguage(languageCode);
    handleLanguageMenuClose();
    
    // Check if the translation request is for a specific page
    const isPageSpecific = languageAnchorEl?.getAttribute('data-translate-page') === 'true';
    const pageIndexAttr = languageAnchorEl?.getAttribute('data-page-index');
    
    // Select the appropriate text to translate
    let textToTranslate = pdfText;
    
    if (isPageSpecific && pageIndexAttr !== null) {
      const pageIndex = parseInt(pageIndexAttr || '0', 10);
      textToTranslate = pdfPages[pageIndex] || '';
    }

    if (!textToTranslate) {
      setTranslationError(isPageSpecific
        ? "No text found on this page to translate."
        : "No PDF text extracted to translate.");
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedText(""); // Clear previous translation

    try {
      // Placeholder for actual translation call
      console.log(`Attempting to translate to: ${languageCode}, Text length: ${textToTranslate.length}`);
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.NEXT_PUBLIC_GOOGLE_TRANSLATION_API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({
          q: textToTranslate,
          target: languageCode,
          format: 'text' // or 'html'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Translation API request failed");
      }

      const data = await response.json();
      const translation = data.data?.translations?.[0]?.translatedText;

      if (translation) {
        setTranslatedText(translation);
        setShowPdf(false); // Switch to translated text view
      } else {
        throw new Error("No translation returned from API.");
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setTranslationError(err.message || "Failed to translate PDF content.");
    } finally {
      setIsTranslating(false);
    }
  };

  // --- Handler to show PDF again ---
  const handleShowPdf = () => {
    setShowPdf(true);
    setTranslatedText(""); // Clear translated text when going back to PDF
    setTranslationError(null);
  };

  const handleEditTitle = () => {
    setEditingTitle(true);
  };

  const handleSaveTitle = () => {
    setEditingTitle(false);
    if (onTitleChange) {
      onTitleChange(titleValue);
    }
  };

  const handleCancelTitleEdit = () => {
    setTitleValue(initialTitle);
    setEditingTitle(false);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(event.target.value);
  };

  const handleZoomMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setZoomAnchorEl(event.currentTarget);
  };

  const handleZoomMenuClose = () => {
    setZoomAnchorEl(null);
  };

  const handleZoomSelect = (newScale: number | 'fit-width' | 'fit-page') => {
    if (typeof newScale === 'number') {
      setScale(newScale);
    } else if (newScale === 'fit-width' && containerRef.current && pdfDimensions) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const fitWidthScale = containerWidth / pdfDimensions.width;
      setScale(Math.min(fitWidthScale * 0.95, 2.0));
      console.log("Fit Width applied, scale:", fitWidthScale * 0.95);
    } else if (newScale === 'fit-page' && containerRef.current && pdfDimensions) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const containerHeight = containerRef.current.clientHeight - 40;
      
      const fitWidthScale = containerWidth / pdfDimensions.width;
      const fitHeightScale = containerHeight / pdfDimensions.height;
      
      const fitPageScale = Math.min(fitWidthScale, fitHeightScale);
      setScale(Math.min(fitPageScale * 0.9, 2.0));
      console.log("Fit Page applied, scale:", fitPageScale * 0.9);
    } else {
      console.log("Couldn't apply fit scaling - missing dimensions", {
        containerPresent: !!containerRef.current,
        pdfDimensions: pdfDimensions,
        scaleRequested: newScale
      });
    }
    handleZoomMenuClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Top Controls - Redesigned */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          width: "100%",
        }}
      >
        {/* Left Section (Back Arrow + PDF Icon) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Back">
            <IconButton onClick={onBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          {!showPdf && (
            <Tooltip title="PDF Document">
              <IconButton size="small" disabled>
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          )}
          {showPdf && (
            <Tooltip title="PDF Document">
              <IconButton size="small" disabled>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
          )}
        </Box>

        {/* Center Section (Page Nav + Zoom) */}
        {showPdf && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Page Navigation */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Previous Page">
                <span> {/* Span needed for tooltip on disabled button */}
                  <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1} size="small">
              <NavigateBeforeIcon />
            </IconButton>
                </span>
              </Tooltip>

              {/* Page Number Input/Display */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TextField
                  inputRef={pageInputRef}
                  value={pageInputValue}
                  onChange={handlePageInput}
                  size="small"
                  type="text"
                  inputProps={{ 
                    style: { textAlign: 'center' },
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    min: "1",
                    max: numPages > 0 ? String(numPages) : undefined
                  }}
                  sx={{
                    width: "50px", // Adjust width as needed
                    "& .MuiInputBase-input": {
                      py: "4px", // Reduce padding
                      fontSize: "0.875rem",
                    },
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          const value = parseInt(pageInputValue);
                          
                          if (!isNaN(value) && value >= 1 && value <= numPages) {
                              setPageNumber(value);
                          } else {
                              setPageInputValue(String(pageNumber));
                          }
                          
                          e.currentTarget.blur();
                      }
                  }}
                />
                <Typography variant="body2" sx={{ mx: 0.5 }}>
                  / {numPages || '...'}
            </Typography>
              </Box>

              <Tooltip title="Next Page">
                <span> {/* Span needed for tooltip on disabled button */}
            <IconButton
              onClick={goToNextPage}
                    disabled={pageNumber >= numPages || numPages === 0}
                    size="small"
            >
              <NavigateNextIcon />
            </IconButton>
                </span>
              </Tooltip>
          </Box>

            {/* Separator */}
            <Box sx={{ borderLeft: 1, borderColor: 'divider', height: '24px' }} />

          {/* Zoom Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <Tooltip title="Zoom Out">
                 <span>
                   <IconButton onClick={zoomOut} disabled={scale <= 0.5} size="small">
              <ZoomOutIcon />
            </IconButton>
                 </span>
               </Tooltip>

              {/* Zoom Level Display/Select Button */}
               <Button
                  id="zoom-button"
                  aria-controls={zoomMenuOpen ? 'zoom-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={zoomMenuOpen ? 'true' : undefined}
                  variant="outlined"
                  size="small"
                  onClick={handleZoomMenuOpen}
                  sx={{ minWidth: '70px', py: '2px', fontSize: '0.8rem' }}
               >
                   {Math.round(scale * 100)}%
               </Button>
               <Menu
                 id="zoom-menu"
                 anchorEl={zoomAnchorEl}
                 open={zoomMenuOpen}
                 onClose={handleZoomMenuClose}
                 MenuListProps={{
                     'aria-labelledby': 'zoom-button',
                 }}
                 anchorOrigin={{
                     vertical: 'bottom',
                     horizontal: 'center',
                 }}
                 transformOrigin={{
                     vertical: 'top',
                     horizontal: 'center',
                 }}
               >
                 <MenuItem onClick={() => handleZoomSelect('fit-page')}>Fit Page</MenuItem>
                 <MenuItem onClick={() => handleZoomSelect('fit-width')}>Fit Width</MenuItem>
                 <Box sx={{ borderTop: 1, borderColor: 'divider', my: 0.5 }} />
                 {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((level) => (
                     <MenuItem key={level} onClick={() => handleZoomSelect(level)} selected={scale === level}>
                         {Math.round(level * 100)}%
                     </MenuItem>
                 ))}
               </Menu>

               <Tooltip title="Zoom In">
                 <span>
                   <IconButton onClick={zoomIn} disabled={scale >= 2.0} size="small">
              <ZoomInIcon />
            </IconButton>
                 </span>
               </Tooltip>
            </Box>
          </Box>
        )}
        {!showPdf && <Box sx={{ flexGrow: 1 }} /> /* Spacer when controls are hidden */}

        {/* Right Section - Updated with conditional Preview button */}
        <Box sx={{ display: "flex", gap: 1, alignItems: 'center' }}>
          {showPdf && (
            <Tooltip title="Download PDF">
              <IconButton onClick={handleDownload} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          )}
          
          {showPdf && (
            <>
              <Tooltip title="Translate Content">
                <IconButton 
                  onClick={handleLanguageMenuOpen}
                  size="small"
                  aria-controls={languageMenuOpen ? 'language-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={languageMenuOpen ? 'true' : undefined}
                  disabled={isTranslating || !pdfText} // Disable if no text or during translation
                >
                  {isTranslating ? <CircularProgress size={20} /> : <TranslateIcon />}
                </IconButton>
              </Tooltip>
              <Menu
                id="language-menu"
                anchorEl={languageAnchorEl}
                open={languageMenuOpen}
                onClose={handleLanguageMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'language-button',
                }}
              >
                {LANGUAGES.map((lang) => ( // Assuming LANGUAGES is an array of {code, name}
                  <MenuItem key={lang.code} onClick={() => handleLanguageSelect(lang.code)}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          
          {/* Edit title button - always visible but functionality might differ based on view */}
          {editingTitle ? (
            <>
              <TextField 
                value={titleValue}
                onChange={handleTitleChange}
                size="small"
                autoFocus
                variant="outlined"
                sx={{ 
                  width: '150px',
                  mr: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    fontSize: '0.875rem'
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    handleCancelTitleEdit();
                  }
                }}
              />
              <Tooltip title="Save">
                <IconButton onClick={handleSaveTitle} size="small" color="primary">
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton onClick={handleCancelTitleEdit} size="small">
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Edit Title">
              <IconButton onClick={handleEditTitle} size="small">
                <EditIcon />
            </IconButton>
          </Tooltip>
          )}

          {!showPdf && (
            <Tooltip title="Preview PDF">
              <IconButton onClick={handleShowPdf} size="small">
              <PreviewIcon />
            </IconButton>
          </Tooltip>
          )}
        </Box>
      </Box>

      {/* Content Area: PDF or Translated Text */}
      <Paper
        ref={containerRef}
        elevation={0}
        sx={{
          flex: 1,
          bgcolor: 'transparent',
          display: "flex",
          marginTop: "20px",
          borderRadius: "10px",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          width: "100%",
        }}
      >
        {showPdf ? (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
        {extracting && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems:"center", height:"100%" }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Extracting PDF text...</Typography>
          </Box>
        )}
        {extractError && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems:"center", height:"100%" }}>
            <Typography color="error">{extractError}</Typography>
          </Box>
        )}
        {!extracting && !extractError && (
              <>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems:"center", height:"100%" }}>
                <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Loading PDF...</Typography>
              </Box>
            }
          >
                  {numPages > 0 && Array.from(new Array(numPages)).map((_, index) => (
                    <Box key={`page_container_${index + 1}`} sx={{ mb: 3, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
              scale={scale}
                        width={containerWidth > 20 ? containerWidth - 10 : undefined}
              loading={
                          <Box sx={{ display: "flex", justifyContent: "center", alignItems:"center", height:"100%" }}>
                  <CircularProgress />
                </Box>
              }
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
              className="pdf-page"
                        onLoadSuccess={onPageLoadSuccess}
            />

                      {/* Page-specific footer with controls */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
                          width: containerWidth > 20 ? containerWidth - 10 : "100%",
                          mt: 1,
                          mb: 1,
                          p: 0,
                          borderRadius: 1,
                        }}
                      >
                        {/* Left section - empty */}
                        <Box sx={{ flex: 1 }}></Box>
                        
                        {/* Center section - page number */}
                        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {index + 1}/{numPages}
                          </Typography>
                        </Box>
                        
                        {/* Right section - copy and translate for this page */}
                        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                          <Tooltip title="Copy Page Text">
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  const pageText = pdfPages[index] || '';
                                  if (pageText) {
                                    navigator.clipboard.writeText(pageText);
                                  }
                                }}
                                disabled={!pdfPages.length || index >= pdfPages.length}
                              >
                                <ContentCopyIcon fontSize="small" />
                </IconButton>
                            </span>
              </Tooltip>
                          
                          <Tooltip title="Translate Page">
                            <span>
                              <IconButton 
                                size="small"
                                onClick={(event) => {
                                  // Set data attributes to identify this page
                                  event.currentTarget.setAttribute('data-translate-page', 'true');
                                  event.currentTarget.setAttribute('data-page-index', String(index));
                                  setLanguageAnchorEl(event.currentTarget);
                                }}
                                disabled={!pdfPages.length || index >= pdfPages.length}
                              >
                                <TranslateIcon fontSize="small" />
                </IconButton>
                            </span>
              </Tooltip>
            </Box>
                      </Box>
                    </Box>
                  ))}
                </Document>
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, overflowY: 'auto', height: '100%', width:'100%' }}>
            {isTranslating && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Translating...</Typography>
              </Box>
            )}
            {translationError && (
              <Box sx={{ display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="error">Error: {translationError}</Typography>
                <Button onClick={handleShowPdf} sx={{mt:1}}>Back to PDF</Button>
              </Box>
            )}
            {!isTranslating && !translationError && translatedText && (
              <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily:'inherit' }}>
                {translatedText}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
