"use client";

import React, { useEffect, useRef, useState } from "react";
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
import OpenAI from "openai";
import summaryPrompts from "@/utils/summaryPrompts.json";

interface MindMapProps {
  content: string;
  type: "pdf" | "video";
  onError?: (error: string) => void;
  onDelete?: () => void;
}

interface MindMapNode {
  level: number;
  text: string;
  children: MindMapNode[];
}

const MindMap: React.FC<MindMapProps> = ({
  content,
  type,
  onError,
  onDelete,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(type === "pdf" ? 1.5 : 1.2);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mindmapRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const theme = useTheme();

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const sanitizeText = (text: string) => {
    return text
      .replace(/[()[\]{}]/g, "") // Remove parentheses and brackets
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters except hyphen
      .trim();
  };

  const optimizeLabel = (text: string) => {
    // Remove dates unless they're critical
    const withoutDates = text.replace(/\d{4}(-\d{2})?(-\d{2})?/g, "");
    // Remove redundant words
    const withoutRedundancy = withoutDates
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, "")
      .trim();
    // Limit to 7 words
    const words = withoutRedundancy.split(/\s+/);
    return words.slice(0, 7).join(" ");
  };

  const parseMarkdownToNodes = (markdown: string): MindMapNode[] => {
    const lines = markdown.split("\n").filter((line) => line.trim());
    const root: MindMapNode = { level: 0, text: "", children: [] };
    const stack: MindMapNode[] = [root];

    for (const line of lines) {
      const match = line.match(/^(#+)\s+(.+)$/);
      if (!match) continue;

      const [, hashes, text] = match;
      const level = hashes.length;
      const node: MindMapNode = {
        level,
        text: optimizeLabel(sanitizeText(text)),
        children: [],
      };

      // Find the appropriate parent
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Add to parent's children
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }

    return root.children;
  };

  const generateMermaidSyntax = (nodes: MindMapNode[]): string => {
    const buildNode = (node: MindMapNode, indent: string = ""): string => {
      // Ensure node has text content
      const nodeText = node.text.trim() || "Untitled";
      let result = `${indent}${
        node.level === 1 ? "root" : "--"
      }[${nodeText}]\n`;

      // Add children with increased indentation
      for (const child of node.children) {
        result += buildNode(child, indent + "  ");
      }

      return result;
    };

    const rootNode = nodes[0];
    if (!rootNode) return "";

    return `mindmap\n${buildNode(rootNode)}`;
  };

  // Add pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click only
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const processContent = async () => {
    try {
      console.log("[MindMap] Starting content processing");
      console.log("[MindMap] Content type:", type);
      console.log("[MindMap] Content length:", content?.length);

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              summaryPrompts["mm-text"]?.systemPrompt ||
              "Create a hierarchical mind map from the content.",
          },
          {
            role: "user",
            content: (
              summaryPrompts["mm-text"]?.userPrompt ||
              "Create a mind map from this content:\n\n{transcript}"
            ).replace("{transcript}", content),
          },
        ],
      });

      const mindmapContent = response.choices[0].message.content;
      if (!mindmapContent) {
        throw new Error("No content returned from OpenAI");
      }

      // Parse the markdown into nodes
      const nodes = parseMarkdownToNodes(mindmapContent);

      // Generate Mermaid syntax
      const mindmapSyntax = generateMermaidSyntax(nodes);
      console.log("[MindMap] Generated syntax:", mindmapSyntax);

      // Initialize mermaid with proper config
      mermaid.initialize({
        startOnLoad: true,
        theme: theme.palette.mode === "dark" ? "dark" : "default",
        securityLevel: "loose",
        mindmap: {
          padding: 40,
          useMaxWidth: true,
        },
      });

      // Clear previous content
      if (mindmapRef.current) {
        mindmapRef.current.innerHTML = "";
      }

      try {
        // Generate a valid ID for the mindmap
        const diagramId = `mindmap-${Math.random()
          .toString(36)
          .substring(2, 15)}`;

        // Create a temporary container with the valid ID
        const tempContainer = document.createElement("div");
        tempContainer.id = diagramId;
        if (mindmapRef.current) {
          mindmapRef.current.appendChild(tempContainer);
        }

        const { svg } = await mermaid.render(diagramId, mindmapSyntax);

        if (mindmapRef.current) {
          mindmapRef.current.innerHTML = svg;
          const svgElement = mindmapRef.current.querySelector("svg");
          if (svgElement) {
            // Set initial SVG properties
            svgElement.style.width = "100%";
            svgElement.style.height = "auto";
            svgElement.style.minHeight = "500px";
            svgElement.style.maxHeight = "none";

            // Create a wrapper div for zooming and panning
            const wrapper = document.createElement("div");
            wrapper.style.width = "100%";
            wrapper.style.height = "100%";
            wrapper.style.display = "flex";
            wrapper.style.justifyContent = "center";
            wrapper.style.alignItems = "center";
            wrapper.style.overflow = "visible";
            wrapper.style.transform = `scale(${zoom}) translate(${panPosition.x}px, ${panPosition.y}px)`;
            wrapper.style.transformOrigin = "center center";
            wrapper.style.transition = "transform 0.3s ease";
            wrapper.style.cursor = "grab";

            // Move SVG into wrapper
            mindmapRef.current.innerHTML = "";
            wrapper.appendChild(svgElement);
            mindmapRef.current.appendChild(wrapper);

            // Update container height based on SVG size
            const updateHeight = () => {
              const bbox = svgElement.getBoundingClientRect();
              const minHeight = 600;
              const padding = 120;
              const calculatedHeight = bbox.height * zoom + padding;
              const newHeight = Math.max(minHeight, calculatedHeight);

              if (Math.abs(newHeight - containerHeight) > 50) {
                setContainerHeight(newHeight);
              }
            };

            // Set up resize observer
            if (resizeObserverRef.current) {
              resizeObserverRef.current.disconnect();
            }

            let resizeTimeout: NodeJS.Timeout;
            resizeObserverRef.current = new ResizeObserver(() => {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(updateHeight, 250);
            });

            resizeObserverRef.current.observe(svgElement);
            updateHeight();
          }
        }
      } catch (renderError) {
        console.error("[MindMap] Render error:", renderError);
        throw new Error("Failed to render mind map");
      }

      setLoading(false);
    } catch (err) {
      console.error("[MindMap] Error processing content:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    processContent();
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [content, type]);

  // Update zoom effect to include pan position
  useEffect(() => {
    if (mindmapRef.current) {
      const wrapper = mindmapRef.current.querySelector("div");
      if (wrapper) {
        wrapper.style.transform = `scale(${zoom}) translate(${panPosition.x}px, ${panPosition.y}px)`;
      }
    }
  }, [zoom, panPosition]);

  const handleDownload = async () => {
    const svg = document.querySelector(".mermaid svg");
    if (!svg) return;

    try {
      // Create a canvas with 2x resolution for better quality
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = svg.clientWidth * scale;
      canvas.height = svg.clientHeight * scale;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Create a Blob from the SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const URL = window.URL || window.webkitURL || window;
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create an image from the SVG
      const img = new Image();
      img.onload = () => {
        // Set background to white for better visibility
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image scaled up
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mindmap-${
              new Date().toISOString().split("T")[0]
            }.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, "image/png");
      };
      img.src = svgUrl;
    } catch (error) {
      console.error("Error downloading mind map:", error);
    }
  };

  const handleDownloadSVG = async () => {
    const svg = document.querySelector(".mermaid svg");
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const URL = window.URL || window.webkitURL || window;
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindmap-${new Date().toISOString().split("T")[0]}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading SVG mind map:", error);
    }
  };

  const handleZoomIn = () =>
    setZoom((prev) => {
      const step = prev >= 2 ? 0.25 : 0.1; // Larger steps at higher zoom levels
      return Math.min(prev + step, 5); // Increased max zoom to 5x
    });
  const handleZoomOut = () =>
    setZoom((prev) => {
      const step = prev > 2 ? 0.25 : 0.1; // Matching step size for zooming out
      return Math.max(prev - step, 0.5);
    });
  const handleResetZoom = () => {
    setZoom(type === "pdf" ? 1.5 : 1.2);
    setPanPosition({ x: 0, y: 0 });
  };

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{
          width: "100%",
          height: "calc(100% - 60px)",
          minHeight: "540px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
          cursor: isDragging ? "grabbing" : "grab",
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
            title="Download as PNG"
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
          <IconButton
            onClick={handleDownloadSVG}
            title="Download as SVG"
            sx={{
              bgcolor: theme.palette.background.paper,
              color: theme.palette.primary.main,
              "&:hover": {
                bgcolor: theme.palette.primary.light,
                color: "#fff",
              },
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.8 6.4c-.4.4-1.2.4-1.6 0-.4-.4-.4-1.2 0-1.6l3.2-3.2c.4-.4 1.2-.4 1.6 0l3.2 3.2c.4.4.4 1.2 0 1.6-.4.4-1.2.4-1.6 0L16 4.8V16c0 .7-.6 1.3-1.3 1.3-.7 0-1.3-.6-1.3-1.3V4.8l-1.6 1.6zM5 19h14c.6 0 1 .4 1 1s-.4 1-1 1H5c-.6 0-1-.4-1-1s.4-1 1-1z" />
            </svg>
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
};

export default MindMap;
