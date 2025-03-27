"use client";

import React from "react";
import {
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Link,
  Paper,
  ListItemButton,
} from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useAppContext } from "@/contexts";
import { useRouter } from "next/navigation";
import YouTubeIcon from "@mui/icons-material/YouTube";

export default function HistoryPage() {
  const { recentVideos } = useAppContext();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/workspace/create/${videoId}`);
  };

  return (
    <>
      <WorkspaceHeader title="History" />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recently Viewed Videos
        </Typography>

        {recentVideos.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Your recent summary history will appear here. You have not
                created any summaries yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper variant="outlined">
            <List>
              {recentVideos.map((video, index) => (
                <React.Fragment key={video.id}>
                  {index > 0 && <Divider />}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleVideoClick(video.id)}
                      sx={{
                        py: 2,
                        transition: "background-color 0.2s ease-in-out",
                      }}
                    >
                      <YouTubeIcon sx={{ mr: 2, color: "error.main" }} />
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {video.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Link
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              sx={{ display: "inline-block", mb: 0.5 }}
                            >
                              {video.url}
                            </Link>
                            <Typography variant="body2" color="text.secondary">
                              Viewed: {formatDate(video.date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </>
  );
}
