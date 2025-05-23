"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import Skeleton from "@mui/material/Skeleton";

import { Document, Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Icons
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import TranslateIcon from "@mui/icons-material/Translate";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

import { extractPdfText } from "@/utils/pdfUtils";
import { LANGUAGES } from "@/utils/languages";

interface PDFViewerProps {
  url: string;
  onBack?: () => void;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
}

interface TextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  transform?: number[];
  fontName?: string;
}

interface PageDimensions {
  width: number;
  height: number;
}

// Styled components
const PDFContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  margin: "0 auto",
  maxWidth: "1200px",
  padding: theme.spacing(3),
}));

const PageContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  position: "relative",
  marginBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.3s ease-in-out",
}));

const PageContent = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  borderRadius: "8px",
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  display: "flex",
  justifyContent: "center",
  "& .pdf-page": {
    borderRadius: "4px",
    overflow: "hidden",
  },
}));

const PageControls = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[50],
  backdropFilter: "blur(8px)",
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  zIndex: 1,
}));

const PDFLoadingSkeleton = () => {
  const numSkeletons = 3;

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2 }}>
      {Array.from({ length: numSkeletons }).map((_, index) => (
        <PageContainer key={`skeleton-container-${index}`}>
          <PageContent>
            <Skeleton
              variant="rectangular"
              width="100%"
              sx={{
                height: "842px", // Standard A4 height at 96 DPI
                transform: "none",
                transformOrigin: "0 0",
                animationDuration: "2s",
                borderRadius: 1,
              }}
            />
          </PageContent>
          <PageControls>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Skeleton
                variant="text"
                width={60}
                height={24}
                sx={{
                  transform: "none",
                  animationDuration: "2s",
                }}
              />
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          </PageControls>
        </PageContainer>
      ))}
    </Box>
  );
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  onBack,
  title: initialTitle = "PDF Document",
  onTitleChange,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>("1");
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<null | HTMLElement>(null);
  const zoomMenuOpen = Boolean(zoomAnchorEl);
  const [pdfDimensions, setPdfDimensions] = useState<PageDimensions | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [titleValue, setTitleValue] = useState<string>(initialTitle);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const languageMenuOpen = Boolean(languageAnchorEl);
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(true);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(true);
  const [isTextExtracting, setIsTextExtracting] = useState<boolean>(false);
  const loadStartTime = useRef<number>(Date.now());
  const preloadTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const pageLoadTimes = useRef<{ [key: number]: number }>({});
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (url) {
      loadStartTime.current = Date.now();
      console.log(`[Performance] PDF loading started for URL: ${url}`);
      console.log(
        `[Performance] Initial render time: ${
          Date.now() - loadStartTime.current
        }ms`
      );

      setIsPdfLoading(true);
      setIsTextExtracting(true);

      const extractionTimeout = setTimeout(() => {
        const extractStartTime = Date.now();
        console.log("[Performance] Starting text extraction");

        extractPdfText(url)
          .then(({ text, pages }) => {
            const extractEndTime = Date.now();
            console.log(
              `[Performance] Text extraction completed in ${
                extractEndTime - extractStartTime
              }ms`
            );
            console.log(
              `[Performance] Extracted ${pages.length} pages of text`
            );
            setPdfText(text);
            setPdfPages(pages);
          })
          .catch((error) => {
            console.error("[Performance] Text extraction failed:", error);
            setError("Failed to extract PDF text.");
            setPdfText("");
            setPdfPages([]);
          })
          .finally(() => {
            setIsTextExtracting(false);
          });
      }, 100);

      return () => clearTimeout(extractionTimeout);
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
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
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

  // Optimize page loading
  const loadPage = useCallback(
    async (pageNum: number, pdf: PDFDocumentProxy) => {
      const startTime = performance.now();
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Add to loaded pages
        setLoadedPages((prev: Set<number>) => new Set([...prev, pageNum]));

        // Update PDF dimensions
        setPdfDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        // Track load time
        const endTime = performance.now();
        pageLoadTimes.current[pageNum] = endTime;
        console.log(
          `[Performance] Page ${pageNum} loaded in ${Math.round(
            endTime - startTime
          )}ms`
        );

        return { page, viewport };
      } catch (error) {
        console.error(`Error loading page ${pageNum}:`, error);
        throw error;
      }
    },
    [scale]
  );

  // Preload next pages
  const preloadPages = useCallback(
    async (currentPage: number, pdf: PDFDocumentProxy) => {
      if (isPreloading) return;
      setIsPreloading(true);

      try {
        const pagesToPreload = 2; // Preload next 2 pages
        const startPage = currentPage + 1;
        const endPage = Math.min(startPage + pagesToPreload, pdf.numPages);

        for (let i = startPage; i <= endPage; i++) {
          if (!loadedPages.has(i)) {
            await loadPage(i, pdf);
          }
        }
      } finally {
        setIsPreloading(false);
      }
    },
    [isPreloading, loadedPages, loadPage]
  );

  // Optimize text extraction
  const extractTextFromPdf = useCallback(async (pdf: PDFDocumentProxy) => {
    const startTime = performance.now();
    console.log("[Performance] Starting text extraction");

    try {
      const textPromises = Array.from(
        { length: pdf.numPages },
        async (_, i) => {
          const page = await pdf.getPage(i + 1);
          const textContent = await page.getTextContent();
          return textContent;
        }
      );

      const textContents = await Promise.all(textPromises);
      const extractedText = textContents
        .map((content) =>
          (content.items as (TextItem | TextMarkedContent)[])
            .filter((item): item is TextItem => "str" in item)
            .map((item) => item.str)
            .join(" ")
        )
        .join("\n\n");

      const endTime = performance.now();
      console.log(
        `[Performance] Text extraction completed in ${Math.round(
          endTime - startTime
        )}ms`
      );

      return extractedText;
    } catch (error) {
      console.error("Error extracting text:", error);
      throw error;
    }
  }, []);

  // Update onDocumentLoadSuccess to store PDF reference
  const onDocumentLoadSuccess = useCallback(
    (document: PDFDocumentProxy) => {
      const loadTime = Date.now() - loadStartTime.current;
      console.log(
        `[Performance] PDF document loaded successfully in ${loadTime}ms`,
        `Number of pages: ${document.numPages}`
      );

      setNumPages(document.numPages);
      setIsPdfLoading(false);
      setError(null);
      pdfDocRef.current = document;

      // Start text extraction
      setIsTextExtracting(true);
      extractTextFromPdf(document)
        .then((text) => {
          setPdfText(text);
          const pages = text.split("\n\n");
          setPdfPages(pages);
          setIsTextExtracting(false);
        })
        .catch((err) => {
          console.error("Text extraction error:", err);
          setIsTextExtracting(false);
        });
    },
    [extractTextFromPdf]
  );

  // Handle page load success with proper typing
  const onPageLoadSuccess = useCallback(
    ({
      pageNumber,
      width,
      height,
    }: {
      pageNumber: number;
      width: number;
      height: number;
    }) => {
      const currentTime = Date.now();
      const timeFromStart = currentTime - loadStartTime.current;
      console.log(
        `[Performance] Page ${pageNumber} loaded in ${timeFromStart}ms`
      );
      console.log(`[Performance] Page dimensions: ${width}x${height}`);

      setPdfDimensions({ width, height });

      // Schedule preloading of next pages
      if (preloadTimeout.current) {
        clearTimeout(preloadTimeout.current);
      }
      preloadTimeout.current = setTimeout(() => {
        if (pdfDocRef.current) {
          preloadPages(pageNumber, pdfDocRef.current);
        }
      }, 1000) as NodeJS.Timeout;
    },
    [preloadPages]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (preloadTimeout.current) {
        clearTimeout(preloadTimeout.current);
      }
      // Clean up PDF document
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(console.error);
      }
    };
  }, []);

  function onDocumentLoadError(error: Error) {
    const loadTime = Date.now() - loadStartTime.current;
    console.error(`[Performance] PDF load failed after ${loadTime}ms:`, error);
    setError("Failed to load PDF. Please try again.");
    setIsPdfLoading(false);
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

      if (input !== "") {
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
    setScale((prevScale) => Math.max(0.5, prevScale - 0.1));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = titleValue || "document.pdf";
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
    handleLanguageMenuClose();

    const isPageSpecific =
      languageAnchorEl?.getAttribute("data-translate-page") === "true";
    const pageIndexAttr = languageAnchorEl?.getAttribute("data-page-index");

    // Select the appropriate text to translate
    let textToTranslate = pdfText;

    if (isPageSpecific && pageIndexAttr !== null) {
      const pageIndex = parseInt(pageIndexAttr || "0", 10);
      textToTranslate = pdfPages[pageIndex] || "";
    }

    if (!textToTranslate) {
      setTranslationError(
        isPageSpecific
          ? "No text found on this page to translate."
          : "No PDF text extracted to translate."
      );
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedText(""); // Clear previous translation

    try {
      // Placeholder for actual translation call
      console.log(
        `Attempting to translate to: ${languageCode}, Text length: ${textToTranslate.length}`
      );
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.NEXT_PUBLIC_GOOGLE_TRANSLATION_API_KEY}`,
        {
          method: "POST",
          body: JSON.stringify({
            q: textToTranslate,
            target: languageCode,
            format: "text", // or 'html'
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Translation API request failed"
        );
      }

      const data = await response.json();
      const translation = data.data?.translations?.[0]?.translatedText;

      if (translation) {
        setTranslatedText(translation);
        setShowPdf(false); // Switch to translated text view
      } else {
        throw new Error("No translation returned from API.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Translation error:", error);
      setTranslationError(error?.message || "Failed to translate PDF content.");
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

  const handleZoomSelect = (newScale: number | "fit-width" | "fit-page") => {
    if (typeof newScale === "number") {
      setScale(newScale);
    } else if (
      newScale === "fit-width" &&
      containerRef.current &&
      pdfDimensions
    ) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const fitWidthScale = containerWidth / pdfDimensions.width;
      setScale(Math.min(fitWidthScale * 0.95, 2.0));
      console.log("Fit Width applied, scale:", fitWidthScale * 0.95);
    } else if (
      newScale === "fit-page" &&
      containerRef.current &&
      pdfDimensions
    ) {
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
        scaleRequested: newScale,
      });
    }
    handleZoomMenuClose();
  };

  const renderPageControls = (index: number) => (
    <PageControls>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {index + 1}/{numPages}
        </Typography>
      </Box>
      <Box
        sx={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}
      >
        <Tooltip title="Copy Page Text">
          <Box component="span">
            <IconButton
              size="small"
              onClick={() => {
                const pageText = pdfPages[index] || "";
                if (pageText) {
                  navigator.clipboard.writeText(pageText);
                }
              }}
              disabled={!pdfPages.length || index >= pdfPages.length}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="Translate Page">
          <Box component="span">
            <IconButton
              size="small"
              onClick={(event) => {
                event.currentTarget.setAttribute("data-translate-page", "true");
                event.currentTarget.setAttribute(
                  "data-page-index",
                  String(index)
                );
                setLanguageAnchorEl(event.currentTarget);
              }}
              disabled={!pdfPages.length || index >= pdfPages.length}
            >
              <TranslateIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
    </PageControls>
  );

  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
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
          flexShrink: 0,
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
                <Box component="span">
                  {" "}
                  {/* Wrapper for disabled button */}
                  <IconButton
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    size="small"
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </Box>
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
                    style: { textAlign: "center" },
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    min: "1",
                    max: numPages > 0 ? String(numPages) : undefined,
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
                    if (e.key === "Enter") {
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
                  / {numPages || "..."}
                </Typography>
              </Box>

              <Tooltip title="Next Page">
                <Box component="span">
                  {" "}
                  {/* Wrapper for disabled button */}
                  <IconButton
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages || numPages === 0}
                    size="small"
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </Box>
              </Tooltip>
            </Box>

            {/* Separator */}
            <Box
              sx={{ borderLeft: 1, borderColor: "divider", height: "24px" }}
            />

            {/* Zoom Controls */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Zoom Out">
                <Box component="span">
                  {" "}
                  {/* Wrapper for disabled button */}
                  <IconButton
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    size="small"
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Box>
              </Tooltip>

              {/* Zoom Level Display/Select Button */}
              <Button
                id="zoom-button"
                aria-controls={zoomMenuOpen ? "zoom-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={zoomMenuOpen ? "true" : undefined}
                variant="outlined"
                size="small"
                onClick={handleZoomMenuOpen}
                sx={{ minWidth: "70px", py: "2px", fontSize: "0.8rem" }}
              >
                {Math.round(scale * 100)}%
              </Button>
              <Menu
                id="zoom-menu"
                anchorEl={zoomAnchorEl}
                open={zoomMenuOpen}
                onClose={handleZoomMenuClose}
                MenuListProps={{
                  "aria-labelledby": "zoom-button",
                }}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <MenuItem onClick={() => handleZoomSelect("fit-page")}>
                  Fit Page
                </MenuItem>
                <MenuItem onClick={() => handleZoomSelect("fit-width")}>
                  Fit Width
                </MenuItem>
                <Box sx={{ borderTop: 1, borderColor: "divider", my: 0.5 }} />
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((level) => (
                  <MenuItem
                    key={level}
                    onClick={() => handleZoomSelect(level)}
                    selected={scale === level}
                  >
                    {Math.round(level * 100)}%
                  </MenuItem>
                ))}
              </Menu>

              <Tooltip title="Zoom In">
                <Box component="span">
                  {" "}
                  {/* Wrapper for disabled button */}
                  <IconButton
                    onClick={zoomIn}
                    disabled={scale >= 2.0}
                    size="small"
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        )}
        {
          !showPdf && (
            <Box sx={{ flexGrow: 1 }} />
          ) /* Spacer when controls are hidden */
        }

        {/* Right Section - Updated with conditional Preview button */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                <Box component="span">
                  {" "}
                  {/* Wrapper for disabled button */}
                  <IconButton
                    onClick={handleLanguageMenuOpen}
                    size="small"
                    disabled={isTranslating || !pdfText}
                  >
                    {isTranslating ? (
                      <CircularProgress size={20} />
                    ) : (
                      <TranslateIcon />
                    )}
                  </IconButton>
                </Box>
              </Tooltip>
              <Menu
                id="language-menu"
                anchorEl={languageAnchorEl}
                open={languageMenuOpen}
                onClose={handleLanguageMenuClose}
                MenuListProps={{
                  "aria-labelledby": "language-button",
                }}
              >
                {LANGUAGES.map(
                  (
                    lang // Assuming LANGUAGES is an array of {code, name}
                  ) => (
                    <MenuItem
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      {lang.name}
                    </MenuItem>
                  )
                )}
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
                  width: "150px",
                  mr: 1,
                  "& .MuiOutlinedInput-root": {
                    height: "32px",
                    fontSize: "0.875rem",
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTitle();
                  } else if (e.key === "Escape") {
                    handleCancelTitleEdit();
                  }
                }}
              />
              <Tooltip title="Save">
                <IconButton
                  onClick={handleSaveTitle}
                  size="small"
                  color="primary"
                >
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
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          position: "relative",
          height: "calc(100vh - 64px)",
          bgcolor: "grey.50", // Light grey background
        }}
      >
        <PDFContainer ref={containerRef}>
          {showPdf ? (
            <>
              {(isPdfLoading || isTextExtracting) && <PDFLoadingSkeleton />}

              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                error={null}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <PageContainer key={`page_container_${index + 1}`}>
                    <PageContent>
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={scale}
                        width={
                          containerWidth > 20 ? containerWidth - 120 : undefined
                        }
                        loading={null}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="pdf-page"
                        onLoadSuccess={onPageLoadSuccess}
                      />
                    </PageContent>
                    {renderPageControls(index)}
                  </PageContainer>
                ))}
              </Document>

              {error && !isPdfLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                    bgcolor: "background.paper",
                    p: 3,
                    borderRadius: 2,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  <Typography color="error">{error}</Typography>
                </Box>
              )}
            </>
          ) : (
            <Box
              component="div"
              sx={{
                p: 3,
                height: "100%",
                width: "100%",
                overflow: "auto",
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {isTranslating && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Translating...</Typography>
                </Box>
              )}
              {translationError && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Typography color="error">
                    Error: {translationError}
                  </Typography>
                  <Button onClick={handleShowPdf} sx={{ mt: 1 }}>
                    Back to PDF
                  </Button>
                </Box>
              )}
              {!isTranslating && !translationError && translatedText && (
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}
                >
                  {translatedText}
                </Typography>
              )}
            </Box>
          )}
        </PDFContainer>
      </Box>
    </Box>
  );
};

export default PDFViewer;
