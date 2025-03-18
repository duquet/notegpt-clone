"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitch } from "@/components/language-switch";

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeSwitch />
          <LanguageSwitch />
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />
    </>
  );
}
