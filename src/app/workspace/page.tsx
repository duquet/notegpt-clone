"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

export default function WorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to create page after a short delay
    const redirectTimeout = setTimeout(() => {
      router.push("/workspace/create");
    }, 100);

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
