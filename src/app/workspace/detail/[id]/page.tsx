"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import AddIcon from "@mui/icons-material/Add";
import PercentIcon from "@mui/icons-material/Percent";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function VideoDetailsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [rightTabValue, setRightTabValue] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Video Title");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("Video Title");
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRightTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setRightTabValue(newValue);
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(videoTitle);
  };

  const handleSaveTitle = () => {
    setVideoTitle(editedTitle);
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle(videoTitle);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSaveTitle();
    } else if (event.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleCopyTranscript = () => {
    // Get all transcript text
    const transcriptText = Array.from(
      document.querySelectorAll(".transcript-text")
    )
      .map((el) => el.textContent)
      .join("\n\n");

    // Copy to clipboard
    navigator.clipboard.writeText(transcriptText);

    // Show alert
    setShowCopyAlert(true);

    // Hide alert after 2 seconds
    setTimeout(() => {
      setShowCopyAlert(false);
    }, 2000);
  };

  return (
    <Box sx={{ p: 2, bgcolor: "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
      <Grid container spacing={2}>
        {/* Left Section */}
        <Grid item xs={12} md={6}>
          {/* Video Title and Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              width: "100%",
              maxWidth: "360px",
            }}
          >
            {isEditingTitle ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexGrow: 1,
                }}
              >
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  autoFocus
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "1rem",
                    width: "100%",
                    outline: "none",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSaveTitle}
                  sx={{
                    color: "#2563EB",
                    "&:hover": {
                      color: "#1D4ED8",
                    },
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelEdit}
                  sx={{
                    color: "#6B7280",
                    "&:hover": {
                      color: "#374151",
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#111827",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  {videoTitle}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: "#6B7280",
                      "&:hover": {
                        color: "#374151",
                      },
                    }}
                  >
                    <NotificationsIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleEditTitle}
                    sx={{
                      color: "#6B7280",
                      "&:hover": {
                        color: "#374151",
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>

          {/* Video Player */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: "360px",
              height: "202px",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {/* Video Thumbnail */}
            <Box
              component="img"
              src="/placeholder-video-thumbnail.jpg"
              alt="Video thumbnail"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Play Button Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                borderRadius: "50%",
                p: 1,
                cursor: "pointer",
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                },
              }}
            >
              <PlayArrowIcon sx={{ color: "#FFFFFF", fontSize: 20 }} />
            </Box>
          </Box>

          {/* Video Controls */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: 0.5,
              gap: 1,
              py: 0.5,
            }}
          >
            <IconButton
              size="small"
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <VolumeUpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              size="small"
              onClick={handleCopyTranscript}
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "#6B7280",
                "&:hover": {
                  color: "#374151",
                },
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Transcript Tabs */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "#E5E7EB",
              mt: 0.5,
              py: 0.5,
            }}
          >
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Transcript"
                sx={{
                  color: tabValue === 0 ? "#2563EB" : "#374151",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  "&.Mui-selected": {
                    color: "#2563EB",
                    borderBottom: "2px solid #2563EB",
                    fontWeight: 500,
                  },
                }}
              />
              <Tab
                label="Discover"
                sx={{
                  color: tabValue === 1 ? "#2563EB" : "#374151",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  "&.Mui-selected": {
                    color: "#2563EB",
                    borderBottom: "2px solid #2563EB",
                    fontWeight: 500,
                  },
                }}
              />
            </Tabs>
          </Box>

          {/* Transcript Content */}
          <TabPanel value={tabValue} index={0}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                width: "100%",
                maxWidth: "360px",
                height: "calc(100vh - 450px)",
                overflowY: "auto",
                pr: 0.5,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#F3F4F6",
                  borderRadius: "3px",
                  margin: "2px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#D1D5DB",
                  borderRadius: "3px",
                  "&:hover": {
                    background: "#9CA3AF",
                  },
                },
              }}
            >
              {[0, 30, 60, 90].map((time) => (
                <Box
                  key={time}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    py: 1.5,
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#2563EB",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                      }}
                    >
                      {`${Math.floor(time / 60)
                        .toString()
                        .padStart(2, "0")}:${(time % 60)
                        .toString()
                        .padStart(2, "0")}`}
                    </Typography>
                    <KeyboardArrowDownIcon
                      sx={{
                        color: "#6B7280",
                        fontSize: "1rem",
                        "&:hover": {
                          color: "#374151",
                        },
                        cursor: "pointer",
                      }}
                    />
                  </Box>
                  <Typography
                    className="transcript-text"
                    sx={{
                      color: "#111827",
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    Sample transcript text for this timestamp. This is a
                    placeholder for the actual transcript content...
                  </Typography>
                </Box>
              ))}
            </Box>
          </TabPanel>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              bgcolor: "#F9FAFB",
              p: 3,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {/* Right Section Tabs */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                width: "100%",
              }}
            >
              <Tabs
                value={rightTabValue}
                onChange={handleRightTabChange}
                sx={{ flexGrow: 1 }}
              >
                <Tab
                  label="AI Notes"
                  sx={{
                    bgcolor: rightTabValue === 0 ? "#2563EB" : "#F3F4F6",
                    color: "#FF0000 !important",
                    borderRadius: 0.5,
                    py: 0.5,
                    px: 1.5,
                    textTransform: "none",
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    boxShadow:
                      rightTabValue === 0
                        ? "0 1px 2px rgba(0,0,0,0.1)"
                        : "none",
                    minWidth: "60px",
                    "&.Mui-selected": {
                      color: "#FF0000",
                    },
                    "&:hover": {
                      color: "#FF0000",
                    },
                  }}
                />
                <Tab
                  label="AI Chat"
                  sx={{
                    bgcolor: rightTabValue === 1 ? "#2563EB" : "#F3F4F6",
                    color: rightTabValue === 1 ? "#FFFFFF" : "#374151",
                    borderRadius: 0.5,
                    py: 0.125,
                    px: 1,
                    textTransform: "none",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    boxShadow:
                      rightTabValue === 1
                        ? "0 1px 2px rgba(0,0,0,0.1)"
                        : "none",
                    minWidth: "40px",
                    border: "1px solid #E5E7EB",
                    height: "16px",
                  }}
                />
              </Tabs>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: "#F3F4F6",
                    color: "#6B7280",
                    width: "20px",
                    height: "20px",
                    "&:hover": {
                      bgcolor: "#E5E7EB",
                      color: "#374151",
                    },
                  }}
                >
                  <PercentIcon sx={{ fontSize: "0.75rem" }} />
                </IconButton>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: "#7C3AED",
                    color: "#FFFFFF",
                    borderRadius: 0.5,
                    px: 0.5,
                    py: 0.125,
                    height: "20px",
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    "&:hover": {
                      bgcolor: "#6D28D9",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    },
                    flexGrow: 1,
                    maxWidth: "80px",
                  }}
                >
                  Summarize
                </Button>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: "#F3F4F6",
                    color: "#6B7280",
                    width: "20px",
                    height: "20px",
                    "&:hover": {
                      bgcolor: "#E5E7EB",
                      color: "#374151",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "0.75rem" }} />
                </IconButton>
              </Box>
            </Box>

            {/* Summary and Highlights */}
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                p: 2,
                bgcolor: "#FFFFFF",
                width: "100%",
                height: "calc(100vh - 250px)",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#F3F4F6",
                  borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#D1D5DB",
                  borderRadius: "3px",
                  "&:hover": {
                    background: "#9CA3AF",
                  },
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "#111827",
                  fontWeight: "bold",
                  mb: 2,
                  fontSize: "1.25rem",
                  width: "100%",
                }}
              >
                Summary
              </Typography>
              <Typography
                sx={{
                  color: "#111827",
                  lineHeight: 1.5,
                  mb: 3,
                  fontSize: "1rem",
                  width: "100%",
                }}
              >
                This is a placeholder for the summary content. The summary will
                be generated based on the video content and will provide a
                concise overview of the main points discussed.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#111827",
                  fontWeight: "bold",
                  mb: 2,
                  fontSize: "1.125rem",
                  width: "100%",
                }}
              >
                Highlights
              </Typography>
              <Typography
                sx={{
                  color: "#111827",
                  lineHeight: 1.5,
                  fontSize: "1rem",
                  width: "100%",
                }}
              >
                This section will contain the key highlights and important
                points from the video, formatted in a clear and organized
                manner.
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Copy Alert */}
      <Snackbar
        open={showCopyAlert}
        autoHideDuration={2000}
        onClose={() => setShowCopyAlert(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowCopyAlert(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Transcript copied to clipboard
        </Alert>
      </Snackbar>
    </Box>
  );
}
