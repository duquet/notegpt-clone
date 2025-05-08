"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "./AppContext";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";

// Combined provider that wraps all context providers
export function ContextProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>{children}</AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Export all hooks for easy imports
export { useAppContext } from "./AppContext";
export { useThemeContext } from "./ThemeContext";
export { useAuth } from "./AuthContext";
export type { VideoSummary, UserNote } from "./AppContext";
