"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  // Initialize state
  const [recentVideos, setRecentVideos] = useState<VideoSummary[]>([]);
  const [savedNotes, setSavedNotes] = useState<UserNote[]>([]);
  const [language, setLanguage] = useState("en");

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedVideos = localStorage.getItem("noteGPT_recentVideos");
      const storedNotes = localStorage.getItem("noteGPT_savedNotes");
      const storedLanguage = localStorage.getItem("noteGPT_language");

      if (storedVideos) setRecentVideos(JSON.parse(storedVideos));
      if (storedNotes) setSavedNotes(JSON.parse(storedNotes));
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
