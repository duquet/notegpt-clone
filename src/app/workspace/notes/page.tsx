"use client";

import React from "react";
import { Typography, Card, CardContent } from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";

export default function NotesPage() {
  return (
    <>
      <WorkspaceHeader title="Notes" />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any notes yet. Use the Create feature to summarize
            content and save notes.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
