"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import YouTube, {
  YouTubePlayer,
  YouTubeProps,
  YouTubeEvent,
} from "react-youtube";
import pptxgen from "pptxgenjs";
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
  Divider,
  ListSubheader,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";
import LanguageIcon from "@mui/icons-material/Language";
import NotesIcon from "@mui/icons-material/Notes";
import ChatIcon from "@mui/icons-material/Chat";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MessageIcon from "@mui/icons-material/Message";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  getYouTubeVideoDetails,
  generateFallbackTitle,
} from "@/utils/youtubeApi";
import { useAppContext } from "@/contexts";
import { translateTranscriptSegments } from "@/utils/translation";
import { summarizeTranscript } from "@/utils/openAiService";
import ReactMarkdown from "react-markdown";
import SchoolIcon from "@mui/icons-material/School";
import { v4 as uuidv4 } from "uuid";
import ImageIcon from "@mui/icons-material/Image";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { PDFViewer } from "./components/PDFViewer.tsx";
import { extractPdfText } from "@/utils/pdfUtils";
import summaryPrompts from "@/utils/summaryPrompts.json";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ForceGraph from "./components/ForceGraph";
import MindMap from "./components/MindMap";
import HubIcon from "@mui/icons-material/Hub";

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
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "pl", name: "Polish" },
  { code: "id", name: "Indonesian" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "he", name: "Hebrew" },
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

// Get appropriate color for difficulty level
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "#4caf50"; // green
    case "medium":
      return "#ff9800"; // orange
    case "hard":
      return "#f44336"; // red
    default:
      return "#2196f3"; // blue for unknown
  }
};

// FlashCard component for interactive quiz cards
interface FlashCardProps {
  question: string;
  answer: string;
  difficulty: string;
  category: string;
}

const FlashCard: React.FC<
  FlashCardProps & { isFlipped: boolean; onFlip: () => void }
> = ({ question, answer, difficulty, category, isFlipped, onFlip }) => {
  return (
    <Box
      onClick={onFlip}
      sx={{
        width: "100%",
        height: "280px",
        perspective: "1000px",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          borderRadius: 2,
        }}
      >
        {/* Front of card (Question) */}
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ position: "absolute", top: 12, left: 12 }}>
            <Typography
              variant="caption"
              sx={{
                bgcolor: getDifficultyColor(difficulty),
                color: "white",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              {difficulty}
            </Typography>
          </Box>

          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <Typography
              variant="caption"
              sx={{
                bgcolor: "primary.main",
                color: "white",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.7rem",
              }}
            >
              {category}
            </Typography>
          </Box>

          <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: "bold",
              mb: 2,
              mt: 1,
            }}
          >
            Question
          </Typography>

          <Typography variant="body1" align="center">
            {question}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 12,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            Click to reveal answer
          </Typography>
        </Box>

        {/* Back of card (Answer) */}
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            transform: "rotateY(180deg)",
          }}
        >
          <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: "primary.main",
            }}
          >
            Answer
          </Typography>

          <Typography variant="body1" align="center">
            {answer}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 12,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            Click to see question
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Interactive Flashcard Carousel component
interface FlashcardCarouselProps {
  cards: FlashCardProps[];
  title: string;
}

const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  cards,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const theme = useTheme();

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    setIsFlipped(false); // Reset flip state when navigating
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + cards.length) % cards.length
    );
    setIsFlipped(false); // Reset flip state when navigating
  };

  // Validate cards array
  const validCards =
    Array.isArray(cards) &&
    cards.length > 0 &&
    cards.every(
      (card) =>
        card &&
        typeof card === "object" &&
        typeof card.question === "string" &&
        typeof card.answer === "string"
    );

  if (!validCards) {
    console.error("Invalid flashcards data:", cards);
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading flash cards
        </Typography>
        <Typography variant="body2">
          Please try generating the quiz again. If the problem persists, try a
          different video.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <CircularProgress size={20} />
        </Box>
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography variant="h6">No flash cards available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", pt: 2 }}>
      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          mb: 3,
          color: "primary.main",
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          mb: 3,
          color: "text.secondary",
        }}
      >
        Card {currentIndex + 1} of {cards.length}
      </Typography>

      <Box sx={{ px: 6 }}>
        <FlashCard
          {...cards[currentIndex]}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 3,
          gap: 2,
        }}
      >
        <IconButton
          onClick={handlePrevious}
          disabled={cards.length <= 1}
          sx={{
            bgcolor: "background.paper",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.light,
              color: "#fff",
            },
            width: 40,
            height: 40,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={handleNext}
          disabled={cards.length <= 1}
          sx={{
            bgcolor: "background.paper",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.light,
              color: "#fff",
            },
            width: 40,
            height: 40,
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default function VideoDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const pdfUrl = searchParams.get("pdfUrl");
  const isPDF = type === "pdf" && !!pdfUrl;

  console.log("PDF URL:", pdfUrl);
  console.log("Type:", type);
  console.log("Is PDF:", isPDF);

  const { recentVideos, updateVideoTitle } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [rightTabValue, setRightTabValue] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Loading...");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<
    TranscriptSegment[]
  >([]);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES[0]
  );
  const languageMenuOpen = Boolean(languageAnchorEl);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translatedSegments, setTranslatedSegments] = useState<
    TranscriptSegment[]
  >([]);
  const [isTranslatingDisplay, setIsTranslatingDisplay] = useState(false);
  const [displayTranslationError, setDisplayTranslationError] = useState<
    string | null
  >(null);
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [keyInsightsContent, setKeyInsightsContent] = useState<string>("");
  const [highlightsContent, setHighlightsContent] = useState<string>("");
  const [conclusionContent, setConclusionContent] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMenuAnchorEl, setSummaryMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customPromptTitle, setCustomPromptTitle] = useState("");
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false);
  const [summaryCards, setSummaryCards] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      flashcards?: Array<{
        question: string;
        answer: string;
        difficulty: string;
        category: string;
      }>;
    }>
  >([]);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Note feature states
  const [noteCards, setNoteCards] = useState<
    Array<{
      id: string;
      content: string;
      timestamp: number;
      isEditing: boolean;
    }>
  >([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const playerCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfSummaryLoading, setPdfSummaryLoading] = useState(false);
  const [pdfSummaryError, setPdfSummaryError] = useState<string | null>(null);
  const [showForceGraph, setShowForceGraph] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const mindMapRef = useRef<HTMLDivElement>(null);

  // Fetch video details on component mount
  useEffect(() => {
    if (isPDF) {
      setLoading(false);
      return;
    }

    const fetchVideoDetails = async () => {
      // First try to get from recent videos history
      const savedVideo = recentVideos.find((video) => video.id === params.id);

      if (savedVideo) {
        setVideoTitle(savedVideo.title);
        setEditedTitle(savedVideo.title);
        setLoading(false);
      } else {
        // If not in history, fetch from API
        try {
          const videoDetails = await getYouTubeVideoDetails(params.id);
          if (videoDetails) {
            setVideoTitle(videoDetails.title);
            setEditedTitle(videoDetails.title);
          } else {
            // Use fallback if API call failed
            const fallbackTitle = generateFallbackTitle(params.id);
            setVideoTitle(fallbackTitle);
            setEditedTitle(fallbackTitle);
          }
        } catch (error) {
          console.error("Error fetching video details:", error);
          setApiError(true);
          const fallbackTitle = generateFallbackTitle(params.id);
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
        const videoUrl = `https://www.youtube.com/watch?v=${params.id}`;
        const response = await fetch("http://127.0.0.1:5000/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: videoUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcript && typeof data.transcript === "string") {
            // Split transcript into 30-second segments
            const segments = createTranscriptSegments(data.transcript);
            setTranscriptSegments(segments);
          } else {
            // If no transcript, create a placeholder
            setTranscriptSegments([
              {
                startTime: 0,
                endTime: 30,
                text: "No transcript available for this video.",
              },
            ]);
          }
        } else {
          setTranscriptSegments([
            {
              startTime: 0,
              endTime: 30,
              text: "Failed to load transcript. API returned an error.",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching transcript:", error);
        setTranscriptSegments([
          {
            startTime: 0,
            endTime: 30,
            text: "Error fetching transcript. Please try again later.",
          },
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
  }, [params.id, recentVideos, isPDF]);

  // Updated createTranscriptSegments function to be smarter with short videos
  const createTranscriptSegments = (
    transcriptText: string,
    actualDuration?: number
  ): TranscriptSegment[] => {
    const segments: TranscriptSegment[] = [];

    if (!transcriptText || transcriptText.trim() === "") {
      return [
        { startTime: 0, endTime: 30, text: "No transcript content available." },
      ];
    }

    // Split text into words and count them
    const words = transcriptText.split(/\s+/);
    const totalWords = words.length;

    // Handle very short videos (under 60 seconds) specially
    if (actualDuration && actualDuration < 60) {
      console.log("Handling short video with duration:", actualDuration); // Debug log

      // For very short videos, either use one segment or split in half
      if (actualDuration < 30 || totalWords < 50) {
        // For extremely short videos or little text, just one segment
        return [
          {
            startTime: 0,
            endTime: Math.ceil(actualDuration),
            text: transcriptText,
          },
        ];
      } else {
        // For videos between 30-60 seconds, split into two segments
        const halfwayPoint = Math.floor(actualDuration / 2);
        const halfwayWordIndex = Math.floor(totalWords / 2);

        return [
          {
            startTime: 0,
            endTime: halfwayPoint,
            text: words.slice(0, halfwayWordIndex).join(" "),
          },
          {
            startTime: halfwayPoint,
            endTime: Math.ceil(actualDuration),
            text: words.slice(halfwayWordIndex).join(" "),
          },
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
        idealSegmentCount = Math.max(
          2,
          Math.min(4, Math.ceil(actualDuration / 30))
        );
      } else {
        // For longer videos use 30-second intervals, but cap at 10 segments
        idealSegmentCount = Math.max(
          3,
          Math.min(10, Math.ceil(actualDuration / 30))
        );
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
        text: words.slice(start, end).join(" "),
      });
    }

    // If we ended up with just one segment, give it a sensible time range
    if (segments.length === 1) {
      segments[0].startTime = 0;
      segments[0].endTime = actualDuration ? Math.ceil(actualDuration) : 30;
    }

    // Final safety check: ensure no segment exceeds video duration
    if (actualDuration) {
      return segments.map((segment) => ({
        ...segment,
        endTime: Math.min(segment.endTime, Math.ceil(actualDuration)),
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
            console.error("Error getting current time:", e);
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
    const newIndex = transcriptSegments.findIndex(
      (segment) =>
        currentVideoTime >= segment.startTime &&
        currentVideoTime < segment.endTime
    );

    if (newIndex !== -1 && newIndex !== currentSegmentIndex) {
      setCurrentSegmentIndex(newIndex);

      // Only scroll when auto-scroll is enabled
      if (autoScroll && transcriptRef.current) {
        const segmentElement = transcriptRef.current.querySelector(
          `[data-segment-index="${newIndex}"]`
        );
        if (segmentElement) {
          segmentElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    }
  }, [currentVideoTime, transcriptSegments, currentSegmentIndex, autoScroll]);

  // Handle YouTube player ready event
  const handleReady = (event: YouTubeEvent) => {
    console.log("YouTube player ready");
    playerRef.current = event.target;

    // Get and store video duration when player is ready
    try {
      const duration = playerRef.current.getDuration();
      console.log("Video duration:", duration); // Debug log

      if (duration && !isNaN(duration)) {
        setVideoDuration(duration);

        // IMMEDIATELY cap any segment end times to the actual duration
        if (transcriptSegments.length > 0) {
          const fixedSegments = [...transcriptSegments].map((segment) => ({
            ...segment,
            // Ensure no segment ends after the video's actual end
            endTime: Math.min(segment.endTime, Math.ceil(duration)),
          }));

          console.log("Original segments:", transcriptSegments); // Debug log
          console.log("Fixed segments:", fixedSegments); // Debug log

          // Update with fixed segments first (quick fix)
          setTranscriptSegments(fixedSegments);

          // Then do a more comprehensive fix with proper distribution
          if (
            transcriptSegments[0].text !== "No transcript content available." &&
            transcriptSegments[0].text !==
              "Failed to load transcript. API returned an error." &&
            transcriptSegments[0].text !==
              "Error fetching transcript. Please try again later."
          ) {
            // Get the original transcript text by joining all segments
            const fullText = transcriptSegments
              .map((segment) => segment.text)
              .join(" ");

            // Recreate segments with accurate duration
            const updatedSegments = createTranscriptSegments(
              fullText,
              duration
            );
            console.log("Updated segments with duration:", updatedSegments); // Debug log
            setTranscriptSegments(updatedSegments);
          }
        }
      }
    } catch (error) {
      console.error("Error getting video duration:", error);
    }
  };

  // Handle YouTube player state change
  const handleStateChange = (event: YouTubeEvent) => {
    // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (event.data === 1) {
      // Playing
      console.log("Video playing");
    }
  };

  // YouTube player options
  const opts: YouTubeProps["opts"] = {
    height: "352",
    width: "100%",
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
      const segmentIndex = transcriptSegments.findIndex(
        (segment) => segment.startTime === startTime
      );
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
    updateVideoTitle(params.id, editedTitle);
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
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Add effect to recreate segments when video duration becomes available
  useEffect(() => {
    // Only proceed if we have the duration and transcript
    if (!videoDuration || transcriptSegments.length === 0) {
      return;
    }

    console.log("Running duration effect with duration:", videoDuration);

    // Skip placeholder transcripts
    if (
      transcriptSegments[0].text === "No transcript content available." ||
      transcriptSegments[0].text ===
        "Failed to load transcript. API returned an error." ||
      transcriptSegments[0].text ===
        "Error fetching transcript. Please try again later."
    ) {
      return;
    }

    // Get the original transcript text
    const fullText = transcriptSegments
      .map((segment) => segment.text)
      .join(" ");

    // Recreate segments with accurate duration
    const updatedSegments = createTranscriptSegments(fullText, videoDuration);
    console.log("Recreated segments with accurate duration:", updatedSegments);

    // Check if segments need updating (have any times exceeding video duration)
    const needsUpdate = transcriptSegments.some(
      (segment) => segment.endTime > videoDuration
    );
    if (needsUpdate) {
      setTranscriptSegments(updatedSegments);
    }
  }, [videoDuration, transcriptLoading]);

  // Add a function to scroll to the current segment
  const scrollToCurrentSegment = () => {
    if (!transcriptRef.current || currentSegmentIndex === -1) return;

    const segmentElement = transcriptRef.current.querySelector(
      `[data-segment-index="${currentSegmentIndex}"]`
    );
    if (segmentElement) {
      segmentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
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
    if (language.code !== "en") {
      try {
        setIsTranslatingDisplay(true);
        setDisplayTranslationError(null);
        const translated = await translateTranscriptSegments(
          transcriptSegments,
          language
        );
        setTranslatedSegments(translated);
      } catch (error) {
        console.error("Error translating display segments:", error);
        setDisplayTranslationError(
          "Failed to translate transcript. Showing original version."
        );
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

  const downloadTranscript = async (
    format: "txt" | "txt-with-timestamps" | "srt"
  ) => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      // Translate the transcript if not in English
      let segmentsToUse = transcriptSegments;
      if (selectedLanguage.code !== "en") {
        try {
          const translatedSegments = await translateTranscriptSegments(
            transcriptSegments,
            selectedLanguage
          );
          segmentsToUse = transcriptSegments.map((segment, i) => ({
            ...segment,
            text: translatedSegments[i].text,
          }));
        } catch (error) {
          setTranslationError(
            "Failed to translate transcript. Downloading original version instead."
          );
          segmentsToUse = transcriptSegments;
        }
      }

      let content = "";

      if (format === "txt") {
        // Plain text without timestamps - join segments with a single space
        content = segmentsToUse.map((segment) => segment.text).join(" ");
      } else if (format === "txt-with-timestamps") {
        // Text with timestamps
        content = segmentsToUse
          .map(
            (segment) =>
              `${formatTime(segment.startTime)} - ${formatTime(
                segment.endTime
              )}\n${segment.text}`
          )
          .join("\n\n");
      } else if (format === "srt") {
        // SRT format
        content = segmentsToUse
          .map((segment, index) => {
            const startTime = new Date(segment.startTime * 1000)
              .toISOString()
              .substr(11, 12)
              .replace(".", ",");
            const endTime = new Date(segment.endTime * 1000)
              .toISOString()
              .substr(11, 12)
              .replace(".", ",");
            return `${index + 1}\n${startTime} --> ${endTime}\n${
              segment.text
            }\n\n`;
          })
          .join("");
      }

      // Create blob and download
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-${params.id}-${selectedLanguage.code}.${
        format === "srt" ? "srt" : "txt"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      handleDownloadClose();
    } catch (error) {
      console.error("Error downloading transcript:", error);
      setTranslationError("Failed to download transcript. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Add a useEffect to automatically generate summary when transcript is loaded
  useEffect(() => {
    if (!isPDF) {
      // Existing video summary logic (auto-generate summary for video)
      if (
        translatedSegments.length > 0 &&
        !transcriptLoading &&
        !isSummarizing &&
        !markdownContent &&
        summaryCards.length === 0
      ) {
        handleSummarize();
      }
    }
  }, [
    isPDF,
    translatedSegments,
    transcriptLoading,
    isSummarizing,
    markdownContent,
    summaryCards.length,
  ]);

  // Handle summary dropdown menu
  const handleSummaryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSummaryMenuAnchorEl(event.currentTarget);
  };

  const handleSummaryMenuClose = () => {
    setSummaryMenuAnchorEl(null);
  };

  // Handle custom prompt
  const handleCustomPrompt = () => {
    setShowCustomPromptInput(true);
    setCustomPrompt("");
    setCustomPromptTitle("");
    handleSummaryMenuClose();
  };

  const handleSubmitCustomPrompt = () => {
    if (customPrompt.trim()) {
      // Call handleSummarize with the custom prompt
      handleSummarize(
        customPrompt.trim(),
        customPromptTitle.trim() || "Custom Summary"
      );
    }
    setShowCustomPromptInput(false);
  };

  const handleCancelCustomPrompt = () => {
    setShowCustomPromptInput(false);
    setCustomPrompt("");
    setCustomPromptTitle("");
  };

  // Function to handle summarize button click
  const handleSummarize = async (
    prompt?: string,
    title?: string,
    templateType: string = "default"
  ) => {
    if (isSummarizing) return;

    try {
      setIsSummarizing(true);

      // Use extracted PDF text for PDFs, transcript for videos
      const fullContent = isPDF
        ? pdfText
        : translatedSegments.map((segment) => segment.text).join(" ");

      // Select the correct prompt for PDFs
      let result;
      if (templateType === "quiz-flashcards") {
        let quizPrompt;
        if (isPDF) {
          // Use the PDF flashcard prompt from summaryPrompts
          quizPrompt = summaryPrompts["pdf-flashcard"].userPrompt.replace(
            "{content}",
            pdfText
          );
        } else {
          // Use the video flashcard prompt
          quizPrompt = `Create an interactive quiz with flashcards based on this content. Generate 10-15 question-answer pairs that test understanding of the key concepts, facts, and insights. Return ONLY a valid JSON array with objects having this structure: { "question": "...", "answer": "...", "difficulty": "(easy|medium|hard)", "category": "..." }. Do NOT include markdown formatting or code blocks, just the raw JSON array: \n\n${fullContent}`;
        }
        result = await summarizeTranscript(fullContent, {
          templateType: templateType,
          customPrompt: quizPrompt,
        });
      } else {
        // Regular approach for other templates
        result = await summarizeTranscript(fullContent, prompt);
      }

      if (templateType === "default") {
        setMarkdownContent(result);
        const sections = parseSummaryResponse(result, templateType);
        setSummaryContent(sections.summary);
        setKeyInsightsContent(sections.keyInsights);
        setHighlightsContent(sections.highlights);
        setConclusionContent(sections.conclusion);
        if (!summaryCards.some((card) => card.type === "default")) {
          const cardId = `summary-${Date.now()}`;
          setSummaryCards((prevCards) => [
            {
              id: cardId,
              title: isPDF ? "PDF Summary" : "Summary",
              content: result,
              type: "default",
            },
            ...prevCards,
          ]);
        }
      } else {
        const cardId = `summary-${Date.now()}`;
        if (templateType === "quiz-flashcards") {
          const flashcards = parseSummaryResponse(result, templateType);
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: cardId,
              title:
                templateType === "quiz-flashcards"
                  ? "AI Flash Cards"
                  : title || "Interactive Quiz Cards",
              content: result,
              type: templateType,
              flashcards: flashcards,
            },
          ]);
        } else {
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: cardId,
              title: title || "Custom Summary",
              content: result,
              type: templateType,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummaryContent(
        "An error occurred while generating the summary. Please try again."
      );
      setMarkdownContent(
        "**Summary**\n\nAn error occurred while generating the summary. Please try again."
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  // Helper function to parse the OpenAI response
  const parseSummaryResponse = (response: string, templateType?: string) => {
    // If it's a quiz flashcard type, try to parse the JSON
    if (templateType === "quiz-flashcards") {
      try {
        console.log("Parsing quiz flashcards from response:", response);

        // Extract JSON from the markdown code block if it exists
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log("Found JSON code block:", jsonMatch[1]);
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            console.log("Successfully parsed JSON from code block:", parsed);
            return parsed;
          } catch (parseErr) {
            console.error("Error parsing JSON from code block:", parseErr);
          }
        }

        // If no code block or parsing failed, try finding JSON array in the text
        const jsonArrayMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonArrayMatch) {
          console.log("Found JSON array in text:", jsonArrayMatch[0]);
          try {
            const parsed = JSON.parse(jsonArrayMatch[0]);
            console.log("Successfully parsed JSON array from text:", parsed);
            return parsed;
          } catch (parseErr) {
            console.error("Error parsing JSON array from text:", parseErr);
          }
        }

        // If all parsing attempts fail, create a sample flashcard so we don't get the "No flash cards available" message
        console.log("All parsing attempts failed, creating sample flashcards");
        return [
          {
            question: "What was discussed in this content?",
            answer:
              "The AI couldn't parse the content properly. Please try generating the quiz again.",
            difficulty: "easy",
            category: "General",
          },
        ];
      } catch (err) {
        console.error("Error parsing quiz flashcards JSON:", err);
        // Return a sample flashcard so something appears
        return [
          {
            question: "What was discussed in this content?",
            answer:
              "The AI couldn't parse the content properly. Please try generating the quiz again.",
            difficulty: "easy",
            category: "General",
          },
        ];
      }
    }

    // Default structure for regular summaries
    const defaultReturn = {
      summary: "",
      keyInsights: "",
      highlights: "",
      conclusion: "",
    };

    try {
      // Try to find all sections with the new order (highlights before key insights)
      const summaryMatch = response.match(
        /\*\*Summary\*\*\s*([\s\S]*?)(?=\*\*Highlights\*\*|\*\*Key Insights\*\*|\*\*Conclusion\*\*|$)/i
      );
      const highlightsMatch = response.match(
        /\*\*Highlights\*\*\s*([\s\S]*?)(?=\*\*Key Insights\*\*|\*\*Conclusion\*\*|$)/i
      );
      const keyInsightsMatch = response.match(
        /\*\*Key Insights\*\*\s*([\s\S]*?)(?=\*\*Conclusion\*\*|$)/i
      );
      const conclusionMatch = response.match(
        /\*\*Conclusion\*\*\s*([\s\S]*?)$/i
      );

      if (summaryMatch && summaryMatch[1]) {
        defaultReturn.summary = summaryMatch[1].trim();
      }

      if (highlightsMatch && highlightsMatch[1]) {
        defaultReturn.highlights = highlightsMatch[1].trim();
      }

      if (keyInsightsMatch && keyInsightsMatch[1]) {
        defaultReturn.keyInsights = keyInsightsMatch[1].trim();
      }

      if (conclusionMatch && conclusionMatch[1]) {
        defaultReturn.conclusion = conclusionMatch[1].trim();
      }
    } catch (err) {
      console.error("Error parsing summary response:", err);
    }

    return defaultReturn;
  };

  // Handle selection of a summary template
  const handleSummaryTemplate = (template: string) => {
    // Create a prompt based on the selected template
    let prompt = "";
    let title = "";

    switch (template) {
      case "chapter":
        title = "Chapter Summary";
        prompt =
          "Create a chapter-by-chapter summary with a table of contents structure. Break down the content into logical sections, and provide detailed summaries for each chapter.";
        break;
      case "core-points":
        title = "Core Points Summary";
        prompt =
          "Summarize the core points, key conclusions, and important details of this content. Focus on extracting the most critical information and insights.";
        break;
      case "notes":
        title = "AI Note";
        prompt =
          "Generate structured, comprehensive notes in an organized format that would help someone review and retain this knowledge easily. Include bullet points, hierarchical structure, and highlight key concepts.";
        break;
      case "industry":
        title = "Industry & Market Analysis";
        prompt =
          "Analyze this content from a business perspective. Identify industry trends, market insights, competitive analysis, and key components relevant to business strategy.";
        break;
      case "financial":
        title = "Financial Summary";
        prompt =
          "Extract key financial insights and metrics from this content. Highlight important financial data, performance indicators, and strategic financial implications.";
        break;
      case "annual-report":
        title = "Annual Report Summary";
        prompt =
          "Summarize this as if it were an annual report. Include background information, key decisions, important data points, achievements, challenges, and future outlook.";
        break;
      case "legal":
        title = "Legal Document Summary";
        prompt =
          "Summarize this content as if it were a legal document. Highlight key legal terms, obligations, rights, potential liabilities, and important clauses in a structured format.";
        break;
      case "contract":
        title = "Contract Analysis";
        prompt =
          "Review this content as if it were a contract. Identify potential liabilities, obligations, risks, terms, conditions, and important details that would be relevant in a contract review.";
        break;
      case "meeting":
        title = "Meeting Minutes";
        prompt =
          "Summarize this content as if it were meeting minutes. Capture key discussion points, decisions made, action items, and essential information for those who couldn't attend.";
        break;
      case "essay":
        title = "Academic Essay Resource";
        prompt =
          "Generate an academic summary of this content with properly structured sections that would be useful for research or essay writing. Include key concepts, evidence, and citations where relevant.";
        break;
      case "blog":
        title = "Blog Post Draft";
        prompt =
          "Convert this content into an SEO-friendly blog post format with an engaging introduction, well-structured body with subheadings, and a conclusion. Use a conversational yet informative tone.";
        break;
      case "flashcards":
        title = "Study Flashcards";
        prompt =
          "Generate a set of flashcards from this content with clear questions on one side and concise answers on the other. Focus on key concepts, definitions, and important facts.";
        break;
      case "podcast":
        title = "Podcast Script";
        prompt =
          "Create a conversational podcast script based on this content. Include an engaging introduction, main discussion points, transitions between topics, and a conclusion that would work well in audio format.";
        break;
      case "quiz-flashcards":
        title = "AI Flash Cards";
        prompt =
          "Create an interactive quiz with flashcards based on this content. Generate 10-15 question-answer pairs that test understanding of the key concepts, facts, and insights.";
        break;
      default:
        title = "Summary";
        prompt =
          "Summarize this content in a clear, concise way highlighting the main points and key insights.";
    }

    // Call handleSummarize with the generated prompt and title
    handleSummarize(prompt, title, template);
    handleSummaryMenuClose();
  };

  // Function to delete a summary card
  const handleDeleteSummaryCard = (cardId: string) => {
    const cardToDelete = summaryCards.find((card) => card.id === cardId);

    // Handle deleting the default summary card
    if (cardToDelete && cardToDelete.type === "default") {
      // Clear the main content
      setMarkdownContent("");
      setSummaryContent("");
      setKeyInsightsContent("");
      setHighlightsContent("");
      setConclusionContent("");
    }

    // Remove card from state
    setSummaryCards((prevCards) =>
      prevCards.filter((card) => card.id !== cardId)
    );
  };

  // Function to edit a summary card
  const handleEditSummaryCard = (cardId: string) => {
    const card = summaryCards.find((c) => c.id === cardId);
    if (card) {
      setEditingCardId(cardId);
      setEditPrompt("");
      setEditTitle(card.title);
    }
  };

  const handleSaveCardEdit = async () => {
    if (!editingCardId) return;

    try {
      setIsSummarizing(true);
      const fullTranscript = translatedSegments
        .map((segment) => segment.text)
        .join(" ");

      // Only regenerate if there's a custom prompt
      if (editPrompt) {
        const result = await summarizeTranscript(fullTranscript, editPrompt);

        setSummaryCards((prevCards) =>
          prevCards.map((card) =>
            card.id === editingCardId
              ? { ...card, content: result, title: editTitle || card.title }
              : card
          )
        );
      } else {
        // Just update the title
        setSummaryCards((prevCards) =>
          prevCards.map((card) =>
            card.id === editingCardId
              ? { ...card, title: editTitle || card.title }
              : card
          )
        );
      }
    } catch (error) {
      console.error("Error updating summary card:", error);
    } finally {
      setEditingCardId(null);
      setIsSummarizing(false);
    }
  };

  const handleCancelCardEdit = () => {
    setEditingCardId(null);
  };

  // Note feature handlers
  const handleAddNote = () => {
    const newNote = {
      id: uuidv4(),
      content: "",
      timestamp: currentVideoTime,
      isEditing: true,
    };

    setNoteCards([...noteCards, newNote]);
    setEditingNoteContent("");

    // Focus the textarea in the next render cycle
    setTimeout(() => {
      if (noteInputRef.current) {
        noteInputRef.current.focus();
      }
    }, 0);
  };

  const handleSaveNote = (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    setNoteCards(
      noteCards.map((note) =>
        note.id === noteId
          ? { ...note, content: editingNoteContent, isEditing: false }
          : note
      )
    );
    setEditingNoteContent("");
  };

  const handleCancelNote = (noteId: string) => {
    // If it's a new note with no content, remove it
    if (!noteCards.find((note) => note.id === noteId)?.content) {
      setNoteCards(noteCards.filter((note) => note.id !== noteId));
    } else {
      // Otherwise just exit edit mode
      setNoteCards(
        noteCards.map((note) =>
          note.id === noteId ? { ...note, isEditing: false } : note
        )
      );
    }
    setEditingNoteContent("");
  };

  const handleEditNote = (noteId: string) => {
    const note = noteCards.find((note) => note.id === noteId);
    if (note) {
      setEditingNoteContent(note.content);
      setNoteCards(
        noteCards.map((note) =>
          note.id === noteId ? { ...note, isEditing: true } : note
        )
      );

      // Focus the textarea in the next render cycle
      setTimeout(() => {
        if (noteInputRef.current) {
          noteInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, noteId: string) => {
    // Save on Cmd/Ctrl + Enter
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveNote(noteId);
    }

    // Cancel on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelNote(noteId);
    }
  };

  const handleDeleteConfirm = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      setNoteCards(noteCards.filter((note) => note.id !== noteToDelete));
      setNoteToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const cancelDelete = () => {
    setNoteToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleCopyNote = (content: string) => {
    navigator.clipboard.writeText(content);
    setShowCopyAlert(true);
  };

  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  // PDF summary effect
  useEffect(() => {
    if (isPDF && pdfUrl) {
      setPdfSummaryLoading(true);
      setPdfSummaryError(null);
      extractPdfText(pdfUrl)
        .then(({ text, pages }) => {
          setPdfText(text);
          setPdfNumPages(pages.length);
          // Prepare prompt
          const promptTemplate = summaryPrompts["pdf-default"].userPrompt;
          const prompt = promptTemplate
            .replace("{title}", params.id || "Untitled Document")
            .replace("{pageCount}", String(pages.length))
            .replace("{full extracted PDF text}", text);
          // Call OpenAI or summary API
          return summarizeTranscript(text, prompt);
        })
        .then((summary) => {
          setMarkdownContent(summary);
          // Add to summaryCards if not already present
          if (!summaryCards.some((card) => card.type === "default")) {
            const cardId = `summary-${Date.now()}`;
            setSummaryCards((prevCards) => [
              {
                id: cardId,
                title: "PDF Summary",
                content: summary,
                type: "default",
              },
              ...prevCards,
            ]);
          }
        })
        .catch((err) => {
          setPdfSummaryError("Failed to generate PDF summary.");
        })
        .finally(() => setPdfSummaryLoading(false));
    }
  }, [isPDF, pdfUrl]);

  const handleMindMapClick = () => {
    if (showMindMap) {
      // If mindmap exists, scroll to it
      mindMapRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Create new mindmap
      setShowMindMap(true);
      // Wait for mindmap to be created, then scroll to it
      setTimeout(() => {
        mindMapRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <>
      <Box sx={{ p: 2, fontFamily: "Inter, sans-serif" }}>
        <Grid container spacing={0}>
          {/* Left Section */}
          <Grid item xs={12} md={5}>
            {/* PDF or Video Player */}
            {isPDF ? (
              <PDFViewer url={pdfUrl} />
            ) : (
              <>
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                        bgcolor: "black",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <YouTube
                      videoId={params.id}
                      opts={opts}
                      onReady={handleReady}
                      onStateChange={handleStateChange}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
                </Box>

                {/* Debug Current Time */}
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: theme.palette.text.secondary }}
                >
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
                    alignItems: "center",
                  }}
                >
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab
                      label="Transcript"
                      sx={{
                        color:
                          tabValue === 0
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
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
                        color:
                          tabValue === 1
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
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

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {/* Locate Button with proper Tooltip */}
                    <Tooltip title="Locate transcript to current video frame">
                      <IconButton
                        size="small"
                        onClick={scrollToCurrentSegment}
                        sx={{
                          color: theme.palette.primary.main,
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
                        }}
                      >
                        <LocationSearchingIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Auto-scroll switch */}
                    <Tooltip
                      title={
                        autoScroll
                          ? "Transcript along with the video enabled"
                          : "Transcript along with the video disabled"
                      }
                    >
                      <Switch
                        size="small"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: theme.palette.primary.main,
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
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
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
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
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
                          "&.Mui-disabled": {
                            color: theme.palette.text.disabled,
                          },
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
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <MenuItem
                        onClick={() => downloadTranscript("txt")}
                        disabled={isTranslating}
                      >
                        Download as TXT (no timestamps)
                      </MenuItem>
                      <MenuItem
                        onClick={() =>
                          downloadTranscript("txt-with-timestamps")
                        }
                        disabled={isTranslating}
                      >
                        Download as TXT (with timestamps)
                      </MenuItem>
                      <MenuItem
                        onClick={() => downloadTranscript("srt")}
                        disabled={isTranslating}
                      >
                        Download as SRT
                      </MenuItem>
                    </Menu>

                    {/* Language selection button */}
                    <Tooltip
                      title={`Select language (Current: ${selectedLanguage.name})`}
                    >
                      <IconButton
                        size="small"
                        onClick={handleLanguageClick}
                        sx={{
                          color: theme.palette.primary.main,
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.04)",
                          },
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
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
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
                        background:
                          theme.palette.mode === "light"
                            ? "#F3F4F6"
                            : "#2a2a3a",
                        borderRadius: "3px",
                        margin: "2px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background:
                          theme.palette.mode === "light"
                            ? "#D1D5DB"
                            : "#4a4a5a",
                        borderRadius: "3px",
                        "&:hover": {
                          background:
                            theme.palette.mode === "light"
                              ? "#9CA3AF"
                              : "#5a5a6a",
                        },
                      },
                    }}
                  >
                    {transcriptLoading ? (
                      <Box
                        sx={{ display: "flex", justifyContent: "center", p: 4 }}
                      >
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
                            bgcolor:
                              currentSegmentIndex === index
                                ? theme.palette.mode === "light"
                                  ? "rgba(25, 118, 210, 0.08)"
                                  : "rgba(144, 202, 249, 0.08)"
                                : "transparent",
                            borderRadius: 1,
                            transition: "background-color 0.3s ease",
                            "&:hover": {
                              bgcolor:
                                currentSegmentIndex === index
                                  ? theme.palette.mode === "light"
                                    ? "rgba(25, 118, 210, 0.12)"
                                    : "rgba(144, 202, 249, 0.12)"
                                  : theme.palette.mode === "light"
                                  ? "rgba(0, 0, 0, 0.04)"
                                  : "rgba(255, 255, 255, 0.04)",
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
                                color:
                                  currentSegmentIndex === index
                                    ? theme.palette.primary.main
                                    : theme.palette.text.primary,
                                fontWeight:
                                  currentSegmentIndex === index
                                    ? "bold"
                                    : "normal",
                                fontSize: "0.875rem",
                              }}
                            >
                              {formatTime(segment.startTime)} -{" "}
                              {formatTime(segment.endTime)}
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
                              color:
                                currentSegmentIndex === index
                                  ? theme.palette.primary.main
                                  : theme.palette.text.primary,
                              fontSize: "1rem",
                              lineHeight: 1.5,
                              width: "100%",
                              pr: 2,
                              fontWeight:
                                currentSegmentIndex === index ? 500 : "normal",
                            }}
                          >
                            {segment.text}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </TabPanel>
              </>
            )}
          </Grid>

          {/* Right Section */}
          <Grid item xs={12} md={7}>
            {/* Right column buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 2,
                pl: 2,
                justifyContent: "flex-end",
              }}
            >
              {/* Summarize Button */}
              <Button
                variant="contained"
                onClick={handleSummaryMenuOpen}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ textTransform: "none" }}
              >
                Summarize
              </Button>
              {/* Knowledge Graph Button */}
              <Tooltip title="Show Knowledge Graph">
                <IconButton
                  onClick={() => setShowForceGraph(!showForceGraph)}
                  color={showForceGraph ? "primary" : "default"}
                >
                  <HubIcon />
                </IconButton>
              </Tooltip>
              {/* Mind Map Button */}
              <Tooltip title="Mind Map">
                <IconButton
                  onClick={handleMindMapClick}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    color: showMindMap
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    "&:hover": {
                      bgcolor: theme.palette.primary.light,
                      color: "#fff",
                    },
                  }}
                >
                  <AccountTreeIcon />
                </IconButton>
              </Tooltip>
              {/* School Icon */}
              <IconButton
                onClick={handleCustomPrompt}
                sx={{
                  color: theme.palette.primary.main,
                }}
              >
                <SchoolIcon />
              </IconButton>
              {/* Add Note Button */}
              <IconButton
                onClick={handleAddNote}
                sx={{
                  color: theme.palette.primary.main,
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Cards Section */}
            <Box sx={{ pl: 2 }}>
              {/* Summary Cards */}
              {summaryCards.map((card) => (
                <Paper
                  key={card.id}
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    width: "100%",
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background:
                        theme.palette.mode === "light" ? "#F3F4F6" : "#2a2a3a",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background:
                        theme.palette.mode === "light" ? "#D1D5DB" : "#4a4a5a",
                      borderRadius: "3px",
                      "&:hover": {
                        background:
                          theme.palette.mode === "light"
                            ? "#9CA3AF"
                            : "#5a5a6a",
                      },
                    },
                  }}
                >
                  {isSummarizing &&
                  !summaryCards.some((card) => card.type !== "default") &&
                  !markdownContent ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography variant="body1">
                        Generating summary...
                      </Typography>
                    </Box>
                  ) : markdownContent ? (
                    <Box
                      sx={{
                        padding: "0.1rem 0.5rem 0.1rem 0.5rem",
                        position: "relative",
                        minHeight: "200px",
                        paddingBottom: "60px",
                        "& p": { margin: "0.75em 0" },
                        "& ul": { paddingLeft: "1.5em", margin: "0.75em 0" },
                        "& li": { margin: "0.5em 0", paddingLeft: "0.5em" },
                        "& strong": {
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                          fontSize: "1em",
                          display: "block",
                          marginTop: "1em",
                          marginBottom: "0.75em",
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          paddingBottom: "0.25em",
                        },
                        "& h1, & h2, & h3, & h4, & h5, & h6": {
                          margin: "1.25em 0 0.75em 0",
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      <ReactMarkdown>{markdownContent}</ReactMarkdown>

                      {/* Edit and Delete buttons */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          display: "flex",
                          gap: 1,
                          zIndex: 1,
                          backgroundColor: "background.paper",
                          padding: "8px",
                          borderRadius: "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.primary.main,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              color: "#fff",
                            },
                          }}
                          onClick={() => {
                            const defaultCard = summaryCards.find(
                              (card) => card.type === "default"
                            );
                            if (defaultCard) {
                              handleEditSummaryCard(defaultCard.id);
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.error.main,
                            "&:hover": {
                              bgcolor: theme.palette.error.light,
                              color: "#fff",
                            },
                          }}
                          onClick={() => {
                            const defaultCard = summaryCards.find(
                              (card) => card.type === "default"
                            );
                            if (defaultCard) {
                              handleDeleteSummaryCard(defaultCard.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Card Type Label */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          zIndex: 1,
                          padding: "0 12px",
                          borderRadius: "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          fontSize: "14px",
                          height: "30px",
                          lineHeight: "28px",
                          color:
                            theme.palette.mode === "light"
                              ? "#2e83fb"
                              : "#2e83fb",
                          backgroundColor:
                            theme.palette.mode === "light"
                              ? "#ecf5ff"
                              : "#1e1e2d",
                          border: `1px solid ${
                            theme.palette.mode === "light"
                              ? "#d9ecff"
                              : "#409eff"
                          }`,
                        }}
                      >
                        Default Summary
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          textAlign: "center",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Summarizing...
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}

              {/* Notes */}
              {noteCards.map((note) => (
                <Paper
                  key={note.id}
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    width: "100%",
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background:
                        theme.palette.mode === "light" ? "#F3F4F6" : "#2a2a3a",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background:
                        theme.palette.mode === "light" ? "#D1D5DB" : "#4a4a5a",
                      borderRadius: "3px",
                      "&:hover": {
                        background:
                          theme.palette.mode === "light"
                            ? "#9CA3AF"
                            : "#5a5a6a",
                      },
                    },
                  }}
                >
                  {note.isEditing ? (
                    // Editing Mode
                    <Box sx={{ p: 2 }}>
                      <TextField
                        fullWidth
                        placeholder="Catch what you're thinking now"
                        multiline
                        rows={5}
                        inputRef={noteInputRef}
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        variant="outlined"
                        margin="normal"
                        size="small"
                        onKeyDown={(e) => handleNoteKeyDown(e, note.id)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: theme.palette.divider,
                            },
                            "&:hover fieldset": {
                              borderColor: theme.palette.primary.light,
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 2,
                          gap: 1,
                        }}
                      >
                        <Button
                          onClick={() => handleCancelNote(note.id)}
                          size="small"
                          sx={{
                            color: theme.palette.text.secondary,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveNote(note.id)}
                          variant="contained"
                          size="small"
                          sx={{
                            background:
                              "linear-gradient(90deg, #2e83fb 0%, #9867ff 100%)",
                          }}
                        >
                          Save
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    // View Mode
                    <Box
                      sx={{
                        padding: "0.1rem 0.5rem 0.1rem 0.5rem",
                        position: "relative",
                        minHeight: "200px",
                        paddingBottom: "60px",
                        "& p": { margin: "0.75em 0" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="div"
                          color="primary"
                          sx={{
                            fontWeight: "bold",
                            minWidth: "50px",
                            mr: 2,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (playerRef.current) {
                              playerRef.current.seekTo(note.timestamp);
                            }
                          }}
                        >
                          {formatTime(note.timestamp)}
                        </Typography>
                        <Typography
                          variant="body1"
                          component="div"
                          sx={{
                            whiteSpace: "pre-wrap",
                            maxHeight: "300px",
                            overflowY: "auto",
                          }}
                        >
                          {note.content}
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          display: "flex",
                          gap: 1,
                          zIndex: 1,
                          backgroundColor: theme.palette.background.paper,
                          padding: "8px",
                          borderRadius: "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.primary.main,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              color: "#fff",
                            },
                          }}
                          onClick={() => handleCopyNote(note.content)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.primary.main,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              color: "#fff",
                            },
                          }}
                        >
                          <ImageIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.primary.main,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              color: "#fff",
                            },
                          }}
                          onClick={() => handleEditNote(note.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            color: theme.palette.error.main,
                            "&:hover": {
                              bgcolor: theme.palette.error.light,
                              color: "#fff",
                            },
                          }}
                          onClick={() => handleDeleteConfirm(note.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Card Type Label */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          zIndex: 1,
                          padding: "0 12px",
                          borderRadius: "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          fontSize: "14px",
                          height: "30px",
                          lineHeight: "28px",
                          color:
                            theme.palette.mode === "light"
                              ? "#2e83fb"
                              : "#2e83fb",
                          backgroundColor:
                            theme.palette.mode === "light"
                              ? "#ecf5ff"
                              : "#1e1e2d",
                          border: `1px solid ${
                            theme.palette.mode === "light"
                              ? "#d9ecff"
                              : "#409eff"
                          }`,
                        }}
                      >
                        Note
                      </Box>
                    </Box>
                  )}
                </Paper>
              ))}

              {/* Force Graph */}
              {showForceGraph && (
                <Box sx={{ mb: 3, mt: 2 }}>
                  <ForceGraph
                    content={
                      isPDF
                        ? pdfText
                        : transcriptSegments
                            .map((segment) => segment.text)
                            .join(" ")
                    }
                    type={isPDF ? "pdf" : "video"}
                    onError={(error) => {
                      console.error("Force Graph Error:", error);
                    }}
                  />
                </Box>
              )}

              {/* Mind Map - Add at the end */}
              {showMindMap && (
                <Box
                  ref={mindMapRef}
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                  }}
                >
                  <MindMap
                    content={
                      isPDF
                        ? pdfText
                        : transcriptSegments
                            .map((segment) => segment.text)
                            .join(" ")
                    }
                    type={isPDF ? "pdf" : "video"}
                    onError={(error) => console.error("MindMap error:", error)}
                    onDelete={() => setShowMindMap(false)}
                  />
                </Box>
              )}
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
            Copied to clipboard
          </Alert>
        </Snackbar>

        {/* Add error snackbar */}
        <Snackbar
          open={!!translationError}
          autoHideDuration={6000}
          onClose={() => setTranslationError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setTranslationError(null)}
            severity="warning"
            sx={{ width: "100%" }}
          >
            {translationError}
          </Alert>
        </Snackbar>

        {/* Delete Note Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={cancelDelete}
          aria-labelledby="delete-note-dialog-title"
        >
          <DialogTitle
            id="delete-note-dialog-title"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ fontWeight: "bold" }}
            >
              Delete Note
            </Typography>
            <IconButton size="small" onClick={cancelDelete}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ pb: 2, px: 3 }}>
            <Button
              onClick={cancelDelete}
              sx={{
                color: theme.palette.text.secondary,
                backgroundColor:
                  theme.palette.mode === "light" ? "#f5f5f5" : "#333",
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "light" ? "#e0e0e0" : "#444",
                },
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
