"use client";

import React, { useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import YouTubeIcon from "@mui/icons-material/YouTube";
import SearchIcon from "@mui/icons-material/Search";
import ShareIcon from "@mui/icons-material/Share";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useAppContext } from "@/contexts";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const { savedNotes, deleteNote, recentVideos } = useAppContext();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "yesterday";
    } else {
      // Format as "February 26, 2025"
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }
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

  // Get filtered and sorted notes
  const filteredNotes = savedNotes
    .filter((note) => {
      // Apply search filter if search keyword is provided
      if (searchKeyword.trim() !== "") {
        const video = getVideoDetails(note.videoId);
        return (
          video.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          note.content.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      return true;
    })
    .filter(() => {
      // Apply type filter if selected
      if (typeFilter === "youtube") {
        return true; // For now all notes are YouTube-related
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });

  const getThumbnailUrl = (videoId: string) => {
    // Using YouTube's thumbnail URL pattern
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  return (
    <>
      <WorkspaceHeader title="Notes" />

      <Box sx={{ mb: 4 }}>
        {/* Controls Row */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <TextField
            placeholder="Search by keywords"
            variant="outlined"
            size="small"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            sx={{ flexGrow: 1, minWidth: "200px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Type Filter */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Type:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                displayEmpty
                sx={{ border: "1px solid #e0e0e0" }}
              >
                <MenuItem value="">Please select</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="article">Article</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Sort Filter */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Sort by:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{ border: "1px solid #e0e0e0" }}
              >
                <MenuItem value="newest">Newest to Oldest</MenuItem>
                <MenuItem value="oldest">Oldest to Newest</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Border box line below search field */}
        <Box
          sx={{
            width: "100%",
            height: "1px",
            bgcolor: "rgba(0,0,0,0.1)",
            mb: 3,
          }}
        />

        {/* Video Notes Section */}
        {filteredNotes.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {searchKeyword
                  ? "No notes match your search criteria."
                  : "You don't have any notes yet. Use the Create feature to summarize content and save notes."}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredNotes.map((note) => {
              const video = getVideoDetails(note.videoId);
              const thumbnailUrl = getThumbnailUrl(note.videoId);

              // Mock data for demonstration
              const notesCount = 1;
              const screenshotsCount = 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={note.id}>
                  <Card
                    className="note-item"
                    onClick={() => handleVideoClick(note.videoId)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      borderRadius: 2,
                      height: "100%",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    {/* First Row: Thumbnail */}
                    <Box sx={{ p: 1.5, pb: 1 }}>
                      <Card
                        elevation={1}
                        sx={{ overflow: "hidden", borderRadius: 2 }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={thumbnailUrl}
                          alt={video.title}
                          sx={{
                            width: "100%",
                            objectFit: "cover",
                            aspectRatio: "16/9",
                          }}
                        />
                      </Card>
                    </Box>

                    {/* Second Row: YouTube Label */}
                    <Box sx={{ px: 1.5, pb: 0.5 }}>
                      <Chip
                        label="YouTube"
                        size="small"
                        icon={<YouTubeIcon style={{ color: "#1565C0" }} />}
                        sx={{
                          bgcolor: "#E3F2FD",
                          color: "#1565C0",
                          fontWeight: "medium",
                          borderRadius: 1,
                          height: "24px",
                        }}
                      />
                    </Box>

                    {/* Third Row: Video Title */}
                    <Box sx={{ px: 1.5, pb: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        component="div"
                        sx={{
                          fontWeight: "medium",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.3,
                          minHeight: "38px",
                        }}
                      >
                        {video.title}
                      </Typography>
                    </Box>

                    {/* Fourth Row: Engagement Info */}
                    <Box
                      sx={{
                        px: 1.5,
                        pb: 1.5,
                        pt: 0.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid rgba(0,0,0,0.05)",
                        mt: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          fontSize: "0.7rem",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.7rem" }}
                        >
                          {notesCount} {notesCount === 1 ? "note" : "notes"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.7rem" }}
                        >
                          {screenshotsCount}{" "}
                          {screenshotsCount === 0
                            ? "screenshot"
                            : "screenshots"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.7rem" }}
                        >
                          {getTimeAgo(note.date)}
                        </Typography>
                      </Box>

                      <Box>
                        <Tooltip title="Share link">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Share functionality would go here
                              navigator.clipboard.writeText(video.url);
                            }}
                          >
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete note">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
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
