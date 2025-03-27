"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { blue, grey } from "@mui/material/colors";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

// Hook for easy context consumption
export const useThemeContext = () => useContext(ThemeContext);

// Theme configuration
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: blue[700],
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: grey[700],
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: blue[500],
    },
    background: {
      default: "#1e1e2d",
      paper: "#1e1e2d",
    },
    text: {
      primary: "#ffffff",
      secondary: grey[300],
    },
  },
});

// Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("light");

  // On initial mount, load saved theme preference
  useEffect(() => {
    setMounted(true);
    const savedTheme =
      (localStorage.getItem("noteGPT_theme") as ThemeMode) || "light";
    setMode(savedTheme);

    // Apply the theme class to the document element
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("noteGPT_theme", mode);

      // Update the document class
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [mode, mounted]);

  // Toggle theme function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Set specific theme
  const setTheme = (theme: ThemeMode) => {
    setMode(theme);
  };

  // Choose the appropriate MUI theme based on the current mode
  const currentTheme = mode === "dark" ? darkTheme : lightTheme;

  // Provide the value
  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
  };

  // Prevent theme flash on initial render
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
