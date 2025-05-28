"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Button,
} from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useAppContext, VideoSummary, UserNote } from "@/contexts";
import { v4 as uuidv4 } from "uuid";
import {
  getYouTubeVideoDetails,
  generateFallbackTitle,
} from "@/utils/youtubeApi";

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
      id={`summary-tab-${index}`}
      aria-labelledby={`summary-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const { addVideoToHistory, saveNote, savedNotes, recentVideos } =
    useAppContext();
  const [noteSaved, setNoteSaved] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [channelTitle, setChannelTitle] = useState<string>("");
  const [apiError, setApiError] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log("API URL (create/[id]):", apiUrl);

  // Find existing note for this video
  useEffect(() => {
    const existingNote = savedNotes.find((note) => note.videoId === videoId);
    if (existingNote) {
      setNoteContent(existingNote.content);
      // If coming from Notes tab, automatically switch to Notes tab
      if (document.referrer.includes("/workspace/notes")) {
        setActiveTab(2); // Index 2 is for Notes tab
      }
    }
  }, [videoId, savedNotes]);

  // Fetch video data and transcript
  useEffect(() => {
    // Prevent infinite API calls if we already have an API error
    if (apiError) return;

    const fetchVideoData = async () => {
      try {
        // Fetch actual video title and transcript from API
        let title = "";
        let channel = "Unknown Channel";
        let videoTranscript = "";

        // First check if we already have the video in recent videos
        const savedVideo = recentVideos.find((video) => video.id === videoId);
        if (savedVideo) {
          title = savedVideo.title;
          // Don't override the saved title with API data
          setVideoTitle(title);
          setChannelTitle(channel);
        }

        try {
          const videoDetails = await getYouTubeVideoDetails(videoId);

          if (videoDetails) {
            title = videoDetails.title || title;
            channel = videoDetails.channelTitle;
            // Use transcript from API response if available
            videoTranscript = videoDetails.transcript || "";
          } else {
            // Use fallback if API call failed
            title = generateFallbackTitle(videoId);
          }
        } catch (error) {
          console.error("Error fetching video details:", error);
          setApiError(true); // Set error flag to prevent infinite retries
          title = generateFallbackTitle(videoId);
        }

        // Update state with fetched data
        setVideoTitle(title);
        setChannelTitle(channel);
        setTranscript(
          videoTranscript || "No transcript available for this video."
        );

        // Only add to history if it wasn't found earlier
        if (!savedVideo) {
          const videoSummary: VideoSummary = {
            id: videoId,
            title: title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            date: new Date().toISOString(),
          };
          addVideoToHistory(videoSummary);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching video data:", error);
        setApiError(true); // Set error flag to prevent infinite retries
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId, addVideoToHistory, apiError, recentVideos]);

  // Generate summary when transcript is loaded
  useEffect(() => {
    const generateSummary = async () => {
      if (
        !transcript ||
        transcript === "No transcript available for this video."
      ) {
        return;
      }

      setSummaryLoading(true);
      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript,
            options: {
              templateType: "default",
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate summary");
        }

        const data = await response.json();
        setSummary(data.summary);
      } catch (error) {
        console.error("Error generating summary:", error);
        setSummary(
          "An error occurred while generating the summary. Please try again."
        );
      } finally {
        setSummaryLoading(false);
      }
    };

    generateSummary();
  }, [transcript]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      // Find if we have an existing note to update
      const existingNote = savedNotes.find((note) => note.videoId === videoId);

      const newNote: UserNote = {
        id: existingNote ? existingNote.id : uuidv4(),
        videoId: videoId,
        content: noteContent,
        date: new Date().toISOString(),
      };

      saveNote(newNote);
      // Show visual feedback - set a success state that will disappear after 3 seconds
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
  };

  const handleDiscardNote = () => {
    // Check if there's an existing note for this video
    const existingNote = savedNotes.find((note) => note.videoId === videoId);
    // If yes, revert to that note; if not, clear the textarea
    if (existingNote) {
      setNoteContent(existingNote.content);
    } else {
      setNoteContent("");
    }
  };

  return (
    <>
      <div style={{ fontSize: 40, color: "green", textAlign: "center" }}>
        TEST
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          background: "#ffeaea",
          color: "#b71c1c",
          padding: 24,
          marginBottom: 24,
          textAlign: "center",
          border: "4px solid #b71c1c",
          borderRadius: 12,
        }}
      >
        API URL:{" "}
        {apiUrl ? apiUrl : <span style={{ color: "red" }}>Not set</span>}
      </div>
      <WorkspaceHeader title={videoTitle || "Video Summary"} />

      <Box sx={{ mb: 4 }}>
        {/* Video player */}
        <Box
          sx={{
            mb: 3,
            borderRadius: 1,
            overflow: "hidden",
            aspectRatio: "16/9",
            bgcolor: "black",
          }}
        >
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </Box>

        {/* Summary and Transcript tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Summary" />
            <Tab label="Transcript" />
            <Tab label="Notes" />
          </Tabs>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 6,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={activeTab} index={0}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {videoTitle}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    By: {channelTitle}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Video ID: {videoId}
                  </Typography>

                  {summaryLoading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ whiteSpace: "pre-line" }}>
                      {summary || "No summary available yet."}
                    </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 2, whiteSpace: "pre-line" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Full transcript of the video:
                  </Typography>
                  <Typography
                    component="div"
                    sx={{ bgcolor: "background.paper", p: 2, borderRadius: 1 }}
                  >
                    {transcript}
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Add your notes about this video here:
                  </Typography>
                  <textarea
                    style={{
                      width: "100%",
                      minHeight: "200px",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      resize: "vertical",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                    }}
                    placeholder="Type your notes here..."
                    value={noteContent}
                    onChange={handleNoteChange}
                  />
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {noteSaved && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{ fontWeight: "medium" }}
                      >
                        ✓ Note saved successfully!
                      </Typography>
                    )}
                    <Box sx={{ ml: "auto" }}>
                      <Button
                        variant="outlined"
                        sx={{ mr: 1 }}
                        onClick={handleDiscardNote}
                      >
                        {savedNotes.find((note) => note.videoId === videoId)
                          ? "Revert Changes"
                          : "Discard"}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveNote}
                        disabled={!noteContent.trim()}
                      >
                        Save Notes
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </>
          )}
        </Paper>
      </Box>
    </>
  );
}
