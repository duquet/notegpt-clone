"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, CircularProgress, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  ForceGraphCardProps,
  ForceGraphData,
  ForceGraphState,
} from "@/types/force-graph";

// Dynamically import the force graph component to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <CircularProgress />,
});

export default function ForceGraph({
  content,
  type,
  onError,
}: ForceGraphCardProps) {
  const [state, setState] = useState<ForceGraphState>({
    isLoading: true,
    error: null,
    data: null,
    isVisible: true,
  });

  useEffect(() => {
    const processContent = async () => {
      try {
        console.log("[ForceGraph] Processing content:", {
          type,
          length: content?.length || 0,
        });

        if (!content) {
          throw new Error("No content provided");
        }

        // Split content into sentences and create nodes
        const sentences = content
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0);
        const nodes = sentences.map((sentence, index) => ({
          id: `node-${index}`,
          name:
            sentence.trim().slice(0, 50) + (sentence.length > 50 ? "..." : ""),
          val: Math.min(5, Math.max(1, sentence.length / 50)), // Size based on sentence length
          group: (index % 3) + 1, // Simple grouping for visual variety
        }));

        // Create links between consecutive sentences
        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          links.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            value: 1,
          });
        }

        const graphData: ForceGraphData = { nodes, links };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          data: graphData,
        }));
      } catch (error) {
        console.error("[ForceGraph] Error processing content:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Unknown error occurred"),
        }));
        onError?.(
          error instanceof Error ? error : new Error("Unknown error occurred")
        );
      }
    };

    processContent();
  }, [content, type, onError]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "600px",
        border: "1px solid #ccc",
        borderRadius: 1,
        position: "relative",
        mt: 2,
        mb: 2,
        backgroundColor: "background.paper",
      }}
    >
      {/* Delete Button - Always visible */}
      <IconButton
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "error.main",
          zIndex: 1,
        }}
        onClick={() => setState((prev) => ({ ...prev, isVisible: false }))}
      >
        <DeleteIcon />
      </IconButton>

      {/* Blue Label - Always visible */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          backgroundColor: "primary.main",
          color: "white",
          padding: "4px 8px",
          borderRadius: 1,
          zIndex: 1,
        }}
      >
        <Typography variant="caption">Knowledge Graph</Typography>
      </Box>

      {state.isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      ) : state.error ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography color="error">Error: {state.error.message}</Typography>
        </Box>
      ) : (
        state.data && (
          <ForceGraph2D
            graphData={state.data}
            nodeLabel="name"
            nodeAutoColorBy="group"
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = node.color || "#000";
              ctx.fillText(label, node.x || 0, (node.y || 0) + 10);
            }}
          />
        )
      )}
    </Box>
  );
}
