"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import YouTube, {
  YouTubePlayer,
  YouTubeProps,
  YouTubeEvent,
} from "react-youtube";
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
import { extractPdfText } from "@/utils/pdfUtils";
import summaryPrompts from "@/utils/summaryPrompts.json";
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("@/app/workspace/detail/[id]/components/PDFViewer"), { ssr: false });
import { TemplateConfig } from '@/types/summary';
import { validateTemplateType } from '@/utils/templateValidation';

// Add YouTube API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        UNSTARTED: number;
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

// Add type definitions for performance entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// Add new interfaces for chunked loading
interface TranscriptChunk {
  startTime: number;
  endTime: number;
  segments: TranscriptSegment[];
}

export default function VideoDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type");
  const rawPdfUrl = searchParams.getAll("pdfUrl");
  const pdfUrl = Array.isArray(rawPdfUrl) ? rawPdfUrl[0] : rawPdfUrl;
  const isPDF = type === "pdf" && !!pdfUrl;

  interface PerformanceMetrics {
    pageLoadStart: number;
    videoPlayerReady: number | null;
    transcriptStart: number | null;
    transcriptEnd: number | null;
    proxySetupStart: number | null;
    proxySetupEnd: number | null;
    ytdlpStart: number | null;
    ytdlpEnd: number | null;
    videoInfoStart?: number | null;
    videoInfoEnd?: number | null;
    summaryStart?: number | null;
    summaryEnd?: number | null;
  }

  const performanceMetrics = useRef<PerformanceMetrics & {
    videoInfoStart?: number | null;
    videoInfoEnd?: number | null;
    summaryStart?: number | null;
    summaryEnd?: number | null;
  }>({
    pageLoadStart: Date.now(),
    videoPlayerReady: null,
    transcriptStart: null,
    transcriptEnd: null,
    proxySetupStart: null,
    proxySetupEnd: null,
    ytdlpStart: null,
    ytdlpEnd: null,
    videoInfoStart: null,
    videoInfoEnd: null,
    summaryStart: null,
    summaryEnd: null,
  });

  const [playerState, setPlayerState] = useState({
    isReady: false,
    isBuffering: false,
    isPlaying: false,
    metadataLoaded: false
  });

  // Log initial render time
  useEffect(() => {
    const initialRenderTime = Date.now() - performanceMetrics.current.pageLoadStart;
    console.log(`[Performance] Page initial render time: ${initialRenderTime}ms`);

    // Start performance monitoring
    const perfObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "largest-contentful-paint") {
          console.log(
            `[Performance] Largest Contentful Paint: ${entry.startTime}ms`
          );
        }
        if (entry.entryType === "layout-shift") {
          const layoutShift = entry as LayoutShiftEntry;
          console.log(
            `[Performance] Cumulative Layout Shift: ${layoutShift.value}`
          );
        }
        if (entry.entryType === "first-input") {
          const firstInput = entry as FirstInputEntry;
          console.log(
            `[Performance] First Input Delay: ${
              firstInput.processingStart - firstInput.startTime
            }ms`
          );
        }
      });
    });

    // Observe performance metrics
    perfObserver.observe({
      entryTypes: ["largest-contentful-paint", "layout-shift", "first-input"],
    });

    // Log network conditions if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection as NetworkInformation;
      console.log("[Performance] Network conditions:", {
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    }

    return () => {
      perfObserver.disconnect();
      console.log(
        `[Performance] Total page lifetime: ${
          Date.now() - performanceMetrics.current.pageLoadStart
        }ms`
      );
    };
  }, []);

  // Log when PDF/Video content starts and finishes loading
  useEffect(() => {
    if (isPDF) {
      console.log("[Performance] Starting PDF content load");
    } else {
      console.log("[Performance] Starting video content load");
    }
  }, [isPDF]);

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

  // Add new state variables after the existing state declarations
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>(
    []
  );
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const [chunkLoadingError, setChunkLoadingError] = useState<string | null>(
    null
  );
  const [lastChunkEndTime, setLastChunkEndTime] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add constant for chunk duration (5 minutes)
  const CHUNK_DURATION = 300;

  // Add refs for tracking loading state
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log("API URL (detail/[id]):", apiUrl);

  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const templateConfigs: TemplateConfig[] = await response.json();
        setTemplates(templateConfigs);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplateError('Failed to load summary templates');
      }
    };

    fetchTemplates();
  }, []);

  // Fetch video info (yt-dlp)
  useEffect(() => {
    if (isPDF) {
      // It's a PDF, set a title (e.g., from URL or a default)
      const filename = pdfUrl?.split("/").pop()?.replace(".pdf", "") || "PDF Document";
      setVideoTitle(filename);
      setLoading(false);
      return;
    }

    const fetchVideoDetails = async () => {
      console.log("[VideoDetails] Starting to fetch video details");
      try {
        // First try to get from recent videos history
        const savedVideo = recentVideos.find((video) => video.id === params.id);
        if (savedVideo) {
          console.log("[VideoDetails] Found video in history:", savedVideo.title);
          setVideoTitle(savedVideo.title);
          setEditedTitle(savedVideo.title);
          setLoading(false);
        } else {
          console.log("[VideoDetails] Video not in history, fetching from API");
          try {
            performanceMetrics.current.videoInfoStart = Date.now();
            const videoDetails = await getYouTubeVideoDetails(params.id as string);
            performanceMetrics.current.videoInfoEnd = Date.now();
            if (videoDetails) {
              console.log("[VideoDetails] Successfully fetched video details:", {
                title: videoDetails.title,
                hasTranscript: !!videoDetails.transcript,
              });
              setVideoTitle(videoDetails.title);
              setEditedTitle(videoDetails.title);
            } else {
              console.warn("[VideoDetails] No video details returned from API");
              const fallbackTitle = generateFallbackTitle(params.id as string);
              setVideoTitle(fallbackTitle);
              setEditedTitle(fallbackTitle);
            }
          } catch (error) {
            performanceMetrics.current.videoInfoEnd = Date.now();
            console.error("[VideoDetails] Error fetching video details:", error);
            setApiError(true);
            const fallbackTitle = generateFallbackTitle(params.id as string);
            setVideoTitle(fallbackTitle);
            setEditedTitle(fallbackTitle);
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        setLoading(false);
      }
    };
    fetchVideoDetails();
    return () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
      }
    };
  }, [params.id, recentVideos, isPDF, pdfUrl]);

  // Fetch transcript independently
  useEffect(() => {
    if (isPDF) return;
    if (!params.id) return;
    fetchTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
    performanceMetrics.current.videoPlayerReady = Date.now();
    console.log(`[Performance] YouTube player ready: ${performanceMetrics.current.videoPlayerReady - performanceMetrics.current.pageLoadStart}ms`);
    
    setPlayerState(prev => ({...prev, isReady: true}));
    console.log('[Player State] Player ready');
    
    playerRef.current = event.target;

    // Get and store video duration when player is ready
    try {
      const duration = playerRef.current.getDuration();
      console.log("[Performance] Video duration loaded:", duration);

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
      console.error("[Performance] Error getting video duration:", error);
    }
  };

  // Handle YouTube player state change
  const handleStateChange = (event: YouTubeEvent) => {
    const newState = {
      isBuffering: event.data === window.YT.PlayerState.BUFFERING,
      isPlaying: event.data === window.YT.PlayerState.PLAYING,
      metadataLoaded: event.data >= window.YT.PlayerState.UNSTARTED
    };
    
    setPlayerState(prev => ({...prev, ...newState}));
    console.log('[Player State]', newState);
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      startTimeTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      stopTimeTracking();
    }
  };

  // Update the time tracking function
  const startTimeTracking = () => {
    if (playerRef.current) {
      const updateTime = () => {
        const time = playerRef.current?.getCurrentTime() || 0;
        setCurrentTime(time);
      };
      timeIntervalRef.current = setInterval(updateTime, 1000);
    }
  };

  const stopTimeTracking = () => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
  };

  // YouTube player options
  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
      host: "https://www.youtube.com",
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
    updateVideoTitle(params.id as string, editedTitle);
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
      performanceMetrics.current.summaryStart = Date.now();

      const fullContent = isPDF
        ? pdfText
        : `https://www.youtube.com/watch?v=${params.id}`;

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fullContent,
          templateType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }

      const result = await response.text();

      // Add new card or update existing default card
      const cardId = `summary-${Date.now()}`;
      const existingDefaultCardIndex = summaryCards.findIndex(
        (card) => card.type === "default"
      );

      if (templateType === "quiz-flashcards") {
        const flashcards = parseSummaryResponse(result, templateType);
        setSummaryCards((prevCards) => [
          ...prevCards,
          {
            id: cardId,
            title: title || (isPDF ? "PDF Flash Cards" : "AI Flash Cards"),
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

      performanceMetrics.current.summaryEnd = Date.now();
    } catch (error) {
      performanceMetrics.current.summaryEnd = Date.now();
      console.error("Error generating summary:", error);
      setTemplateError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Helper function to parse the OpenAI response
  const parseSummaryResponse = (response: string, templateType?: string) => {
    // Handle quiz-flashcards format
    if (templateType === "quiz-flashcards") {
      try {
        // Find JSON array in the response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1]);
        }
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

    // Handle different template types
    switch (templateType) {
      case "chapter":
        return {
          tableOfContents: response.match(/\*\*Table of Contents\*\*\s*([\s\S]*?)(?=\*\*Chapter Summaries\*\*|\*\*Key Takeaways\*\*|$)/i)?.[1]?.trim() || "",
          chapterSummaries: response.match(/\*\*Chapter Summaries\*\*\s*([\s\S]*?)(?=\*\*Key Takeaways\*\*|$)/i)?.[1]?.trim() || "",
          keyTakeaways: response.match(/\*\*Key Takeaways\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || "",
        };

      case "core-points":
        return {
          corePoints: response.match(/\*\*Core Points\*\*\s*([\s\S]*?)(?=\*\*Key Conclusions\*\*|\*\*Critical Details\*\*|$)/i)?.[1]?.trim() || "",
          keyConclusions: response.match(/\*\*Key Conclusions\*\*\s*([\s\S]*?)(?=\*\*Critical Details\*\*|$)/i)?.[1]?.trim() || "",
          criticalDetails: response.match(/\*\*Critical Details\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || "",
        };

      case "legal":
        return {
          documentType: response.match(/\*\*Document Type & Purpose\*\*\s*([\s\S]*?)(?=\*\*Key Legal Terms\*\*|\*\*Rights & Obligations\*\*|$)/i)?.[1]?.trim() || "",
          keyLegalTerms: response.match(/\*\*Key Legal Terms\*\*\s*([\s\S]*?)(?=\*\*Rights & Obligations\*\*|\*\*Liabilities & Risks\*\*|$)/i)?.[1]?.trim() || "",
          rightsObligations: response.match(/\*\*Rights & Obligations\*\*\s*([\s\S]*?)(?=\*\*Liabilities & Risks\*\*|\*\*Important Clauses\*\*|$)/i)?.[1]?.trim() || "",
          liabilitiesRisks: response.match(/\*\*Liabilities & Risks\*\*\s*([\s\S]*?)(?=\*\*Important Clauses\*\*|\*\*Procedural Requirements\*\*|$)/i)?.[1]?.trim() || "",
          importantClauses: response.match(/\*\*Important Clauses\*\*\s*([\s\S]*?)(?=\*\*Procedural Requirements\*\*|$)/i)?.[1]?.trim() || "",
          proceduralRequirements: response.match(/\*\*Procedural Requirements\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || "",
        };

      case "meeting":
        return {
          overview: response.match(/\*\*Meeting Overview\*\*\s*([\s\S]*?)(?=\*\*Key Discussion Points\*\*|\*\*Decisions Made\*\*|$)/i)?.[1]?.trim() || "",
          discussionPoints: response.match(/\*\*Key Discussion Points\*\*\s*([\s\S]*?)(?=\*\*Decisions Made\*\*|\*\*Action Items\*\*|$)/i)?.[1]?.trim() || "",
          decisions: response.match(/\*\*Decisions Made\*\*\s*([\s\S]*?)(?=\*\*Action Items\*\*|\*\*Open Issues\*\*|$)/i)?.[1]?.trim() || "",
          actionItems: response.match(/\*\*Action Items\*\*\s*([\s\S]*?)(?=\*\*Open Issues\*\*|\*\*Next Steps\*\*|$)/i)?.[1]?.trim() || "",
          openIssues: response.match(/\*\*Open Issues\*\*\s*([\s\S]*?)(?=\*\*Next Steps\*\*|$)/i)?.[1]?.trim() || "",
          nextSteps: response.match(/\*\*Next Steps\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || "",
        };

      // Default case for standard summary format
      default:
        return {
          summary: response.match(/\*\*Summary\*\*\s*([\s\S]*?)(?=\*\*Highlights\*\*|\*\*Key Insights\*\*|\*\*Conclusion\*\*|$)/i)?.[1]?.trim() || "",
          highlights: response.match(/\*\*Highlights\*\*\s*([\s\S]*?)(?=\*\*Key Insights\*\*|\*\*Conclusion\*\*|$)/i)?.[1]?.trim() || "",
          keyInsights: response.match(/\*\*Key Insights\*\*\s*([\s\S]*?)(?=\*\*Conclusion\*\*|$)/i)?.[1]?.trim() || "",
          conclusion: response.match(/\*\*Conclusion\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || "",
        };
    }
  };

  // Handle selection of a summary template
  const handleSummaryTemplate = (templateType: string) => {
    const template = templates.find(t => t.type === templateType);
    if (!template) {
      setTemplateError(`Invalid template type: ${templateType}`);
      return;
    }

    handleSummarize(undefined, template.title, templateType);
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
      // Only set timestamp if it's NOT a PDF
      timestamp: isPDF ? 0 : currentVideoTime,
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

  // Dynamically set pdfjs workerSrc only on client
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (typeof window !== "undefined") {
        const mod = await import("react-pdf");
        if (isMounted && mod && mod.pdfjs && mod.pdfjs.GlobalWorkerOptions) {
          mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

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
            .replace(/\{title\}/g, String(params.id || "Untitled Document"))
            .replace(/\{pageCount\}/g, String(pages.length))
            .replace(/\{full extracted PDF text\}/g, String(text));
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

  // --- Add Handler for Title Changes from PDFViewer ---
  const handlePdfTitleChange = (newTitle: string) => {
    setVideoTitle(newTitle);
    // Persist the change if needed (e.g., update context, database)
    // For now, just update local state
    console.log("PDF title updated in parent:", newTitle);
  };

  // Add new function to load next chunk
  const loadNextChunk = async () => {
    if (isLoadingRef.current || currentChunkIndex >= totalChunks - 1) return;

    try {
      isLoadingRef.current = true;
      setIsLoadingChunk(true);
      setChunkLoadingError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/video/chunk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${params.id}`,
          startTime: lastChunkEndTime,
          duration: CHUNK_DURATION,
          segmentDuration: 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load chunk: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.grouped_segments || data.grouped_segments.length === 0) {
        throw new Error("No segments in chunk");
      }

      const newChunk: TranscriptChunk = {
        startTime: data.start_time,
        endTime: data.end_time,
        segments: data.grouped_segments.map((segment: any) => ({
          startTime: segment.startTime,
          endTime: segment.endTime,
          text: segment.text,
        })),
      };

      setTranscriptChunks((prev) => [...prev, newChunk]);
      setCurrentChunkIndex((prev) => prev + 1);
      setLastChunkEndTime(data.end_time);
    } catch (error) {
      console.error("[Chunk Loading] Error:", error);
      setChunkLoadingError(
        error instanceof Error ? error.message : "Failed to load chunk"
      );
    } finally {
      isLoadingRef.current = false;
      setIsLoadingChunk(false);
    }
  };

  // Add intersection observer for lazy loading
  useEffect(() => {
    if (!loadingTriggerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          loadNextChunk();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadingTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentChunkIndex, totalChunks, loadNextChunk]);

  // Modify fetchTranscript to handle chunked data
  const fetchTranscript = async () => {
    performanceMetrics.current.transcriptStart = Date.now();
    console.log('[Performance] Starting transcript fetch');
    setTranscriptLoading(true);
    setError(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[VideoDetails] Fetching transcript from API (attempt ${attempt}/${MAX_RETRIES})`);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(`${apiUrl}/video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${params.id}`,
            segmentDuration: 30,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[VideoDetails] Transcript fetch attempt ${attempt} failed:`, errorData);
          
          if (attempt === MAX_RETRIES) {
            throw new Error(`Failed to fetch transcript: ${response.statusText}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        const data = await response.json();
        performanceMetrics.current.transcriptEnd = Date.now();
        console.log(`[Performance] Transcript fetch completed: ${performanceMetrics.current.transcriptEnd - performanceMetrics.current.transcriptStart}ms`);
        console.log(`[Performance] Total page load time: ${Date.now() - performanceMetrics.current.pageLoadStart}ms`);
        console.log("[VideoDetails] Received transcript data:", {
          hasTranscript: !!data.transcript,
          transcriptLength: data.transcript?.length || 0,
        });

        if (!data.transcript) {
          if (attempt === MAX_RETRIES) {
            throw new Error("No transcript data received after all attempts");
          }
          console.warn(`[VideoDetails] No transcript data on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        // Create segments from the transcript
        let transcriptText = "";
        if (Array.isArray(data.transcript)) {
          transcriptText = data.transcript.map((seg: any) => seg.text).join(" ");
        } else if (typeof data.transcript === "string") {
          transcriptText = data.transcript;
        } else {
          transcriptText = "";
        }
        const segments = createTranscriptSegments(transcriptText, data.duration);
        setTranscriptSegments(segments);
        setTranslatedSegments(segments); // Initialize translated segments with original
        setIsInitialLoad(false);
        setTranscriptLoading(false); // Set loading to false on success
        return; // Success, exit the function
      } catch (error) {
        console.error(`[VideoDetails] Transcript API error (attempt ${attempt}):`, error);
        if (attempt === MAX_RETRIES) {
          setError(
            error instanceof Error ? error.message : "Failed to fetch transcript"
          );
          setTranscriptSegments([
            {
              startTime: 0,
              endTime: 30,
              text: "Failed to load transcript. Please try again later.",
            },
          ]);
          setTranscriptLoading(false); // Set loading to false on final error
        }
      }
    }
    setTranscriptLoading(false); // Set loading to false if we exit the loop without success
  };

  // Add loading indicator component
  const ChunkLoadingIndicator = () => (
    <Box
      ref={loadingTriggerRef}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 2,
        minHeight: "100px",
      }}
    >
      {isLoadingChunk ? (
        <CircularProgress size={24} />
      ) : chunkLoadingError ? (
        <Typography color="error">{chunkLoadingError}</Typography>
      ) : currentChunkIndex < totalChunks - 1 ? (
        <Typography color="text.secondary">Scroll to load more</Typography>
      ) : null}
    </Box>
  );

  // Modify the transcript rendering section
  const renderTranscript = () => {
    if (!transcriptSegments.length) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {transcriptSegments.map((segment, index) => (
          <Box
            key={index}
            sx={{
              p: 1,
              cursor: "pointer",
              backgroundColor:
                currentTime >= segment.startTime &&
                currentTime <= segment.endTime
                  ? "action.selected"
                  : "transparent",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
            onClick={() => handleSegmentClick(segment.startTime)}
          >
            <Typography variant="body2">
              {formatTime(segment.startTime)} - {segment.text}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Add PerformanceMonitor component
  const PerformanceMonitor = () => {
    const [metrics, setMetrics] = useState({
      pageLoad: 0,
      playerReady: 0,
      transcriptFetch: 0,
      videoInfo: 0,
      summary: 0,
      totalTime: 0
    });

    useEffect(() => {
      const updateMetrics = () => {
        const now = Date.now();
        setMetrics({
          pageLoad: performanceMetrics.current.videoPlayerReady ? 
            performanceMetrics.current.videoPlayerReady - performanceMetrics.current.pageLoadStart : 0,
          playerReady: performanceMetrics.current.transcriptStart && performanceMetrics.current.videoPlayerReady ? 
            performanceMetrics.current.transcriptStart - performanceMetrics.current.videoPlayerReady : 0,
          transcriptFetch: performanceMetrics.current.transcriptEnd && performanceMetrics.current.transcriptStart ? 
            performanceMetrics.current.transcriptEnd - performanceMetrics.current.transcriptStart : 0,
          videoInfo: performanceMetrics.current.videoInfoStart && performanceMetrics.current.videoInfoEnd ?
            performanceMetrics.current.videoInfoEnd - performanceMetrics.current.videoInfoStart : 0,
          summary: performanceMetrics.current.summaryStart && performanceMetrics.current.summaryEnd ?
            performanceMetrics.current.summaryEnd - performanceMetrics.current.summaryStart : 0,
          totalTime: now - performanceMetrics.current.pageLoadStart
        });
      };
      const interval = setInterval(updateMetrics, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
        <Typography variant="h6">Performance Metrics</Typography>
        <Typography>Page Load: {metrics.pageLoad}ms</Typography>
        <Typography>Player Ready: {metrics.playerReady}ms</Typography>
        <Typography>Video Info Fetch: {metrics.videoInfo}ms</Typography>
        <Typography>Transcript Fetch: {metrics.transcriptFetch}ms</Typography>
        <Typography>Summary Generation: {metrics.summary}ms</Typography>
        <Typography>Total Time: {metrics.totalTime}ms</Typography>
        <Typography>Player State: {JSON.stringify(playerState)}</Typography>
      </Box>
    );
  };

  // Add PerformanceMonitor to the render
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <PerformanceMonitor />
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
      <Box sx={{ p: 2, fontFamily: "Inter, sans-serif" }}>
        <Grid container spacing={0}>
          {/* Left Section */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              height: "calc(100vh - 96px)",
              display: "flex",
              flexDirection: "column",
              bgcolor:
                theme.palette.mode === "dark"
                  ? theme.palette.background.default
                  : theme.palette.grey[200],
            }}
          >
            {/* PDF or Video Player */}
            {isPDF ? (
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.background.paper
                        : "#2E2E2E",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : "#555555",
                    borderRadius: "4px",
                    "&:hover": {
                      background:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[600]
                          : "#777777",
                    },
                  },
                }}
              >
                <PDFViewer
                  url={pdfUrl}
                  title={videoTitle}
                  onBack={() => router.back()}
                  onTitleChange={handlePdfTitleChange}
                />
              </Box>
            ) : (
              // ...existing video player code...
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
                      videoId={params.id?.toString() ?? ""}
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
                      <>{renderTranscript()}</>
                    )}
                  </Box>
                </TabPanel>
              </>
            )}
          </Grid>

          {/* Right Section */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              height: "calc(100vh - 96px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                p: 2,
                flexGrow: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background:
                    theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "#2E2E2E",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : "#555555",
                  borderRadius: "4px",
                  "&:hover": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[600]
                        : "#777777",
                  },
                },
              }}
            >
              {/* Right Section Tabs and Action Buttons (existing structure) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  mb: 3,
                }}
              >
                {/* Left side content - can be empty or add tabs here in the future */}
                <Box></Box>

                {/* Action Buttons - moved to the right */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Box sx={{ position: "relative" }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSummarize()}
                      disabled={
                        isSummarizing || // Always disable if any summary is running
                        (isPDF
                          ? !pdfText || pdfSummaryLoading // For PDF: disable if no text OR PDF summary is loading
                          : transcriptLoading ||
                            translatedSegments.length === 0) // For Video: disable if transcript loading OR no segments
                      }
                      sx={{
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        background:
                          "linear-gradient(90deg, #2e83fb 0%, #9867ff 100%)",
                        borderRadius: "8px", // Using 8px as approximate for var(--base-card-border-radius)
                        border: "none",
                        color: "#FFFFFF",
                        px: 2,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        "&:hover": {
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        },
                        textTransform: "none",
                      }}
                      endIcon={
                        <Box
                          component="span"
                          onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                            e.stopPropagation();
                            handleSummaryMenuOpen(e);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            pl: 0.5,
                            cursor: "pointer",
                            "&:hover": {
                              opacity: 0.8,
                            },
                          }}
                        >
                          <ArrowDropDownIcon fontSize="small" />
                        </Box>
                      }
                    >
                      {isSummarizing ? (
                        <CircularProgress
                          size={16}
                          sx={{ color: "#FFFFFF", mr: 1 }}
                        />
                      ) : (
                        <AutoFixHighIcon sx={{ fontSize: "0.9rem", mr: 0.5 }} />
                      )}
                      {isSummarizing ? "Summarizing..." : "Summarize"}
                    </Button>

                    {/* Summary Options Menu */}
                    <Menu
                      anchorEl={summaryMenuAnchorEl}
                      open={Boolean(summaryMenuAnchorEl)}
                      onClose={handleSummaryMenuClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        elevation: 3,
                        sx: {
                          mt: 0.5,
                          minWidth: 280,
                          maxHeight: 400,
                          borderRadius: 1,
                          overflow: "auto",
                          padding: "4px 0",
                          boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
                          "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: -5,
                            right: 10,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "rotate(45deg)",
                            zIndex: 0,
                          },
                        },
                      }}
                    >
                      <MenuItem
                        onClick={handleCustomPrompt}
                        sx={{
                          py: 1.2,
                          pl: 2,
                          borderRadius: "4px",
                          mx: 0.5,
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <AddIcon
                          fontSize="small"
                          sx={{ mr: 1.5, color: theme.palette.primary.main }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Add Custom Prompt
                        </Typography>
                      </MenuItem>

                      <Divider sx={{ my: 1 }} />

                      {/* General Summaries */}
                      <ListSubheader
                        sx={{
                          bgcolor: "transparent",
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          lineHeight: "1.5",
                          px: 2,
                        }}
                      >
                        General Summaries
                      </ListSubheader>

                      {templates.map((template) => (
                        <MenuItem
                          key={template.type}
                          onClick={() => handleSummaryTemplate(template.type)}
                          sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                        >
                          {template.title}
                        </MenuItem>
                      ))}

                      <Divider sx={{ my: 1 }} />

                      {/* Business & Finance */}
                      <ListSubheader
                        sx={{
                          bgcolor: "transparent",
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          lineHeight: "1.5",
                          px: 2,
                        }}
                      >
                        Business & Finance
                      </ListSubheader>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("industry")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Industry & Market Analysis
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("financial")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Financial Summary
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("annual-report")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Annual Report Summary
                      </MenuItem>

                      <Divider sx={{ my: 1 }} />

                      {/* Legal & Documentation */}
                      <ListSubheader
                        sx={{
                          bgcolor: "transparent",
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          lineHeight: "1.5",
                          px: 2,
                        }}
                      >
                        Legal & Documentation
                      </ListSubheader>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("legal")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Legal Document Summary
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("contract")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Contract Analysis
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("meeting")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Meeting Minutes
                      </MenuItem>

                      <Divider sx={{ my: 1 }} />

                      {/* Content Creation */}
                      <ListSubheader
                        sx={{
                          bgcolor: "transparent",
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          lineHeight: "1.5",
                          px: 2,
                        }}
                      >
                        Content Creation
                      </ListSubheader>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("essay")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Academic Essay Resource
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("blog")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Blog Post Draft
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("flashcards")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Study Flashcards
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleSummaryTemplate("podcast")}
                        sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                      >
                        Podcast Script
                      </MenuItem>
                    </Menu>

                    {/* Custom Prompt Dialog */}
                    {showCustomPromptInput && (
                      <Paper
                        elevation={4}
                        sx={{
                          position: "absolute",
                          top: "40px",
                          right: 0,
                          zIndex: 1200,
                          width: "320px",
                          p: 2.5,
                          borderRadius: 2,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            display: "flex",
                            alignItems: "center",
                            color: theme.palette.primary.main,
                          }}
                        >
                          <MessageIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
                          Create Custom Prompt
                        </Typography>

                        {/* Title Input */}
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, mb: 0.5, display: "block" }}
                        >
                          Title
                        </Typography>
                        <input
                          type="text"
                          value={customPromptTitle}
                          onChange={(e) => setCustomPromptTitle(e.target.value)}
                          placeholder="Enter a title for your summary..."
                          style={{
                            width: "100%",
                            padding: "10px",
                            marginBottom: "12px",
                            borderRadius: "6px",
                            border: `1px solid ${theme.palette.divider}`,
                            fontFamily: "inherit",
                            fontSize: "0.9rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                          }}
                        />

                        {/* Prompt Input */}
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, mb: 0.5, display: "block" }}
                        >
                          Prompt
                        </Typography>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Example: Explain this video as if I'm 10 years old, or focus on the technical aspects only..."
                          style={{
                            width: "100%",
                            padding: "12px",
                            marginBottom: "16px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.palette.divider}`,
                            minHeight: "100px",
                            resize: "vertical",
                            fontFamily: "inherit",
                            fontSize: "0.9rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                          }}
                        />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1.5,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={handleCancelCustomPrompt}
                            sx={{
                              textTransform: "none",
                              px: 2.5,
                              py: 0.8,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleSubmitCustomPrompt}
                            sx={{
                              textTransform: "none",
                              px: 2.5,
                              py: 0.8,
                              background:
                                "linear-gradient(90deg, #2e83fb 0%, #9867ff 100%)",
                              boxShadow: "0 2px 8px rgba(46, 131, 251, 0.25)",
                            }}
                          >
                            Submit
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  {/* AI Flash Card Button */}
                  <Tooltip title="AI Flash Cards">
                    <IconButton
                      size="small"
                      onClick={() => handleSummaryTemplate("quiz-flashcards")}
                      disabled={
                        isSummarizing || // Always disable if any summary is running
                        (isPDF
                          ? !pdfText || pdfSummaryLoading // For PDF: disable if no text OR PDF summary is loading
                          : transcriptLoading ||
                            translatedSegments.length === 0) // For Video: disable if transcript loading OR no segments
                      }
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
                      <SchoolIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Add Notes">
                    <IconButton
                      size="small"
                      onClick={handleAddNote}
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
                      <AddIcon sx={{ marginRight: "1.25rem" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Summary and Highlights */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Default Summary Card - always show this one first */}
                <Paper
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

                {/* Additional Summary Cards - only show non-default templates */}
                {summaryCards
                  .filter((card) => card.type !== "default")
                  .map((card) => (
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
                            theme.palette.mode === "light"
                              ? "#F3F4F6"
                              : "#2a2a3a",
                          borderRadius: "3px",
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
                      {editingCardId === card.id ? (
                        <Box sx={{ p: 2 }}>
                          <TextField
                            fullWidth
                            label="Title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            variant="outlined"
                            margin="normal"
                            size="small"
                          />
                          <TextField
                            fullWidth
                            label="Custom Prompt (optional)"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            variant="outlined"
                            margin="normal"
                            size="small"
                            multiline
                            rows={3}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              mt: 2,
                              gap: 1,
                            }}
                          >
                            <Button onClick={handleCancelCardEdit} size="small">
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveCardEdit}
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
                        <Box
                          sx={{
                            padding: "0.1rem 0.5rem 0.1rem 0.5rem",
                            position: "relative",
                            minHeight: "200px",
                            paddingBottom: "60px",
                            "& p": { margin: "0.75em 0" },
                            "& ul": {
                              paddingLeft: "1.5em",
                              margin: "0.75em 0",
                            },
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
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {card.title}
                          </Typography>

                          {card.type === "quiz-flashcards" &&
                          card.flashcards ? (
                            // Render flashcard carousel for quiz cards
                            <Box sx={{ mb: 4 }}>
                              <FlashcardCarousel
                                cards={card.flashcards}
                                title={card.title}
                              />
                            </Box>
                          ) : (
                            // Regular markdown content for other types
                            <Box sx={{ mb: 4 }}>
                              <ReactMarkdown>{card.content}</ReactMarkdown>
                            </Box>
                          )}

                          {/* Action Buttons */}
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
                            {card.type === "quiz-flashcards" ? (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // Copy all flashcards to clipboard
                                    const flashcardsText = card.flashcards
                                      ?.map(
                                        (fc) =>
                                          `Question: ${fc.question}\nAnswer: ${fc.answer}\nDifficulty: ${fc.difficulty}\nCategory: ${fc.category}\n`
                                      )
                                      .join("\n");
                                    navigator.clipboard.writeText(
                                      flashcardsText || ""
                                    );
                                    setShowCopyAlert(true);
                                  }}
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
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      // Dynamically import pptxgenjs only on client
                                      const pptxgen = (await import("pptxgenjs")).default;
                                      // Create a new presentation
                                      const pres = new pptxgen();
                                      // Set presentation properties
                                      pres.layout = "LAYOUT_16x9";
                                      pres.author = "NoteGPT";
                                      pres.title = card.title || "Flash Cards";

                                      // Add title slide
                                      let slide = pres.addSlide();
                                      slide.background = { color: "FFFFFF" };
                                      slide.addText(
                                        card.title || "Flash Cards",
                                        {
                                          x: 0.5,
                                          y: 1.5,
                                          w: "90%",
                                          h: 1.5,
                                          fontSize: 44,
                                          color: "363636",
                                          bold: true,
                                          align: "center",
                                          fontFace: "Arial",
                                        }
                                      );

                                      // Add each flashcard (question and answer slides)
                                      card.flashcards?.forEach((fc, idx) => {
                                        // Question slide
                                        slide = pres.addSlide();
                                        slide.background = { color: "FFFFFF" };

                                        // Card number
                                        slide.addText(`Card ${idx + 1}`, {
                                          x: 0.5,
                                          y: 0.25,
                                          w: 2,
                                          h: 0.5,
                                          fontSize: 14,
                                          color: "666666",
                                          fontFace: "Arial",
                                        });

                                        // Difficulty badge
                                        slide.addText(
                                          fc.difficulty.toUpperCase(),
                                          {
                                            x: 0.5,
                                            y: 0.5,
                                            w: 1.5,
                                            h: 0.4,
                                            fontSize: 12,
                                            color: "FFFFFF",
                                            fill: {
                                              color: getDifficultyColor(
                                                fc.difficulty
                                              ).replace("#", ""),
                                            },
                                            align: "center",
                                            fontFace: "Arial",
                                            bold: true,
                                          }
                                        );

                                        // Category badge
                                        slide.addText(fc.category, {
                                          x: 2.2,
                                          y: 0.5,
                                          w: 2,
                                          h: 0.4,
                                          fontSize: 12,
                                          color: "FFFFFF",
                                          fill: { color: "2196F3" },
                                          align: "center",
                                          fontFace: "Arial",
                                        });

                                        // Question label
                                        slide.addText("Question", {
                                          x: 0.5,
                                          y: 1.2,
                                          w: "90%",
                                          h: 0.6,
                                          fontSize: 28,
                                          color: "363636",
                                          bold: true,
                                          align: "center",
                                          fontFace: "Arial",
                                        });

                                        // Question text
                                        slide.addText(fc.question, {
                                          x: 0.5,
                                          y: 2,
                                          w: "90%",
                                          h: 2,
                                          fontSize: 20,
                                          color: "363636",
                                          align: "center",
                                          fontFace: "Arial",
                                          breakLine: true,
                                        });

                                        // Answer slide
                                        slide = pres.addSlide();
                                        slide.background = { color: "FFFFFF" };

                                        // Card number
                                        slide.addText(`Card ${idx + 1}`, {
                                          x: 0.5,
                                          y: 0.25,
                                          w: 2,
                                          h: 0.5,
                                          fontSize: 14,
                                          color: "666666",
                                          fontFace: "Arial",
                                        });

                                        // Difficulty badge
                                        slide.addText(
                                          fc.difficulty.toUpperCase(),
                                          {
                                            x: 0.5,
                                            y: 0.5,
                                            w: 1.5,
                                            h: 0.4,
                                            fontSize: 12,
                                            color: "FFFFFF",
                                            fill: {
                                              color: getDifficultyColor(
                                                fc.difficulty
                                              ).replace("#", ""),
                                            },
                                            align: "center",
                                            fontFace: "Arial",
                                            bold: true,
                                          }
                                        );

                                        // Category badge
                                        slide.addText(fc.category, {
                                          x: 2.2,
                                          y: 0.5,
                                          w: 2,
                                          h: 0.4,
                                          fontSize: 12,
                                          color: "FFFFFF",
                                          fill: { color: "2196F3" },
                                          align: "center",
                                          fontFace: "Arial",
                                        });

                                        // Answer label
                                        slide.addText("Answer", {
                                          x: 0.5,
                                          y: 1.2,
                                          w: "90%",
                                          h: 0.6,
                                          fontSize: 28,
                                          color: "2196F3",
                                          bold: true,
                                          align: "center",
                                          fontFace: "Arial",
                                        });

                                        // Answer text
                                        slide.addText(fc.answer, {
                                          x: 0.5,
                                          y: 2,
                                          w: "90%",
                                          h: 2,
                                          fontSize: 20,
                                          color: "363636",
                                          align: "center",
                                          fontFace: "Arial",
                                          breakLine: true,
                                        });
                                      });

                                      // Save the presentation
                                      await pres.writeFile({
                                        fileName: `${
                                          card.title || "flashcards"
                                        }.pptx`,
                                      });
                                    } catch (error) {
                                      console.error(
                                        "Error generating PPTX:",
                                        error
                                      );
                                    }
                                  }}
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
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
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
                                onClick={() => handleEditSummaryCard(card.id)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
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
                              onClick={() => handleDeleteSummaryCard(card.id)}
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
                            {card.type === "quiz-flashcards"
                              ? "AI Flash Cards"
                              : card.title}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}

                {/* Show loading indicator for additional summaries */}
                {isSummarizing &&
                  summaryCards.some((card) => card.type !== "default") && (
                    <Paper
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 2,
                        bgcolor: theme.palette.background.paper,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          py: 4,
                        }}
                      >
                        <CircularProgress size={20} sx={{ mb: 1 }} />
                        <Typography variant="body1">
                          Generating additional summary...
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                {/* Note Cards */}
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
                          theme.palette.mode === "light"
                            ? "#F3F4F6"
                            : "#2a2a3a",
                        borderRadius: "3px",
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
                          onChange={(e) =>
                            setEditingNoteContent(e.target.value)
                          }
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
                          {/* Conditionally render timestamp ONLY for videos */}
                          {!isPDF && (
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
                          )}
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
              </Box>
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

      {/* Add error display */}
      {templateError && (
        <Snackbar
          open={!!templateError}
          autoHideDuration={6000}
          onClose={() => setTemplateError(null)}
        >
          <Alert severity="error" onClose={() => setTemplateError(null)}>
            {templateError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
