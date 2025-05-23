"use client";

import React, { useState } from "react";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAppContext } from "@/contexts";
import { useTranslation } from "@/utils";
import { TranslationKey } from "@/utils/translations";

// Language configuration
const languages = [
  { code: "en", translationKey: "languageEnglish" as TranslationKey },
  { code: "es", translationKey: "languageSpanish" as TranslationKey },
  { code: "fr", translationKey: "languageFrench" as TranslationKey },
  { code: "de", translationKey: "languageGerman" as TranslationKey },
  { code: "zh", translationKey: "languageChinese" as TranslationKey },
];

export function LanguageSwitch() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { language, setLanguage } = useAppContext();
  const { t } = useTranslation();

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

  // Get current language name using translation
  const currentLanguageInfo =
    languages.find((lang) => lang.code === language) || languages[0];
  const currentLanguageName = t(currentLanguageInfo.translationKey);

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
        <Typography variant="body2">{currentLanguageName}</Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            selected={lang.code === language}
          >
            {t(lang.translationKey)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
