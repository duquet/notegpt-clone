"use client";

import React from "react";
import { Typography, Card, CardContent } from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";

export default function HistoryPage() {
  return (
    <>
      <WorkspaceHeader title="History" />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your recent summary history will appear here. You have not created
            any summaries yet.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
