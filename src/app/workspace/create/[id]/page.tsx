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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  Alert,
} from "@mui/material";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useAppContext, VideoSummary, UserNote } from "@/contexts";
import { v4 as uuidv4 } from "uuid";
import {
  getYouTubeVideoDetails,
  generateFallbackTitle,
} from "@/utils/youtubeApi";
import { 
  TemplateConfig, 
  StructuredSummaryResponse, 
  SummarySection,
  Flashcard 
} from "@/types/summary";

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

function SummaryRenderer({ summaryData }: { summaryData?: StructuredSummaryResponse | null }) {
  if (!summaryData) {
    return (
      <Typography variant="body2" color="text.secondary">
        No summary available yet.
      </Typography>
    );
  }

  if (summaryData.flashcards && summaryData.flashcards.length > 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {summaryData.title}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {summaryData.flashcards.map((card: Flashcard, index: number) => (
            <Card key={index} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.category} • {card.difficulty}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Q: {card.question}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1">
                  A: {card.answer}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
        {summaryData.parsing_error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {summaryData.parsing_error}
          </Alert>
        )}
      </Box>
    );
  }

  if (summaryData.sections && summaryData.sections.length > 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {summaryData.title}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {summaryData.sections.map((section: SummarySection, index: number) => (
            <Box key={index}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {section.name}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {section.content}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Fallback to raw content
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {summaryData.title}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
        {summaryData.raw_content}
      </Typography>
    </Box>
  );
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [summaryData, setSummaryData] = useState<StructuredSummaryResponse | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const { addVideoToHistory, saveNote, savedNotes, recentVideos } = useAppContext();
  const [noteSaved, setNoteSaved] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [channelTitle, setChannelTitle] = useState<string>("");
  const [apiError, setApiError] = useState<boolean>(false);
  
  // Template management
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [templateError, setTemplateError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log("API URL (create/[id]):", apiUrl);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://notegpt-clone.onrender.com";
        const response = await fetch(`${apiUrl}/api/templates`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const templateConfigs: TemplateConfig[] = await response.json();
        setTemplates(templateConfigs);
        console.log(`Loaded ${templateConfigs.length} templates:`, templateConfigs.map(t => t.type));
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplateError('Failed to load summary templates');
      }
    };

    fetchTemplates();
  }, []);

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

  // Generate summary when transcript is loaded or template changes
  useEffect(() => {
    const generateSummary = async () => {
      if (
        !transcript ||
        transcript === "No transcript available for this video." ||
        !selectedTemplate
      ) {
        return;
      }

      setSummaryLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://notegpt-clone.onrender.com";
        
        // Use new API format - send videoId instead of transcript
        const response = await fetch(`${apiUrl}/api/summarize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId: videoId,
            options: {
              templateType: selectedTemplate,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate summary");
        }

        const data: StructuredSummaryResponse = await response.json();
        setSummaryData(data);
        
        console.log('Summary generated:', {
          templateType: data.templateType,
          hasFlashcards: !!data.flashcards,
          sectionCount: data.sections?.length || 0,
          performance: data.performance_metrics
        });
        
      } catch (error) {
        console.error("Error generating summary:", error);
        setSummaryData({
          templateType: selectedTemplate,
          title: "Error",
          raw_content: "An error occurred while generating the summary. Please try again.",
          performance_metrics: {
            total_time: 0,
            transcript_fetch_time: 0,
            openai_time: 0,
            parsing_time: 0,
            request_id: ''
          }
        });
      } finally {
        setSummaryLoading(false);
      }
    };

    generateSummary();
  }, [transcript, selectedTemplate, videoId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTemplateChange = (event: any) => {
    setSelectedTemplate(event.target.value);
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

        {/* Template selector */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="template-select-label">Summary Template</InputLabel>
            <Select
              labelId="template-select-label"
              value={selectedTemplate}
              label="Summary Template"
              onChange={handleTemplateChange}
              disabled={templates.length === 0}
            >
              {templates.map((template) => (
                <MenuItem key={template.type} value={template.type}>
                  {template.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {templateError && (
            <Alert severity="error" sx={{ flexGrow: 1 }}>
              {templateError}
            </Alert>
          )}
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
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        Generating {templates.find(t => t.type === selectedTemplate)?.title || 'summary'}...
                      </Typography>
                    </Box>
                  ) : (
                    <SummaryRenderer summaryData={summaryData} />
                  )}

                  {/* Performance metrics (optional, for debugging) */}
                  {summaryData?.performance_metrics && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Processing time: {summaryData.performance_metrics.total_time.toFixed(2)}s
                        {summaryData.performance_metrics.request_id && 
                          ` (ID: ${summaryData.performance_metrics.request_id})`
                        }
                      </Typography>
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
                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <Button variant="contained" onClick={handleSaveNote}>
                      Save Note
                    </Button>
                    <Button variant="outlined" onClick={handleDiscardNote}>
                      Discard Changes
                    </Button>
                    {noteSaved && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{ alignSelf: "center" }}
                      >
                        ✓ Note saved!
                      </Typography>
                    )}
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
