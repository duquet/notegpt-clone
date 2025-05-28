"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SummarizeIcon from "@mui/icons-material/Summarize";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import { ThemeSwitch } from "@/components/theme-switch";
import { LanguageSwitch } from "@/components/language-switch";
import { useAppContext } from "../contexts/AppContext";
import {
  getYouTubeVideoDetails,
  generateFallbackTitle,
} from "@/utils/youtubeApi";

export default function HomePage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addVideoToHistory } = useAppContext();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log("API URL (homepage):", apiUrl);

  const extractYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      setError("Invalid YouTube URL");
      return;
    }

    if (loading) {
      return; // Prevent multiple submissions while loading
    }

    setLoading(true);
    setError("");

    try {
      const videoDetails = await getYouTubeVideoDetails(videoId);
      const videoTitle = videoDetails?.title || generateFallbackTitle(videoId);

      // Add to history with the fetched or generated title
      addVideoToHistory({
        id: videoId,
        title: videoTitle,
        url: youtubeUrl,
        date: new Date().toISOString(),
      });

      // Redirect to video detail page
      router.push(`/workspace/create/${videoId}`);
    } catch (error) {
      console.error("Error fetching video details:", error);
      setError("Failed to fetch video details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    router.push("/workspace");
  };

  return (
    <>
      <div style={{ fontSize: 40, color: "green", textAlign: "center" }}>
        TEST
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          background: "#ffeaea",
          color: "#b71c1c",
          padding: 24,
          marginBottom: 24,
          textAlign: "center",
          border: "4px solid #b71c1c",
          borderRadius: 12,
        }}
      >
        API URL:{" "}
        {apiUrl ? apiUrl : <span style={{ color: "red" }}>Not set</span>}
      </div>
      <Box>
        {/* Header */}
        <Box
          component="header"
          sx={{
            py: 2,
            px: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" component="h1" fontWeight="bold">
              NoteGPT
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitch />
            <LanguageSwitch />
            <Button
              variant="contained"
              onClick={handleGetStarted}
              sx={{ ml: 2 }}
            >
              Get Started
            </Button>
          </Box>
        </Box>

        {/* Hero Section */}
        <Box
          sx={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.1))",
            py: { xs: 8, md: 12 },
            textAlign: "center",
          }}
        >
          <Container maxWidth="md">
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              fontWeight="bold"
              sx={{ fontSize: { xs: "2.5rem", md: "3.75rem" } }}
            >
              Summarize YouTube Videos Instantly
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              paragraph
              sx={{ mb: 6, maxWidth: "80%", mx: "auto" }}
            >
              Save time by getting AI-powered summaries, key points, and notes
              from any YouTube video.
            </Typography>

            <Paper
              component="form"
              onSubmit={handleSubmit}
              elevation={3}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                gap: 2,
                maxWidth: "700px",
                mx: "auto",
              }}
            >
              <TextField
                fullWidth
                placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=lOxsW7zT1nw)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                error={!!error}
                helperText={error}
                InputProps={{
                  startAdornment: (
                    <YouTubeIcon sx={{ mr: 1, color: "error.main" }} />
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  px: 3,
                  minWidth: { xs: "100%", sm: "auto" },
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Summarize"}
              </Button>
            </Paper>
          </Container>
        </Box>

        {/* Features Section */}
        <Container sx={{ py: 8 }}>
          <Typography
            variant="h4"
            component="h3"
            textAlign="center"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Key Features
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <SummarizeIcon
                    sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Smart Summaries
                  </Typography>
                  <Typography color="text.secondary">
                    Get concise summaries of any YouTube video, extracting the
                    most important information without wasting your time.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <NoteAltIcon
                    sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Key Points
                  </Typography>
                  <Typography color="text.secondary">
                    Identify main ideas and key points from videos to enhance
                    your understanding and retention of the content.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <AutoAwesomeIcon
                    sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Save Time
                  </Typography>
                  <Typography color="text.secondary">
                    Stop watching long videos. Get the information you need in
                    seconds and focus on what matters most.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* CTA Section */}
        <Box sx={{ py: 8, bgcolor: "background.paper" }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              component="h3"
              gutterBottom
              fontWeight="bold"
            >
              Ready to get started?
            </Typography>
            <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
              Join thousands of users who are saving time with NoteGPT.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{ px: 4, py: 1.5 }}
            >
              Try NoteGPT Now
            </Button>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 4,
            borderTop: "1px solid",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Container>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} NoteGPT. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
}
