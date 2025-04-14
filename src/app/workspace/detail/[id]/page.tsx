"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import YouTube, { YouTubePlayer, YouTubeProps, YouTubeEvent } from "react-youtube";
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
  Switch,
  Tooltip,
  Menu,
  MenuItem,
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
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import LanguageIcon from '@mui/icons-material/Language';
import { getYouTubeVideoDetails, generateFallbackTitle } from "@/utils/youtubeApi";
import { useAppContext } from "@/contexts";
import { translateTranscriptSegments } from "@/utils/translation";

// Add YouTube API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

// Add language interface and constants
interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'pl', name: 'Polish' },
  { code: 'id', name: 'Indonesian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'he', name: 'Hebrew' }
];

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
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const languageMenuOpen = Boolean(languageAnchorEl);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translatedSegments, setTranslatedSegments] = useState<TranscriptSegment[]>([]);
  const [isTranslatingDisplay, setIsTranslatingDisplay] = useState(false);
  const [displayTranslationError, setDisplayTranslationError] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const playerCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Fetch video details on component mount
  useEffect(() => {
    const fetchVideoDetails = async () => {
      // First try to get from recent videos history
      const savedVideo = recentVideos.find(video => video.id === videoId);
      
      if (savedVideo) {
        setVideoTitle(savedVideo.title);
        setEditedTitle(savedVideo.title);
        setLoading(false);
      } else {
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
      }
      
      // Fetch transcript
      fetchTranscript();
    };

    const fetchTranscript = async () => {
      setTranscriptLoading(true);
      try {
        // Try to get transcript from API
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch("http://127.0.0.1:5000/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: videoUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcript && typeof data.transcript === 'string') {
            // Split transcript into 30-second segments
            const segments = createTranscriptSegments(data.transcript);
            setTranscriptSegments(segments);
          } else {
            // If no transcript, create a placeholder
            setTranscriptSegments([
              { startTime: 0, endTime: 30, text: "No transcript available for this video." }
            ]);
          }
        } else {
          setTranscriptSegments([
            { startTime: 0, endTime: 30, text: "Failed to load transcript. API returned an error." }
          ]);
        }
      } catch (error) {
        console.error("Error fetching transcript:", error);
        setTranscriptSegments([
          { startTime: 0, endTime: 30, text: "Error fetching transcript. Please try again later." }
        ]);
      } finally {
        setTranscriptLoading(false);
      }
    };

    fetchVideoDetails();

    return () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
      }
    };
  }, [videoId, recentVideos]);

  // Updated createTranscriptSegments function to be smarter with short videos
  const createTranscriptSegments = (transcriptText: string, actualDuration?: number): TranscriptSegment[] => {
    const segments: TranscriptSegment[] = [];
    
    if (!transcriptText || transcriptText.trim() === '') {
      return [{ startTime: 0, endTime: 30, text: "No transcript content available." }];
    }

    // Split text into words and count them
    const words = transcriptText.split(/\s+/);
    const totalWords = words.length;
    
    // Handle very short videos (under 60 seconds) specially
    if (actualDuration && actualDuration < 60) {
      console.log('Handling short video with duration:', actualDuration); // Debug log
      
      // For very short videos, either use one segment or split in half
      if (actualDuration < 30 || totalWords < 50) {
        // For extremely short videos or little text, just one segment
        return [{
          startTime: 0,
          endTime: Math.ceil(actualDuration),
          text: transcriptText
        }];
      } else {
        // For videos between 30-60 seconds, split into two segments
        const halfwayPoint = Math.floor(actualDuration / 2);
        const halfwayWordIndex = Math.floor(totalWords / 2);
        
        return [
          {
            startTime: 0,
            endTime: halfwayPoint,
            text: words.slice(0, halfwayWordIndex).join(' ')
          },
          {
            startTime: halfwayPoint,
            endTime: Math.ceil(actualDuration),
            text: words.slice(halfwayWordIndex).join(' ')
          }
        ];
      }
    }
    
    // For longer videos, continue with the regular approach
    // Determine ideal number of segments based on content and duration
    let idealSegmentCount = 5; // Default to 5 segments
    
    if (actualDuration) {
      // If we know the duration, create segments at reasonable intervals
      // For videos under 2 minutes, use smaller intervals
      if (actualDuration < 120) {
        idealSegmentCount = Math.max(2, Math.min(4, Math.ceil(actualDuration / 30)));
      } else {
        // For longer videos use 30-second intervals, but cap at 10 segments
        idealSegmentCount = Math.max(3, Math.min(10, Math.ceil(actualDuration / 30)));
      }
    } else {
      // Otherwise base it on text length
      idealSegmentCount = Math.max(1, Math.min(8, Math.ceil(totalWords / 60)));
    }
    
    // Calculate how many words per segment
    const wordsPerSegment = Math.ceil(totalWords / idealSegmentCount);
    
    // Create segments with timestamps
    for (let i = 0; i < idealSegmentCount; i++) {
      const start = i * wordsPerSegment;
      const end = Math.min(start + wordsPerSegment, totalWords);
      
      if (start >= totalWords) break;
      
      // Set timestamps based on actual duration if known
      let startTime, endTime;
      
      if (actualDuration) {
        // If we know duration, distribute segments evenly across the video
        startTime = Math.floor((i / idealSegmentCount) * actualDuration);
        endTime = Math.floor(((i + 1) / idealSegmentCount) * actualDuration);
        
        // Ensure the last segment includes the end of the video
        if (i === idealSegmentCount - 1) {
          endTime = Math.ceil(actualDuration);
        }
      } else {
        // Otherwise use 30-second increments
        startTime = i * 30;
        endTime = (i + 1) * 30;
      }
      
      segments.push({
        startTime,
        endTime,
        text: words.slice(start, end).join(' ')
      });
    }
    
    // If we ended up with just one segment, give it a sensible time range
    if (segments.length === 1) {
      segments[0].startTime = 0;
      segments[0].endTime = actualDuration ? Math.ceil(actualDuration) : 30;
    }
    
    // Final safety check: ensure no segment exceeds video duration
    if (actualDuration) {
      return segments.map(segment => ({
        ...segment,
        endTime: Math.min(segment.endTime, Math.ceil(actualDuration))
      }));
    }
    
    return segments;
  };

  // Monitor YouTube player and update transcript highlighting
  useEffect(() => {
    if (loading || transcriptSegments.length === 0 || !playerRef.current) {
      return;
    }

    // Set up timer to check video progress
    const startTimeTracking = () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
      }
      
      // Simple interval to update current time
      playerCheckInterval.current = setInterval(() => {
        if (playerRef.current) {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            if (!isNaN(currentTime)) {
              setCurrentVideoTime(currentTime);
            }
          } catch (e) {
            console.error('Error getting current time:', e);
          }
        }
      }, 500); // Check time every 500ms for smoother updates
    };

    // Start tracking
    startTimeTracking();
    
    return () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
      }
    };
  }, [loading, transcriptSegments, playerRef.current]);

  // Update highlighted segment whenever currentVideoTime changes
  useEffect(() => {
    // Find the transcript segment that corresponds to the current video time
    const newIndex = transcriptSegments.findIndex(segment => 
      currentVideoTime >= segment.startTime && currentVideoTime < segment.endTime
    );
    
    if (newIndex !== -1 && newIndex !== currentSegmentIndex) {
      setCurrentSegmentIndex(newIndex);
      
      // Only scroll when auto-scroll is enabled
      if (autoScroll && transcriptRef.current) {
        const segmentElement = transcriptRef.current.querySelector(`[data-segment-index="${newIndex}"]`);
        if (segmentElement) {
          segmentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [currentVideoTime, transcriptSegments, currentSegmentIndex, autoScroll]);

  // Handle YouTube player ready event
  const handleReady = (event: YouTubeEvent) => {
    console.log('YouTube player ready');
    playerRef.current = event.target;
    
    // Get and store video duration when player is ready
    try {
      const duration = playerRef.current.getDuration();
      console.log('Video duration:', duration); // Debug log
      
      if (duration && !isNaN(duration)) {
        setVideoDuration(duration);
        
        // IMMEDIATELY cap any segment end times to the actual duration
        if (transcriptSegments.length > 0) {
          const fixedSegments = [...transcriptSegments].map(segment => ({
            ...segment,
            // Ensure no segment ends after the video's actual end
            endTime: Math.min(segment.endTime, Math.ceil(duration))
          }));
          
          console.log('Original segments:', transcriptSegments); // Debug log
          console.log('Fixed segments:', fixedSegments); // Debug log
          
          // Update with fixed segments first (quick fix)
          setTranscriptSegments(fixedSegments);
          
          // Then do a more comprehensive fix with proper distribution
          if (transcriptSegments[0].text !== "No transcript content available." &&
              transcriptSegments[0].text !== "Failed to load transcript. API returned an error." &&
              transcriptSegments[0].text !== "Error fetching transcript. Please try again later.") {
            
            // Get the original transcript text by joining all segments
            const fullText = transcriptSegments.map(segment => segment.text).join(' ');
            
            // Recreate segments with accurate duration
            const updatedSegments = createTranscriptSegments(fullText, duration);
            console.log('Updated segments with duration:', updatedSegments); // Debug log
            setTranscriptSegments(updatedSegments);
          }
        }
      }
    } catch (error) {
      console.error('Error getting video duration:', error);
    }
  };

  // Handle YouTube player state change
  const handleStateChange = (event: YouTubeEvent) => {
    // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (event.data === 1) { // Playing
      console.log('Video playing');
    }
  };

  // YouTube player options
  const opts: YouTubeProps['opts'] = {
    height: '352',
    width: '100%',
    playerVars: {
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  // Handle click on transcript segment
  const handleSegmentClick = (startTime: number) => {
    // Use YouTube API to seek
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, true);
      
      // Update highlighted segment immediately
      const segmentIndex = transcriptSegments.findIndex(segment => segment.startTime === startTime);
      if (segmentIndex !== -1) {
        setCurrentSegmentIndex(segmentIndex);
        setCurrentVideoTime(startTime);
      }
    }
  };

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

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Add effect to recreate segments when video duration becomes available
  useEffect(() => {
    // Only proceed if we have the duration and transcript
    if (!videoDuration || transcriptSegments.length === 0) {
      return;
    }
    
    console.log('Running duration effect with duration:', videoDuration);
    
    // Skip placeholder transcripts
    if (transcriptSegments[0].text === "No transcript content available." ||
        transcriptSegments[0].text === "Failed to load transcript. API returned an error." ||
        transcriptSegments[0].text === "Error fetching transcript. Please try again later.") {
      return;
    }
    
    // Get the original transcript text
    const fullText = transcriptSegments.map(segment => segment.text).join(' ');
    
    // Recreate segments with accurate duration
    const updatedSegments = createTranscriptSegments(fullText, videoDuration);
    console.log('Recreated segments with accurate duration:', updatedSegments);
    
    // Check if segments need updating (have any times exceeding video duration)
    const needsUpdate = transcriptSegments.some(segment => segment.endTime > videoDuration);
    if (needsUpdate) {
      setTranscriptSegments(updatedSegments);
    }
  }, [videoDuration, transcriptLoading]);

  // Add a function to scroll to the current segment
  const scrollToCurrentSegment = () => {
    if (!transcriptRef.current || currentSegmentIndex === -1) return;
    
    const segmentElement = transcriptRef.current.querySelector(`[data-segment-index="${currentSegmentIndex}"]`);
    if (segmentElement) {
      segmentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    handleLanguageClose();

    // If not English, translate the displayed segments
    if (language.code !== 'en') {
      try {
        setIsTranslatingDisplay(true);
        setDisplayTranslationError(null);
        const translated = await translateTranscriptSegments(transcriptSegments, language);
        setTranslatedSegments(translated);
      } catch (error) {
        console.error('Error translating display segments:', error);
        setDisplayTranslationError('Failed to translate transcript. Showing original version.');
        setTranslatedSegments(transcriptSegments);
      } finally {
        setIsTranslatingDisplay(false);
      }
    } else {
      // If English is selected, show original segments
      setTranslatedSegments(transcriptSegments);
    }
  };

  // Update useEffect to initialize translated segments
  useEffect(() => {
    if (transcriptSegments.length > 0) {
      setTranslatedSegments(transcriptSegments);
    }
  }, [transcriptSegments]);

  const downloadTranscript = async (format: 'txt' | 'txt-with-timestamps' | 'srt') => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      // Translate the transcript if not in English
      let segmentsToUse = transcriptSegments;
      if (selectedLanguage.code !== 'en') {
        try {
          const translatedSegments = await translateTranscriptSegments(transcriptSegments, selectedLanguage);
          segmentsToUse = transcriptSegments.map((segment, i) => ({
            ...segment,
            text: translatedSegments[i].text
          }));
        } catch (error) {
          setTranslationError('Failed to translate transcript. Downloading original version instead.');
          segmentsToUse = transcriptSegments;
        }
      }

      let content = '';
      
      if (format === 'txt') {
        // Plain text without timestamps - join segments with a single space
        content = segmentsToUse.map(segment => segment.text).join(' ');
      } else if (format === 'txt-with-timestamps') {
        // Text with timestamps
        content = segmentsToUse.map(segment => 
          `${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}\n${segment.text}`
        ).join('\n\n');
      } else if (format === 'srt') {
        // SRT format
        content = segmentsToUse.map((segment, index) => {
          const startTime = new Date(segment.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
          const endTime = new Date(segment.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');
          return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
        }).join('');
      }

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${videoId}-${selectedLanguage.code}.${format === 'srt' ? 'srt' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      handleDownloadClose();
    } catch (error) {
      console.error('Error downloading transcript:', error);
      setTranslationError('Failed to download transcript. Please try again.');
    } finally {
      setIsTranslating(false);
    }
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
              <YouTube
                videoId={videoId}
                opts={opts}
                onReady={handleReady}
                onStateChange={handleStateChange}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </Box>

          {/* Debug Current Time */}
          <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
            Current Time: {formatTime(Math.floor(currentVideoTime))}
          </Typography>
          
          {/* Transcript Tabs */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: theme.palette.divider,
              mt: 0.5,
              py: 0.5,
              maxWidth: "100%",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
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
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Locate Button with proper Tooltip */}
              <Tooltip title="Locate transcript to current video frame">
                <IconButton 
                  size="small" 
                  onClick={scrollToCurrentSegment}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  <LocationSearchingIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {/* Auto-scroll switch */}
              <Tooltip title={autoScroll ? "Transcript along with the video enabled" : "Transcript along with the video disabled"}>
                <Switch
                  size="small"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              </Tooltip>
              
              {/* Copy transcript button */}
              <Tooltip title="Copy full transcript to clipboard">
                <IconButton 
                  size="small" 
                  onClick={handleCopyTranscript}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Download transcript button with dropdown */}
              <Tooltip title="Download transcript">
                <IconButton 
                  size="small" 
                  onClick={handleDownloadClick}
                  disabled={isTranslating}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    '&.Mui-disabled': {
                      color: theme.palette.text.disabled
                    }
                  }}
                >
                  {isTranslating ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DownloadIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={downloadAnchorEl}
                open={downloadMenuOpen}
                onClose={handleDownloadClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => downloadTranscript('txt')} disabled={isTranslating}>
                  Download as TXT (no timestamps)
                </MenuItem>
                <MenuItem onClick={() => downloadTranscript('txt-with-timestamps')} disabled={isTranslating}>
                  Download as TXT (with timestamps)
                </MenuItem>
                <MenuItem onClick={() => downloadTranscript('srt')} disabled={isTranslating}>
                  Download as SRT
                </MenuItem>
              </Menu>

              {/* Language selection button */}
              <Tooltip title={`Select language (Current: ${selectedLanguage.name})`}>
                <IconButton 
                  size="small" 
                  onClick={handleLanguageClick}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  <LanguageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={languageAnchorEl}
                open={languageMenuOpen}
                onClose={handleLanguageClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  style: {
                    maxHeight: 300,
                  },
                }}
              >
                {LANGUAGES.map((language) => (
                  <MenuItem 
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    selected={language.code === selectedLanguage.code}
                  >
                    {language.name}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          {/* Transcript Content */}
          <TabPanel value={tabValue} index={0}>
            <Box
              ref={transcriptRef}
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
              {transcriptLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                translatedSegments.map((segment, index) => (
                  <Box
                    key={index}
                    data-segment-index={index}
                    onClick={() => handleSegmentClick(segment.startTime)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      py: 1.5,
                      width: "100%",
                      cursor: "pointer",
                      bgcolor: currentSegmentIndex === index ? 
                        (theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(144, 202, 249, 0.08)') : 
                        'transparent',
                      borderRadius: 1,
                      transition: 'background-color 0.3s ease',
                      '&:hover': {
                        bgcolor: currentSegmentIndex === index ?
                          (theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(144, 202, 249, 0.12)') :
                          (theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)')
                      },
                      px: 1,
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
                          color: currentSegmentIndex === index ? 
                            theme.palette.primary.main : 
                            theme.palette.text.primary,
                          fontWeight: currentSegmentIndex === index ? "bold" : "normal",
                          fontSize: "0.875rem",
                        }}
                      >
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
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
                        color: currentSegmentIndex === index ? 
                          theme.palette.primary.main : 
                          theme.palette.text.primary,
                        fontSize: "1rem",
                        lineHeight: 1.5,
                        width: "100%",
                        pr: 2,
                        fontWeight: currentSegmentIndex === index ? 500 : "normal",
                      }}
                    >
                      {segment.text}
                    </Typography>
                  </Box>
                ))
              )}
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

      {/* Add error snackbar */}
      <Snackbar
        open={!!translationError}
        autoHideDuration={6000}
        onClose={() => setTranslationError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setTranslationError(null)} severity="warning" sx={{ width: '100%' }}>
          {translationError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export async function translateTranscriptSegments(
  segments: TranscriptSegment[],
  targetLanguage: Language
): Promise<TranscriptSegment[]> {
  try {
    const separator = '|||SEGMENT_SEPARATOR|||';
    const fullText = segments.map(segment => segment.text).join(separator);
    
    console.log("Translating text:", fullText); // Log the text being translated

    const translatedText = await translateText(fullText, targetLanguage);
    const translatedSegments = translatedText.split(separator);
    
    return segments.map((segment, index) => {
      const translatedText = translatedSegments[index]?.trim();
      if (!translatedText) {
        console.warn(`Translation missing for segment: ${segment.text}`); // Log missing translations
      }
      return {
        ...segment,
        text: translatedText || segment.text // Fallback to original text if translation is missing
      };
    });
  } catch (error) {
    console.error('Error translating transcript:', error);
    throw error;
  }
}
