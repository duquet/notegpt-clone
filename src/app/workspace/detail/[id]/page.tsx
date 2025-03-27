"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  CircularProgress,
  useTheme,
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
import { getYouTubeVideoDetails, generateFallbackTitle } from "@/utils/youtubeApi";
import { useAppContext } from "@/contexts";

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
  const params = useParams();
  const videoId = params.id as string;
  const { recentVideos, updateVideoTitle } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [rightTabValue, setRightTabValue] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Loading...");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const theme = useTheme();

  // Fetch video details on component mount
  useEffect(() => {
    const fetchVideoDetails = async () => {
      // First try to get from recent videos history
      const savedVideo = recentVideos.find(video => video.id === videoId);
      
      if (savedVideo) {
        setVideoTitle(savedVideo.title);
        setEditedTitle(savedVideo.title);
        setLoading(false);
        return;
      }
      
      // If not in history, fetch from API
      try {
        const videoDetails = await getYouTubeVideoDetails(videoId);
        if (videoDetails) {
          setVideoTitle(videoDetails.title);
          setEditedTitle(videoDetails.title);
        } else {
          // Use fallback if API call failed
          const fallbackTitle = generateFallbackTitle(videoId);
          setVideoTitle(fallbackTitle);
          setEditedTitle(fallbackTitle);
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
        setApiError(true);
        const fallbackTitle = generateFallbackTitle(videoId);
        setVideoTitle(fallbackTitle);
        setEditedTitle(fallbackTitle);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId, recentVideos]);

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
    // Update the local state
    setVideoTitle(editedTitle);
    setIsEditingTitle(false);
    
    // Update the title throughout the application
    updateVideoTitle(videoId, editedTitle);
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
    <Box sx={{ p: 2, fontFamily: "Inter, sans-serif" }}>
      <Grid container spacing={0}>
        {/* Left Section */}
        <Grid item xs={12} md={5}>
          {/* Video Title and Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              width: "100%",
              maxWidth: "100%",
              padding: 2,
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
                    border: "1px solid",
                    borderColor: theme.palette.divider,
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "1rem",
                    width: "100%",
                    outline: "none",
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSaveTitle}
                  sx={{
                    color: theme.palette.primary.main,
                    "&:hover": {
                      color: theme.palette.primary.dark,
                    },
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelEdit}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: theme.palette.text.primary,
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
                    color: theme.palette.text.primary,
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
                      color: theme.palette.text.secondary,
                      "&:hover": {
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <NotificationsIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleEditTitle}
                    sx={{
                      color: theme.palette.text.secondary,
                      "&:hover": {
                        color: theme.palette.text.primary,
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
              maxWidth: "100%",
              height: "352px",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                bgcolor: 'black',
              }}>
                <CircularProgress />
              </Box>
            ) : (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </Box>

          {/* Video Controls */}


          {/* Transcript Tabs */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: theme.palette.divider,
              mt: 0.5,
              py: 0.5,
              maxWidth: "100%",
              width: "100%",
            }}
          >
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Transcript"
                sx={{
                  color: tabValue === 0 ? theme.palette.primary.main : theme.palette.text.primary,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  "&.Mui-selected": {
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    fontWeight: 500,
                  },
                }}
              />
              <Tab
                label="Discover"
                sx={{
                  color: tabValue === 1 ? theme.palette.primary.main : theme.palette.text.primary,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  "&.Mui-selected": {
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
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
                maxWidth: "100%",
                height: "calc(100vh - 450px)",
                overflowY: "auto",
                pr: 0.5,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.mode === 'light' ? "#F3F4F6" : "#2a2a3a",
                  borderRadius: "3px",
                  margin: "2px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.mode === 'light' ? "#D1D5DB" : "#4a4a5a",
                  borderRadius: "3px",
                  "&:hover": {
                    background: theme.palette.mode === 'light' ? "#9CA3AF" : "#5a5a6a",
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
                        color: theme.palette.text.primary,
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
                        color: theme.palette.text.secondary,
                        fontSize: "1rem",
                        "&:hover": {
                          color: theme.palette.text.primary,
                        },
                        cursor: "pointer",
                      }}
                    />
                  </Box>
                  <Typography
                    className="transcript-text"
                    sx={{
                      color: theme.palette.text.primary,
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
        <Grid item xs={12} md={7}>
          <Box
          sx={{
            p: 2,
          }}
            // sx={{
            //   bgcolor: "#F9FAFB",
            //   p: 3,
            //   borderRadius: 2,
            //   boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            // }}
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
                    bgcolor: rightTabValue === 0 ? theme.palette.primary.main : theme.palette.background.paper,
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
                    bgcolor: rightTabValue === 1 ? theme.palette.primary.main : theme.palette.background.paper,
                    color: rightTabValue === 1 ? "#FFFFFF" : theme.palette.text.primary,
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
                    border: `1px solid ${theme.palette.divider}`,
                    height: "16px",
                  }}
                />
              </Tabs>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    width: "20px",
                    height: "20px",
                    "&:hover": {
                      bgcolor: theme.palette.divider,
                      color: theme.palette.text.primary,
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
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    width: "20px",
                    height: "20px",
                    "&:hover": {
                      bgcolor: theme.palette.divider,
                      color: theme.palette.text.primary,
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
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2,
                bgcolor: theme.palette.background.paper,
                width: "100%",
                height: "calc(100vh - 250px)",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.mode === 'light' ? "#F3F4F6" : "#2a2a3a",
                  borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.mode === 'light' ? "#D1D5DB" : "#4a4a5a",
                  borderRadius: "3px",
                  "&:hover": {
                    background: theme.palette.mode === 'light' ? "#9CA3AF" : "#5a5a6a",
                  },
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.primary,
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
                  color: theme.palette.text.primary,
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
                  color: theme.palette.text.primary,
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
                  color: theme.palette.text.primary,
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
