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

const drawerWidth = 240;

const navItems = [
  {
    name: "Create",
    path: "/workspace/create",
    icon: <AddIcon />,
  },
  {
    name: "Notes",
    path: "/workspace/notes",
    icon: <NoteIcon />,
  },
  {
    name: "History",
    path: "/workspace/history",
    icon: <HistoryIcon />,
  },
  {
    name: "Settings",
    path: "/workspace/settings",
    icon: <SettingsIcon />,
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const drawer = (
    <>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          NoteGPT
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <ListItem key={item.name} disablePadding>
              <Link
                href={item.path}
                style={{
                  textDecoration: "none",
                  width: "100%",
                  color: "inherit",
                }}
              >
                <ListItemButton selected={isActive}>
                  <ListItemIcon
                    sx={{ color: isActive ? "primary.main" : "inherit" }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
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
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
}
