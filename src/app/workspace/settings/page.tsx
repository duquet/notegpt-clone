"use client";

import React from "react";
import {
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  Box,
} from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";

export default function SettingsPage() {
  return (
    <>
      <WorkspaceHeader title="Settings" />

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Dark Mode"
                secondary="Toggle between light and dark theme"
              />
              <Switch edge="end" defaultChecked />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Language"
                secondary="Change the application language"
              />
              <Box component="span" sx={{ color: "text.secondary" }}>
                English
              </Box>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage your account settings and preferences.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
