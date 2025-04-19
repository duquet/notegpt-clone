"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
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
import dbService from "@/utils/dbService";

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
  const videoId = (params.id as string) || "";
  const { recentVideos, updateVideoTitle } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [rightTabValue, setRightTabValue] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Loading...");
  const [videoUrl, setVideoUrl] = useState<string>("");
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
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
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
    }>
  >([]);
  const [flashcardSets, setFlashcardSets] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      flashcards: Array<{
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

  // Add flags to track loading state
  const contentLoadedRef = useRef(false);
  const transcriptLoadedRef = useRef(false);
  const playerInitializedRef = useRef(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const playerCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Fetch video details on component mount
  useEffect(() => {
    if (videoId && !contentLoadedRef.current) {
      contentLoadedRef.current = true;
      fetchVideoDetails();

      // Load stored summaries and flashcards from the database
      loadStoredContent(videoId);
    }

    // Cleanup function
    return () => {
      // Reset flags when component unmounts
      contentLoadedRef.current = false;
      transcriptLoadedRef.current = false;
      playerInitializedRef.current = false;

      // Clear any intervals
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
      }
    };
  }, [videoId]);

  // Function to load stored content from database
  const loadStoredContent = async (videoId: string) => {
    // Check if content has already been loaded
    if (contentLoadedRef.current) {
      console.log("Content already loaded, skipping database fetch");
      return;
    }

    try {
      // Load summaries from database using the API service
      const summaries = await dbService.summaries.getByVideoId(videoId);

      // Load flashcard sets from database using the API service
      const flashcardSets = await dbService.flashcards.getSetsByVideoId(
        videoId
      );

      if (summaries.length > 0 || flashcardSets.length > 0) {
        console.log("Found stored content:", { summaries, flashcardSets });

        // Mark content as loaded to prevent further fetches
        contentLoadedRef.current = true;

        // Make sure loading state is reset when we have content
        setIsSummarizing(false);

        // Process summaries
        summaries.forEach((summary) => {
          if (summary.type === "default") {
            // For default summary, update the main content
            setMarkdownContent(summary.content);

            // Parse the result to separate sections
            const sections = parseSummaryResponse(summary.content);

            // Update state
            setSummaryContent(sections.summary);
            setKeyInsightsContent(sections.keyInsights);
            setHighlightsContent(sections.highlights);
            setConclusionContent(sections.conclusion);

            // Add to summaryCards if not already there
            if (!summaryCards.some((card) => card.type === "default")) {
              setSummaryCards((prevCards) => [
                {
                  id: `summary-${summary.id}`,
                  title: summary.title,
                  content: summary.content,
                  type: "default",
                },
                ...prevCards,
              ]);
            }
          } else {
            // For non-default templates, add a card
            setSummaryCards((prevCards) => {
              // Check if this summary type already exists in the cards
              if (!prevCards.some((card) => card.type === summary.type)) {
                return [
                  ...prevCards,
                  {
                    id: `summary-${summary.id}`,
                    title: summary.title,
                    content: summary.content,
                    type: summary.type,
                  },
                ];
              }
              return prevCards;
            });
          }
        });

        // Process flashcard sets - now using separate state
        flashcardSets.forEach((set) => {
          if (set.flashcards && set.flashcards.length > 0) {
            // Convert Flashcard[] to FlashCardProps[]
            const flashcardProps = set.flashcards.map((card) => ({
              question: card.question,
              answer: card.answer,
              difficulty: card.difficulty || "medium",
              category: card.category || "General",
            }));

            // Add to flashcardSets if not already there
            setFlashcardSets((prevSets) => {
              // Check if this flashcard set already exists
              if (
                !prevSets.some((existingSet) => existingSet.id === `${set.id}`)
              ) {
                return [
                  ...prevSets,
                  {
                    id: `${set.id}`,
                    title: set.title,
                    content: JSON.stringify(flashcardProps),
                    flashcards: flashcardProps,
                  },
                ];
              }
              return prevSets;
            });
          }
        });
      }
    } catch (error) {
      console.error("Error loading stored content:", error);
      // Continue without stored content
    }
  };

  const fetchVideoDetails = async () => {
    // First try to get from recent videos history
    const recentVideo = recentVideos.find((v) => v.id === videoId);
    if (recentVideo) {
      setVideoTitle(recentVideo.title);
      setVideoUrl(recentVideo.url || "");
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

    // Fetch transcript - we're keeping this call to maintain functionality
    fetchTranscript();
  };

  const fetchTranscript = async () => {
    if (transcriptLoadedRef.current) {
      console.log("Transcript already loaded, skipping fetch");
      return;
    }

    setTranscriptLoading(true);
    try {
      // First, try to retrieve transcript from database
      console.log("Checking for stored transcript in database...");
      let storedTranscript = null;

      try {
        storedTranscript = await dbService.transcripts.getByVideoId(videoId);
      } catch (dbError) {
        console.error("Error fetching transcript from database:", dbError);
        // Continue to API fetch if database fetch fails
      }

      if (storedTranscript && storedTranscript.content) {
        console.log("Found stored transcript in database");
        // Use stored transcript
        const segments = createTranscriptSegments(storedTranscript.content);
        setTranscriptSegments(segments);

        // Also set the translated segments for use later
        setTranslatedSegments(segments);

        // We're setting transcriptLoading to false, but NOT marking transcript as fully loaded yet
        // This allows the player to recalculate segments with the correct duration
        setTranscriptLoading(false);
        return;
      }

      // If no stored transcript, fetch from API
      console.log("No stored transcript found, fetching from API...");
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      try {
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
            // Split transcript into segments
            const segments = createTranscriptSegments(data.transcript);
            setTranscriptSegments(segments);

            // Also set the translated segments for use later
            setTranslatedSegments(segments);

            // Save transcript to database for future use
            try {
              console.log("Saving transcript to database...");
              await dbService.transcripts.save({
                videoId: videoId,
                videoTitle: videoTitle,
                videoUrl: videoUrl,
                content: data.transcript,
              });
              console.log("Transcript saved to database");
            } catch (saveError) {
              console.error(
                "Failed to save transcript to database:",
                saveError
              );
              // We can continue even if saving fails
            }
          } else {
            console.error("No transcript in API response:", data);
            // If no transcript, create a placeholder
            const placeholderSegment = {
              startTime: 0,
              endTime: 30,
              text: "No transcript available for this video.",
            };
            setTranscriptSegments([placeholderSegment]);
            setTranslatedSegments([placeholderSegment]);
          }
        } else {
          console.error(
            "API error response:",
            response.status,
            response.statusText
          );
          const errorSegment = {
            startTime: 0,
            endTime: 30,
            text: `Failed to load transcript. API returned error: ${response.status} ${response.statusText}`,
          };
          setTranscriptSegments([errorSegment]);
          setTranslatedSegments([errorSegment]);
        }
      } catch (apiError) {
        console.error("API fetch error:", apiError);
        const errorSegment = {
          startTime: 0,
          endTime: 30,
          text: `Error connecting to transcript API: ${
            apiError instanceof Error ? apiError.message : "Unknown error"
          }`,
        };
        setTranscriptSegments([errorSegment]);
        setTranslatedSegments([errorSegment]);
      }
    } catch (error) {
      console.error("Error in transcript fetch process:", error);
      const errorSegment = {
        startTime: 0,
        endTime: 30,
        text: `Error fetching transcript: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
      setTranscriptSegments([errorSegment]);
      setTranslatedSegments([errorSegment]);
    } finally {
      setTranscriptLoading(false);
    }
  };

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

  // Update the useEffect that sets up time tracking
  useEffect(() => {
    if (loading || transcriptSegments.length === 0) {
      return;
    }

    // Set up timer to check video progress
    const startTimeTracking = () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
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

      console.log("Time tracking interval started");
    };

    // Start tracking if player is ready
    if (playerRef.current && playerInitializedRef.current) {
      console.log("Starting time tracking with initialized player");
      startTimeTracking();
    } else {
      console.log("Player not ready yet for time tracking");
    }

    return () => {
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
        console.log("Time tracking interval cleaned up");
      }
    };
  }, [
    loading,
    transcriptSegments,
    playerRef.current,
    playerInitializedRef.current,
  ]);

  // Improve the handleReady function to ensure proper initialization
  const handleReady = (event: YouTubeEvent) => {
    console.log("YouTube player ready event received");

    playerRef.current = event.target;
    playerInitializedRef.current = true;
    console.log("YouTube player initialized");

    // Start time tracking now that player is ready
    if (playerCheckInterval.current) {
      clearInterval(playerCheckInterval.current);
      playerCheckInterval.current = null;
    }

    playerCheckInterval.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (!isNaN(currentTime)) {
            setCurrentVideoTime(currentTime);
          }
        } catch (e) {
          console.error("Error getting current time from player:", e);
        }
      }
    }, 500);
    console.log("Time tracking started from player ready handler");

    // Get duration if available
    try {
      const duration = playerRef.current.getDuration();
      if (duration && !isNaN(duration)) {
        setVideoDuration(duration);
        console.log("Video duration:", duration);

        // Now that we have the actual duration, recreate transcript segments
        if (transcriptSegments.length > 0) {
          // Make a copy of the original segments
          const originalSegments = [...transcriptSegments];

          // Get the full text
          const fullText = originalSegments
            .map((segment) => segment.text)
            .join(" ");

          // Recreate segments with accurate duration
          const fixedSegments = createTranscriptSegments(fullText, duration);

          // Only update if the segments are different
          if (
            fixedSegments.length !== transcriptSegments.length ||
            fixedSegments.some(
              (seg, i) =>
                seg.startTime !== transcriptSegments[i]?.startTime ||
                seg.endTime !== transcriptSegments[i]?.endTime
            )
          ) {
            setTranscriptSegments(fixedSegments);
            setTranslatedSegments(fixedSegments);
            console.log("Updated segments with duration:", fixedSegments);
          }
        }
      }
    } catch (e) {
      console.error("Error getting duration:", e);
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

  // Fix the handleSegmentClick function to handle null player safely
  const handleSegmentClick = (startTime: number) => {
    console.log("Segment click at time:", startTime);

    // Enhanced check for player availability and readiness
    if (playerRef.current && playerInitializedRef.current) {
      try {
        playerRef.current.seekTo(startTime, true);
        console.log("Successfully seeked to:", startTime);

        // Update highlighted segment immediately
        const segmentIndex = transcriptSegments.findIndex(
          (segment) => segment.startTime === startTime
        );
        if (segmentIndex !== -1) {
          setCurrentSegmentIndex(segmentIndex);
          setCurrentVideoTime(startTime);
        }
      } catch (error) {
        console.error("Error seeking to timestamp:", error);
      }
    } else {
      console.warn("YouTube player not ready yet for seeking");
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
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle duration change effect - optimize recreating segments when duration is detected
  useEffect(() => {
    if (!videoDuration) return;

    console.log("Running duration effect with duration:", videoDuration);

    // Only recreate segments if we have both duration and segments
    if (videoDuration > 0 && transcriptSegments.length > 0) {
      // Don't recreate segments if they're just placeholder error messages
      const isErrorMessage =
        transcriptSegments[0].text.includes("No transcript") ||
        transcriptSegments[0].text.includes("Failed to load") ||
        transcriptSegments[0].text.includes("Error fetching");

      if (!isErrorMessage) {
        // Get the full text by joining all segments
        const fullText = transcriptSegments
          .map((segment) => segment.text)
          .join(" ");

        // Recreate segments with accurate duration
        const updatedSegments = createTranscriptSegments(
          fullText,
          videoDuration
        );
        console.log(
          "Recreated segments with accurate duration:",
          updatedSegments
        );

        // Update both transcript sets
        setTranscriptSegments(updatedSegments);
        setTranslatedSegments(updatedSegments);

        // Now we can mark transcript as fully loaded
        transcriptLoadedRef.current = true;
      }
    }
  }, [videoDuration]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear any intervals
      if (playerCheckInterval.current) {
        clearInterval(playerCheckInterval.current);
        playerCheckInterval.current = null;
      }
    };
  }, []);

  // Add a function to scroll to the current segment
  const scrollToCurrentSegment = () => {
    if (!transcriptRef.current || currentSegmentIndex === -1) return;

    const segmentElement = transcriptRef.current.querySelector(
      `[data-segment-index="${currentSegmentIndex}"]`
    );
    if (segmentElement) {
      segmentElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
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
      a.download = `transcript-${videoId}-${selectedLanguage.code}.${
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
    // Only try to summarize once we have transcript segments and they're not loading
    if (
      translatedSegments.length > 0 &&
      !transcriptLoading &&
      !isSummarizing &&
      !markdownContent
    ) {
      // Automatically generate the summary
      handleSummarize();
    }
  }, [translatedSegments, transcriptLoading, isSummarizing, markdownContent]);

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
    if (isSummarizing) {
      console.log("Already generating a summary, please wait...");
      return;
    }

    setIsSummarizing(true);

    try {
      // Get full transcript text
      const fullTranscript = translatedSegments
        .map((segment) => segment.text)
        .join(" ");

      // First, check if we already have this summary type in the database
      let existingSummary = null;
      let existingFlashcards = null;

      try {
        // Check for existing summary
        if (templateType !== "quiz-flashcards") {
          existingSummary = await dbService.summaries.getByType(
            videoId,
            templateType
          );
        } else {
          // Check for existing flashcards
          const existingSets = await dbService.flashcards.getSetsByVideoId(
            videoId
          );
          existingFlashcards = existingSets.find(
            (set) => set.title === (title || "AI Flash Cards")
          );
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue with generation even if database check fails
      }

      // If we already have this summary or flashcard set, use it instead of generating a new one
      if (existingSummary) {
        console.log("Using existing summary from database:", existingSummary);

        if (templateType === "default") {
          // For default summary, update the main summary content
          setMarkdownContent(existingSummary.content);

          // Parse the result to separate sections
          const sections = parseSummaryResponse(
            existingSummary.content,
            templateType
          );

          // Update state with the content sections for default summary
          setSummaryContent(sections.summary);
          setKeyInsightsContent(sections.keyInsights);
          setHighlightsContent(sections.highlights);
          setConclusionContent(sections.conclusion);

          // Also add to summaryCards if not already there
          if (!summaryCards.some((card) => card.type === "default")) {
            setSummaryCards((prevCards) => [
              {
                id: `summary-${existingSummary.id}`,
                title: existingSummary.title,
                content: existingSummary.content,
                type: "default",
              },
              ...prevCards,
            ]);
          }
        } else {
          // For non-default templates, add a new card if not already there
          if (!summaryCards.some((card) => card.type === templateType)) {
            setSummaryCards((prevCards) => [
              ...prevCards,
              {
                id: `summary-${existingSummary.id}`,
                title: existingSummary.title,
                content: existingSummary.content,
                type: templateType,
              },
            ]);
          }
        }

        setIsSummarizing(false);
        return;
      }

      // If we have existing flashcards, use them
      if (existingFlashcards && templateType === "quiz-flashcards") {
        console.log(
          "Using existing flashcards from database:",
          existingFlashcards
        );

        // Convert to the format expected by the UI
        const flashcardProps =
          existingFlashcards.flashcards?.map((card) => ({
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || "medium",
            category: card.category || "General",
          })) || [];

        // Add to summaryCards if not already there
        if (
          !summaryCards.some(
            (card) => card.id === `flashcards-${existingFlashcards.id}`
          )
        ) {
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: `flashcards-${existingFlashcards.id}`,
              title: existingFlashcards.title,
              content: JSON.stringify(flashcardProps),
              type: "quiz-flashcards",
              flashcards: flashcardProps,
            },
          ]);
        }

        setIsSummarizing(false);
        return;
      }

      // No existing summary or flashcards found, generate a new one
      let result;

      // Special handling for quiz-flashcards to ensure we get proper JSON
      if (templateType === "quiz-flashcards") {
        // Use a specific structure that encourages JSON generation
        const quizPrompt = `Create an interactive quiz with flashcards based on this content. Generate 10-15 question-answer pairs that test understanding of the key concepts, facts, and insights. Return ONLY a valid JSON array with objects having this structure: { "question": "...", "answer": "...", "difficulty": "(easy|medium|hard)", "category": "..." }. Do NOT include markdown formatting or code blocks, just the raw JSON array: 
${fullTranscript}`;

        result = await summarizeTranscript(fullTranscript, {
          templateType: templateType,
          customPrompt: quizPrompt,
        });
      } else {
        // For regular summaries, use the template or custom prompt
        result = await summarizeTranscript(fullTranscript, {
          templateType: templateType,
          customPrompt: prompt,
        });
      }

      // Save the result to the database
      try {
        if (templateType === "default") {
          // For default summary, update the main summary content
          setMarkdownContent(result);

          // Parse the result to separate sections
          const sections = parseSummaryResponse(result);

          // Update state
          setSummaryContent(sections.summary);
          setKeyInsightsContent(sections.keyInsights);
          setHighlightsContent(sections.highlights);
          setConclusionContent(sections.conclusion);

          // Save to database
          const savedSummary = await dbService.summaries.save({
            videoId: videoId,
            videoTitle: videoTitle,
            videoUrl: videoUrl,
            summaryType: templateType,
            summaryTitle: "Summary",
            content: result,
          });

          // Also add to summaryCards if not already there
          if (!summaryCards.some((card) => card.type === "default")) {
            const cardId = `summary-${savedSummary?.id || Date.now()}`;
            setSummaryCards((prevCards) => [
              {
                id: cardId,
                title: "Summary",
                content: result,
                type: "default",
              },
              ...prevCards,
            ]);
          }
        } else if (templateType === "quiz-flashcards") {
          // Parse the JSON from the result
          const flashcards = parseSummaryResponse(result, templateType);
          console.log("Parsed flashcards:", flashcards);

          // Save flashcards to database
          const flashcardTitle = title || "AI Flash Cards";
          const savedFlashcardSet = await dbService.flashcards.saveSet({
            videoId: videoId,
            videoTitle: videoTitle,
            videoUrl: videoUrl,
            title: flashcardTitle,
            flashcards: flashcards.map((card) => ({
              question: card.question,
              answer: card.answer,
              difficulty: card.difficulty || "medium",
              category: card.category || "General",
            })),
          });

          // Add to UI
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: `flashcards-${savedFlashcardSet?.id || Date.now()}`,
              title: flashcardTitle,
              content: result,
              type: templateType,
              flashcards: flashcards,
            },
          ]);
        } else {
          // Regular non-default template
          // Save to database
          const savedSummary = await dbService.summaries.save({
            videoId: videoId,
            videoTitle: videoTitle,
            videoUrl: videoUrl,
            summaryType: templateType,
            summaryTitle: title || "Custom Summary",
            content: result,
          });

          // Add to UI
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: `summary-${savedSummary?.id || Date.now()}`,
              title: title || "Custom Summary",
              content: result,
              type: templateType,
            },
          ]);
        }
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continue with UI updates even if database save fails

        // Update UI without database IDs
        if (templateType === "default") {
          // Add to summaryCards if not already there
          if (!summaryCards.some((card) => card.type === "default")) {
            const cardId = `summary-${Date.now()}`;
            setSummaryCards((prevCards) => [
              {
                id: cardId,
                title: "Summary",
                content: result,
                type: "default",
              },
              ...prevCards,
            ]);
          }
        } else if (templateType === "quiz-flashcards") {
          const flashcards = parseSummaryResponse(result, templateType);
          const cardId = `summary-${Date.now()}`;
          setSummaryCards((prevCards) => [
            ...prevCards,
            {
              id: cardId,
              title: title || "AI Flash Cards",
              content: result,
              type: templateType,
              flashcards: flashcards,
            },
          ]);
        } else {
          const cardId = `summary-${Date.now()}`;
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

  // Function to generate flashcards directly without requiring summary generation
  const generateFlashcards = async () => {
    if (isGeneratingFlashcards) return;

    try {
      setIsGeneratingFlashcards(true);

      // Get video ID from params
      const videoId = params.id as string;

      // Get full transcript text
      const fullTranscript = translatedSegments
        .map((segment) => segment.text)
        .join(" ");

      // Check if we already have flashcards for this video
      try {
        // Try to fetch existing flashcard sets
        const existingSets = await dbService.flashcards.getSetsByVideoId(
          videoId
        );
        const existingFlashcards = existingSets.find(
          (set) => set.title === "AI Flash Cards"
        );

        if (
          existingFlashcards &&
          existingFlashcards.flashcards &&
          existingFlashcards.flashcards.length > 0
        ) {
          console.log("Using existing flashcards:", existingFlashcards);

          // Convert DB flashcards to the format expected by the UI
          const flashcardProps = existingFlashcards.flashcards.map((card) => ({
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || "medium",
            category: card.category || "General",
          }));

          // Add to flashcardSets state if not already there
          setFlashcardSets((prevSets) => {
            if (
              !prevSets.some((set) => set.id === `${existingFlashcards.id}`)
            ) {
              return [
                ...prevSets,
                {
                  id: `${existingFlashcards.id}`,
                  title: existingFlashcards.title,
                  content: JSON.stringify(flashcardProps),
                  flashcards: flashcardProps,
                },
              ];
            }
            return prevSets;
          });

          setIsGeneratingFlashcards(false);
          return;
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue with generation if database check fails
      }

      // Generate new flashcards
      const quizPrompt = `Create an interactive quiz with flashcards based on this content. Generate 10-15 question-answer pairs that test understanding of the key concepts, facts, and insights. Return ONLY a valid JSON array with objects having this structure: { "question": "...", "answer": "...", "difficulty": "(easy|medium|hard)", "category": "..." }. Do NOT include markdown formatting or code blocks, just the raw JSON array: 

${fullTranscript}`;

      // Call the OpenAI API to generate flashcards
      const result = await summarizeTranscript(fullTranscript, {
        templateType: "quiz-flashcards",
        customPrompt: quizPrompt,
      });

      // Parse the JSON result
      const flashcards = parseSummaryResponse(result, "quiz-flashcards");
      console.log("Generated flashcards:", flashcards);

      try {
        // Save to database using the client-side service
        const savedFlashcardSet = await dbService.flashcards.saveSet({
          videoId: videoId,
          videoTitle: videoTitle,
          videoUrl: videoUrl,
          title: "AI Flash Cards",
          flashcards: flashcards.map((card: any) => ({
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || "medium",
            category: card.category || "General",
          })),
        });

        // Add to flashcardSets state
        setFlashcardSets((prevSets) => [
          ...prevSets,
          {
            id: `${savedFlashcardSet?.id || Date.now()}`,
            title: "AI Flash Cards",
            content: result,
            flashcards: flashcards,
          },
        ]);
      } catch (dbError) {
        console.error("Error saving flashcards to database:", dbError);

        // Add to flashcardSets state even if database save fails
        const cardId = `${Date.now()}`;
        setFlashcardSets((prevSets) => [
          ...prevSets,
          {
            id: cardId,
            title: "AI Flash Cards",
            content: result,
            flashcards: flashcards,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Update the useEffect to check both summary cards and flashcard sets
  useEffect(() => {
    // Check if we have any saved content and reset loading state
    if (summaryCards.length > 0 || flashcardSets.length > 0) {
      console.log("Found existing content, resetting loading state");
      setIsSummarizing(false);
      setIsGeneratingFlashcards(false);
    }
  }, [summaryCards, flashcardSets]);

  // After the time tracking useEffect, add back the segment tracking useEffect
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
                videoId={videoId}
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
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
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
                  onClick={() => downloadTranscript("txt-with-timestamps")}
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
                    theme.palette.mode === "light" ? "#F3F4F6" : "#2a2a3a",
                  borderRadius: "3px",
                  margin: "2px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background:
                    theme.palette.mode === "light" ? "#D1D5DB" : "#4a4a5a",
                  borderRadius: "3px",
                  "&:hover": {
                    background:
                      theme.palette.mode === "light" ? "#9CA3AF" : "#5a5a6a",
                  },
                },
              }}
            >
              {transcriptLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
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
                            currentSegmentIndex === index ? "bold" : "normal",
                          fontSize: "0.875rem",
                        }}
                      >
                        {formatTime(segment.startTime)}
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
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              p: 2,
            }}
          >
            {/* Right Section Tabs */}
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
                      isSummarizing ||
                      transcriptLoading ||
                      transcriptSegments.length === 0
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

                    <MenuItem
                      onClick={() => handleSummaryTemplate("chapter")}
                      sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                    >
                      Chapter Summary
                    </MenuItem>

                    <MenuItem
                      onClick={() => handleSummaryTemplate("core-points")}
                      sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                    >
                      Core Points Summary
                    </MenuItem>

                    <MenuItem
                      onClick={() => handleSummaryTemplate("notes")}
                      sx={{ py: 0.8, px: 2, fontSize: "0.85rem" }}
                    >
                      AI Note
                    </MenuItem>

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
                    onClick={generateFlashcards}
                    disabled={
                      isGeneratingFlashcards ||
                      transcriptLoading ||
                      transcriptSegments.length === 0
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
                      theme.palette.mode === "light" ? "#D1D5DB" : "#4a4a5a",
                    borderRadius: "3px",
                    "&:hover": {
                      background:
                        theme.palette.mode === "light" ? "#9CA3AF" : "#5a5a6a",
                    },
                  },
                }}
              >
                {isSummarizing ? (
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
                      padding: "0.1rem 0.5rem 0.1rem 0.5rem", // Less padding on top, keep sides and bottom
                      position: "relative",
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
                        mt: 3, // Add top margin
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

                        {/* Regular markdown content for summaries */}
                        <ReactMarkdown>{card.content}</ReactMarkdown>

                        {/* Summary card action buttons */}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            display: "flex",
                            gap: 1,
                            mt: 3,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(card.content);
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
                            onClick={() => handleEditSummaryCard(card.id)}
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
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSummaryCard(card.id)}
                            sx={{
                              bgcolor: theme.palette.background.paper,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              color: theme.palette.error.main,
                              "&:hover": {
                                bgcolor: theme.palette.error.light,
                                color: "#fff",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                ))}

              {/* Flashcard Sets */}
              {flashcardSets.map((set) => (
                <Paper
                  key={set.id}
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
                  <Box
                    sx={{
                      padding: "0.1rem 0.5rem 0.1rem 0.5rem",
                      position: "relative",
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
                      {set.title}
                    </Typography>

                    {/* Render flashcard carousel */}
                    <FlashcardCarousel
                      cards={set.flashcards}
                      title={set.title}
                    />

                    {/* Flashcard Action Buttons */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        display: "flex",
                        gap: 1,
                        mt: 3,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          // Copy all flashcards to clipboard
                          const flashcardsText = set.flashcards
                            ?.map(
                              (fc) =>
                                `Question: ${fc.question}\nAnswer: ${fc.answer}\nDifficulty: ${fc.difficulty}\nCategory: ${fc.category}\n`
                            )
                            .join("\n");
                          navigator.clipboard.writeText(flashcardsText || "");
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
                            // Create a new presentation
                            const pres = new pptxgen();

                            // Set presentation properties
                            pres.layout = "LAYOUT_16x9";
                            pres.author = "NoteGPT";
                            pres.title = set.title || "Flash Cards";

                            // Add title slide
                            let slide = pres.addSlide();
                            slide.background = { color: "FFFFFF" };
                            slide.addText(set.title || "Flash Cards", {
                              x: 0.5,
                              y: 1.5,
                              w: "90%",
                              h: 1.5,
                              fontSize: 44,
                              color: "363636",
                              bold: true,
                              align: "center",
                              fontFace: "Arial",
                            });

                            // Add each flashcard
                            set.flashcards?.forEach((fc, idx) => {
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
                              slide.addText(fc.difficulty.toUpperCase(), {
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
                              });

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
                              slide.addText(fc.difficulty.toUpperCase(), {
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
                              });

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
                              fileName: `${set.title || "flashcards"}.pptx`,
                            });
                          } catch (error) {
                            console.error("Error creating PPTX:", error);
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
                      <IconButton
                        size="small"
                        onClick={() => {
                          // Delete flashcard set
                          setFlashcardSets((prevSets) =>
                            prevSets.filter((s) => s.id !== set.id)
                          );
                        }}
                        sx={{
                          bgcolor: theme.palette.background.paper,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          color: theme.palette.error.main,
                          "&:hover": {
                            bgcolor: theme.palette.error.light,
                            color: "#fff",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
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
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography variant="body1">
                        Generating additional summary...
                      </Typography>
                    </Box>
                  </Paper>
                )}
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
          Transcript copied to clipboard
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
    </Box>
  );
}
