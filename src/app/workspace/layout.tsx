"use client";

import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  useMediaQuery,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { Sidebar } from "@/components/sidebar";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitch } from "@/components/language-switch";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/utils";
import { TranslationKey } from "@/utils";

// Route to translation key mappings
const routeTranslationKeys: Record<string, TranslationKey> = {
  "/workspace/create": "create",
  "/workspace/notes": "notes",
  "/workspace/history": "history",
  "/workspace/settings": "settings",
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(true); // Default to open
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();
  const { t } = useTranslation();

  // Get the current page title based on the path
  const getPageTitle = () => {
    // Exact match
    if (pathname in routeTranslationKeys) {
      return t(routeTranslationKeys[pathname]);
    }
    
    // Check for parent routes
    for (const route in routeTranslationKeys) {
      if (pathname.startsWith(route + "/")) {
        return t(routeTranslationKeys[route]);
      }
    }
    
    return t("dashboard");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerWidth = 200; // Match the sidebar width

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar with light color to match sidebar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          width: { 
            xs: "100%", 
            md: mobileOpen ? `calc(100% - ${drawerWidth}px)` : "100%"
          },
          ml: { 
            md: mobileOpen ? `${drawerWidth}px` : 0 
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" component="div" fontWeight="medium" sx={{ fontFamily: "Roboto, Helvetica, Arial, sans-serif;", marginTop: "4px" }}>
              {getPageTitle()}
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitch />
            <LanguageSwitch />
          </Box>
        </Toolbar>
      </AppBar>

      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { xs: "100%" },
          ml: 0,
          mt: { xs: 8, md: 8 }, // Add top margin for AppBar on all screen sizes
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
