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
import { extractPdfText } from "@/utils/pdfUtils";

interface PDFViewerProps {
  url: string;
  onBack?: () => void;
}

export function PDFViewer({ url, onBack }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

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
      console.log("PDF URL for Document:", url);
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
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
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1 && value <= numPages) {
      setPageNumber(value);
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

  const handleLanguage = () => {
    // Implement language selection
    console.log("Change language");
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log("Download PDF");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 200px)",
        bgcolor: "grey.100",
        marginTop: "20px",
      }}
    >
      {/* Top Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* Left Group */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Back">
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="PDF">
            <IconButton>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Center Group - Page Controls and Zoom */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="body2">
              {pageNumber} / {numPages}
            </Typography>
            <IconButton
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>

          {/* Zoom Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOutIcon />
            </IconButton>
            <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
            <IconButton onClick={zoomIn} disabled={scale >= 2.0}>
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Right Group */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Language">
            <IconButton onClick={handleLanguage}>
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview">
            <IconButton>
              <PreviewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* PDF Content */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          m: 2,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "visible",
          position: "relative",
          maxHeight: "55vh",
        }}
      >
        {extracting && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Extracting PDF text...</Typography>
          </Box>
        )}
        {extractError && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Typography color="error">{extractError}</Typography>
          </Box>
        )}
        {!extracting && !extractError && (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
              </Box>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <CircularProgress />
                </Box>
              }
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="pdf-page"
              height={pageHeight}
            />
          </Document>
        )}

        {/* Bottom Controls */}
        {!loading && !error && numPages > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              p: 2,
              width: "100%",
              position: "absolute",
              bottom: "-60px",
              right: 0,
            }}
          >
            {/* Left side - empty for spacing */}
            <Box sx={{ width: "80px" }} />

            {/* Center - Page Numbers */}
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              {pageNumber} / {numPages}
            </Typography>

            {/* Right side - Action Buttons */}
            <Box sx={{ display: "flex", gap: 1, width: "80px" }}>
              <Tooltip title="Copy">
                <IconButton onClick={handleCopy}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Language">
                <IconButton onClick={handleLanguage}>
                  <LanguageIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
