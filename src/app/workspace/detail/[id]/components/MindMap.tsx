"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  useTheme,
  ButtonGroup,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import mermaid from "mermaid";

interface MindMapProps {
  content: string;
  type: "pdf" | "video";
  onError?: (error: string) => void;
  onDelete?: () => void;
}

export default function MindMap({
  content,
  type,
  onError,
  onDelete,
}: MindMapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(type === "pdf" ? 1.5 : 1.2);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const mindmapRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const theme = useTheme();

  const updateContainerHeight = useCallback(() => {
    if (mindmapRef.current) {
      const svgElement = mindmapRef.current.querySelector("svg");
      if (svgElement) {
        const svgRect = svgElement.getBoundingClientRect();
        const minHeight = 600;
        const padding = 120;
        const calculatedHeight = svgRect.height * zoom + padding;
        const newHeight = Math.max(minHeight, calculatedHeight);

        if (Math.abs(newHeight - containerHeight) > 50) {
          setContainerHeight(newHeight);
        }
      }
    }
  }, [zoom, containerHeight]);

  useEffect(() => {
    const processContent = async () => {
      try {
        let sections: string[] = [];
        if (type === "pdf") {
          sections = content
            .split(/(?:Chapter|Section)\s+\d+:?/i)
            .filter((section) => section.trim().length > 0)
            .slice(0, 12);
        } else {
          sections = content
            .split(/\d{2}:\d{2}/)
            .filter((section) => section.trim().length > 0)
            .slice(0, 12);
        }

        const cleanSections = sections.map((section) => {
          let cleaned = section
            .trim()
            .split(".")[0]
            .replace(/[\[\]()]/g, "")
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .trim();

          cleaned = cleaned.slice(0, 40) || "Section";
          return cleaned;
        });

        const mindmap = `mindmap
  root((${type === "pdf" ? "Document" : "Video"} Summary))
    Main Points
${cleanSections
  .slice(0, 4)
  .map((section) => `      ${section}`)
  .join("\n")}
    Key Details
${cleanSections
  .slice(4, 8)
  .map((section) => `      ${section}`)
  .join("\n")}
    Examples
${cleanSections
  .slice(8)
  .map((section) => `      ${section}`)
  .join("\n")}`;

        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          mindmap: {
            padding: 40,
            useMaxWidth: true,
          },
        });

        const { svg } = await mermaid.render("mindmap-svg", mindmap);

        if (mindmapRef.current) {
          mindmapRef.current.innerHTML = svg;
          const svgElement = mindmapRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.width = "100%";
            svgElement.style.height = "auto";
            svgElement.style.minHeight = "500px";
            svgElement.style.maxHeight = "none";
            svgElement.style.transform = `scale(${zoom})`;
            svgElement.style.transformOrigin = "center center";
            svgElement.style.transition = "transform 0.3s ease";

            const bbox = svgElement.getBBox();
            const padding = 40;
            svgElement.setAttribute(
              "viewBox",
              `${bbox.x - padding} ${bbox.y - padding} ${
                bbox.width + padding * 2
              } ${bbox.height + padding * 2}`
            );
            svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");

            if (resizeObserverRef.current) {
              resizeObserverRef.current.disconnect();
            }

            let resizeTimeout: NodeJS.Timeout;
            resizeObserverRef.current = new ResizeObserver(() => {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                requestAnimationFrame(updateContainerHeight);
              }, 250);
            });

            resizeObserverRef.current.observe(svgElement);

            setTimeout(() => {
              updateContainerHeight();
              setLoading(false);
            }, 250);
          }
        }
      } catch (err) {
        setError((err as Error).message);
        if (onError) {
          onError((err as Error).message);
        }
        setLoading(false);
      }
    };

    processContent();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [content, type, onError, zoom, updateContainerHeight]);

  const handleDownload = () => {
    const svg = document.querySelector(".mermaid svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindmap.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        position: "relative",
        overflow: "hidden",
        height: containerHeight,
        mb: 2,
        transition: "height 0.3s ease",
      }}
    >
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
      <Box
        ref={mindmapRef}
        id="mindmap"
        sx={{
          width: "100%",
          height: "calc(100% - 60px)",
          minHeight: "540px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
          "& svg": {
            maxWidth: "100%",
            height: "auto",
            minHeight: "500px",
            display: "block",
            margin: "0 auto",
          },
        }}
      />

      {/* Bottom controls container */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "calc(100% - 32px)",
          height: "40px",
          backgroundColor: theme.palette.background.paper,
          zIndex: 1,
        }}
      >
        {/* Mind Map Label */}
        <Box
          sx={{
            padding: "4px 12px",
            borderRadius: "4px",
            fontSize: "14px",
            color: theme.palette.primary.main,
            backgroundColor:
              theme.palette.mode === "light" ? "#ecf5ff" : "#1e1e2d",
            border: `1px solid ${
              theme.palette.mode === "light" ? "#d9ecff" : "#409eff"
            }`,
            height: "28px",
            lineHeight: "20px",
          }}
        >
          Mind Map
        </Box>

        {/* Zoom Controls */}
        <ButtonGroup
          size="small"
          sx={{ backgroundColor: theme.palette.background.paper }}
        >
          <IconButton onClick={handleZoomOut}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleResetZoom}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleZoomIn}>
            <AddIcon fontSize="small" />
          </IconButton>
        </ButtonGroup>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={handleDownload}
            sx={{
              bgcolor: theme.palette.background.paper,
              color: theme.palette.primary.main,
              "&:hover": {
                bgcolor: theme.palette.primary.light,
                color: "#fff",
              },
            }}
          >
            <DownloadIcon />
          </IconButton>
          {onDelete && (
            <IconButton
              onClick={onDelete}
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.error.main,
                "&:hover": {
                  bgcolor: theme.palette.error.light,
                  color: "#fff",
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
