"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";

// Define types for our application state
export interface VideoSummary {
  id: string;
  title: string;
  url: string;
  date: string;
}

export interface UserNote {
  id: string;
  videoId: string;
  content: string;
  date: string;
}

interface AppContextType {
  // User history and data
  recentVideos: VideoSummary[];
  savedNotes: UserNote[];

  // App state
  language: string;

  // Actions
  addVideoToHistory: (video: VideoSummary) => void;
  saveNote: (note: UserNote) => void;
  deleteNote: (noteId: string) => void;
  setLanguage: (lang: string) => void;
}

// Default development video
const DEFAULT_VIDEO_ID = "c3wu0dUNd4c";
const DEFAULT_VIDEO: VideoSummary = {
  id: DEFAULT_VIDEO_ID,
  title: "How Computers Add Numbers - Adders in Digital Electronics",
  url: `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`,
  date: new Date().toISOString(),
};

// Default note for the video
const DEFAULT_NOTE: UserNote = {
  id: uuidv4(),
  videoId: DEFAULT_VIDEO_ID,
  content:
    "This is a sample note for development purposes. The video explains how computers perform addition operations using digital logic circuits.",
  date: new Date().toISOString(),
};

// Create context with default values
const AppContext = createContext<AppContextType>({
  recentVideos: [],
  savedNotes: [],
  language: "en",
  addVideoToHistory: () => {},
  saveNote: () => {},
  deleteNote: () => {},
  setLanguage: () => {},
});

// Hook for easy context consumption
export const useAppContext = () => useContext(AppContext);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state with default data for development
  const [recentVideos, setRecentVideos] = useState<VideoSummary[]>([
    DEFAULT_VIDEO,
  ]);
  const [savedNotes, setSavedNotes] = useState<UserNote[]>([DEFAULT_NOTE]);
  const [language, setLanguage] = useState("en");

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedVideos = localStorage.getItem("noteGPT_recentVideos");
      const storedNotes = localStorage.getItem("noteGPT_savedNotes");
      const storedLanguage = localStorage.getItem("noteGPT_language");

      // Only use stored data if it exists, otherwise keep the defaults
      if (storedVideos) {
        const parsedVideos = JSON.parse(storedVideos) as VideoSummary[];
        // Ensure our default video is always included
        if (!parsedVideos.some((v) => v.id === DEFAULT_VIDEO_ID)) {
          parsedVideos.unshift(DEFAULT_VIDEO);
        }
        setRecentVideos(parsedVideos);
      }

      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes) as UserNote[];
        // Ensure our default note is always included
        if (!parsedNotes.some((n) => n.videoId === DEFAULT_VIDEO_ID)) {
          parsedNotes.unshift(DEFAULT_NOTE);
        }
        setSavedNotes(parsedNotes);
      }

      if (storedLanguage) setLanguage(storedLanguage);
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("noteGPT_recentVideos", JSON.stringify(recentVideos));
  }, [recentVideos]);

  useEffect(() => {
    localStorage.setItem("noteGPT_savedNotes", JSON.stringify(savedNotes));
  }, [savedNotes]);

  useEffect(() => {
    localStorage.setItem("noteGPT_language", language);
  }, [language]);

  // Action functions
  const addVideoToHistory = (video: VideoSummary) => {
    setRecentVideos((prev) => {
      // Remove any existing entries with the same ID
      const filtered = prev.filter((v) => v.id !== video.id);
      // Add new video at the beginning of the array (most recent)
      return [video, ...filtered.slice(0, 19)]; // Keep only the 20 most recent
    });
  };

  const saveNote = (note: UserNote) => {
    setSavedNotes((prev) => {
      // If editing an existing note, remove the old version
      const filtered = prev.filter((n) => n.id !== note.id);
      // Add the new/updated note
      return [note, ...filtered];
    });
  };

  const deleteNote = (noteId: string) => {
    setSavedNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  // Context value
  const contextValue: AppContextType = {
    recentVideos,
    savedNotes,
    language,
    addVideoToHistory,
    saveNote,
    deleteNote,
    setLanguage,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
