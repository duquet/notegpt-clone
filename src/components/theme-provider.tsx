"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { blue, grey } from "@mui/material/colors";
import { useTheme as useNextTheme } from "next-themes";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: blue[700],
    },
    background: {
      default: "#f7f9fc",
      paper: "#ffffff",
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
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: grey[300],
      secondary: grey[500],
    },
  },
});

// Hook to manage theme
export const useTheme = () => {
  const { theme, setTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<"light" | "dark">(
    "light"
  );

  // useEffect only runs on the client, so we can safely check for the theme
  React.useEffect(() => {
    setMounted(true);
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark") || "light";
    setCurrentTheme(savedTheme);

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setCurrentTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const muiTheme = currentTheme === "dark" ? darkTheme : lightTheme;

  if (!mounted) {
    // Prevent theme flash on first render
    return <>{children}</>;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </NextThemesProvider>
  );
}
