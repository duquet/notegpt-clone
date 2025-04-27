"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NoteIcon from "@mui/icons-material/Note";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useTranslation } from "@/utils";

const drawerWidth = 200;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { t } = useTranslation();

  // Navigation items with translations
  const navItems = [
    {
      name: t("create"),
      path: "/workspace/create",
      icon: <AddIcon />,
    },
    {
      name: t("notes"),
      path: "/workspace/notes",
      icon: <NoteIcon />,
    },
    {
      name: t("history"),
      path: "/workspace/history",
      icon: <HistoryIcon />,
    },
    {
      name: t("settings"),
      path: "/workspace/settings",
      icon: <SettingsIcon />,
    },
  ];

  const drawer = (
    <>
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
          <AutoAwesomeIcon sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: "bold" }}>
            NoteGPT
          </Typography>
        </Box>
      </Link>
      <Divider />
      <List>
        {navItems.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <ListItem key={item.path} disablePadding>
              <Link
                href={item.path}
                style={{
                  textDecoration: "none",
                  width: "100%",
                  color: "inherit",
                }}
              >
                <ListItemButton selected={isActive} sx={{ py: 0.75 }}>
                  <ListItemIcon
                    sx={{ 
                      color: isActive ? "primary.main" : "inherit",
                      minWidth: "40px" 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name} 
                    primaryTypographyProps={{ fontSize: "0.9rem" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer - shows as temporary slide-in */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        /* Desktop drawer - persistent but can be toggled */
        <Drawer
          variant="persistent"
          open={mobileOpen}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
}
