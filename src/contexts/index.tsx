"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "./AppContext";
import { ThemeProvider } from "./ThemeContext";

// Combined provider that wraps all context providers
export function ContextProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}

// Export all hooks for easy imports
export { useAppContext } from "./AppContext";
export { useThemeContext } from "./ThemeContext";
export type { VideoSummary, UserNote } from "./AppContext";
