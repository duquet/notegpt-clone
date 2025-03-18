"use client";

import React, { useState } from "react";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
];

export function LanguageSwitch() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    handleClose();
    // Here you would implement actual language switching logic
  };

  const currentLanguage =
    languages.find((lang) => lang.code === selectedLanguage)?.name || "English";

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
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={selectedLanguage === language.code}
          >
            {language.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
