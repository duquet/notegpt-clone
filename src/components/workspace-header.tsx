"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";

interface WorkspaceHeaderProps {
  title: string;
}

export function WorkspaceHeader({ title }: WorkspaceHeaderProps) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
        }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
    </>
  );
}
