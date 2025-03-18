"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import { WorkspaceHeader } from "@/components/workspace-header";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError("");
  };

  const handleClearYoutubeUrl = () => {
    setYoutubeUrl("");
  };

  const handleClearText = () => {
    setText("");
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const extractYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSubmit = () => {
    if (activeTab === 0) {
      // YouTube URL
      if (!youtubeUrl) {
        setError("Please enter a YouTube URL");
        return;
      }

      const videoId = extractYoutubeId(youtubeUrl);
      if (!videoId) {
        setError("Invalid YouTube URL");
        return;
      }

      router.push(`/workspace/create/${videoId}`);
    } else if (activeTab === 1) {
      // Text
      if (!text.trim()) {
        setError("Please enter some text");
        return;
      }
      console.log("Text submitted:", text);
      // Handle text summarization
    } else if (activeTab === 2) {
      // File Upload
      if (!file) {
        setError("Please select a file");
        return;
      }
      console.log("File submitted:", file.name);
      // Handle file summarization
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <>
      <WorkspaceHeader title="Create" />

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summarize Content
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter a YouTube URL, paste text, or upload a file to generate a
            summary.
          </Typography>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab icon={<YouTubeIcon />} label="YouTube" />
              <Tab icon={<TextFieldsIcon />} label="Text" />
              <Tab icon={<UploadFileIcon />} label="File" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ my: 2 }}>
                {error}
              </Alert>
            )}

            <TabPanel value={activeTab} index={0}>
              <TextField
                fullWidth
                label="YouTube URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                InputProps={{
                  endAdornment: youtubeUrl && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearYoutubeUrl} edge="end">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <TextField
                fullWidth
                label="Text"
                placeholder="Paste your text here..."
                multiline
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                InputProps={{
                  endAdornment: text && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearText} edge="end">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {file ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    border: "1px dashed",
                    borderColor: "primary.main",
                    borderRadius: 1,
                  }}
                >
                  <Typography>{file.name}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClearFile}
                  >
                    Remove
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ py: 5 }}
                >
                  <UploadFileIcon sx={{ mr: 1 }} />
                  Upload File
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
              )}
            </TabPanel>

            <Box sx={{ p: 2, textAlign: "right" }}>
              <Button variant="contained" size="large" onClick={handleSubmit}>
                Summarize Now
              </Button>
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </>
  );
}
