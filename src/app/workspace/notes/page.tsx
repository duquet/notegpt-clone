"use client";

import React, { useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  ListItemButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LaunchIcon from "@mui/icons-material/Launch";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useAppContext } from "@/contexts";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const { savedNotes, deleteNote, recentVideos } = useAppContext();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

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

  const getVideoDetails = (videoId: string) => {
    return (
      recentVideos.find((video) => video.id === videoId) || {
        title: "Unknown Video",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/workspace/create/${videoId}`);
  };

  return (
    <>
      <WorkspaceHeader title="Notes" />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Saved Notes
        </Typography>

        {savedNotes.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                You don't have any notes yet. Use the Create feature to
                summarize content and save notes.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper variant="outlined">
            <List>
              {savedNotes.map((note, index) => {
                const video = getVideoDetails(note.videoId);

                return (
                  <React.Fragment key={note.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Tooltip title="Delete note">
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemButton
                        onClick={() => handleVideoClick(note.videoId)}
                      >
                        <YouTubeIcon sx={{ mr: 2, color: "error.main" }} />
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                              >
                                {video.title}
                              </Typography>
                              <Tooltip title="View on YouTube">
                                <IconButton
                                  size="small"
                                  href={video.url}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  whiteSpace: "pre-wrap",
                                  maxHeight: "100px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {note.content.substring(0, 150)}
                                {note.content.length > 150 ? "..." : ""}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Created: {formatDate(note.date)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  sx={{
                                    fontWeight: "medium",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  Click to view and edit note
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
