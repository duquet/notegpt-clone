"use client";

import React, { useState } from "react";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAppContext } from "@/contexts";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
];

export function LanguageSwitch() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { language, setLanguage } = useAppContext();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    handleClose();
  };

  const currentLanguage =
    languages.find((lang) => lang.code === language)?.name || "English";

  return (
    <>
      <Button
        color="inherit"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        startIcon={<LanguageIcon />}
        sx={{
          textTransform: "none",
          minWidth: "120px",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2">{currentLanguage}</Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            selected={lang.code === language}
          >
            {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
