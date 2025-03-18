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
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const { addVideoToHistory, saveNote, savedNotes } = useAppContext();
  const [noteSaved, setNoteSaved] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [channelTitle, setChannelTitle] = useState<string>("");

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

  // In a real application, this would fetch the actual transcript from a backend API
  // and video details using YouTube API
  useEffect(() => {
    // Simulate API call to get video transcript and details
    const fetchVideoData = async () => {
      try {
        // Simulate network delay for transcript
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock transcript data (in a real app, you would fetch this from a backend)
        const mockTranscript = `
          Hello everyone! In this video, we're going to discuss some exciting topics.
          
          First, let's talk about AI and its impact on modern society. Artificial intelligence has been transforming various industries, from healthcare to transportation.
          
          Next, we'll explore the ethical considerations surrounding new technologies. As we develop more advanced tools, we need to consider their implications.
          
          Finally, we'll look at some real-world applications and how they're changing the way we live and work.
          
          Thanks for watching! Don't forget to like and subscribe for more content.
        `;

        setTranscript(mockTranscript);

        // Fetch actual video title from YouTube API
        let title = "";
        let channel = "Unknown Channel";

        try {
          const videoDetails = await getYouTubeVideoDetails(videoId);

          if (videoDetails) {
            title = videoDetails.title;
            channel = videoDetails.channelTitle;
          } else {
            // Use fallback if API call failed
            title = generateFallbackTitle(videoId);
          }
        } catch (error) {
          console.error("Error fetching video details:", error);
          title = generateFallbackTitle(videoId);
        }

        setVideoTitle(title);
        setChannelTitle(channel);

        // Add to history with real or fallback title
        const videoSummary: VideoSummary = {
          id: videoId,
          title: title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          date: new Date().toISOString(),
        };

        addVideoToHistory(videoSummary);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching video data:", error);
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId, addVideoToHistory]);

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

                  <Typography variant="h6" gutterBottom>
                    Key Points
                  </Typography>
                  <Box component="ul" sx={{ mt: 2 }}>
                    <Typography component="li" sx={{ mb: 1 }}>
                      Introduction to AI and its impact on various industries
                    </Typography>
                    <Typography component="li" sx={{ mb: 1 }}>
                      Ethical considerations surrounding new technologies
                    </Typography>
                    <Typography component="li" sx={{ mb: 1 }}>
                      Real-world applications of emerging technologies
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    Summary
                  </Typography>
                  <Typography paragraph>
                    The video discusses the impact of artificial intelligence on
                    modern society, covering its transformative effects across
                    various sectors like healthcare and transportation. It
                    addresses ethical considerations that come with
                    technological advancement and explores real-world
                    applications that are changing how we live and work.
                  </Typography>
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
