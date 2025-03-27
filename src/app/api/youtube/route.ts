import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter" },
      { status: 400 }
    );
  }

  // Try the Python API first
  try {
    // Create standardized YouTube URL from video ID
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const pythonApiResponse = await fetch("http://127.0.0.1:5000/video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: videoUrl }),
      // Short timeout to ensure we fall back quickly if Python API is unavailable
      // signal: AbortSignal.timeout(500000000)
    });

    if (pythonApiResponse.ok) {
      const data = await pythonApiResponse.json();
      
      // Transform the response to match our expected format
      return NextResponse.json({
        title: data.title || `YouTube Video (${videoId})`,
        channelTitle: data.uploaded_by || "Unknown Channel",
        publishedAt: data.uploaded_at || new Date().toISOString(),
        thumbnailUrl: "", // Python API doesn't provide thumbnail
        transcript: data.transcript || "", // Include transcript from Python API
      });
    }
    
    // If Python API didn't respond properly, log it and continue to fallback
    console.log("Python API failed, falling back to YouTube Data API");
  } catch (error) {
    // Log error and continue to fallback
    console.error("Error accessing Python API:", error);
    console.log("Falling back to YouTube Data API");
  }

  // Fallback to YouTube Data API
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  try {
    const youtube = google.youtube({
      version: "v3",
      auth: API_KEY,
    });

    const response = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return NextResponse.json(
        {
          error: "Video not found",
          fallbackTitle: `YouTube Video (ID: ${videoId.substring(0, 6)}...)`,
        },
        { status: 404 }
      );
    }

    const video = response.data.items[0];
    const snippet = video.snippet;

    return NextResponse.json({
      title: snippet?.title || `YouTube Video (${videoId})`,
      channelTitle: snippet?.channelTitle || "Unknown Channel",
      publishedAt: snippet?.publishedAt || new Date().toISOString(),
      thumbnailUrl: snippet?.thumbnails?.standard?.url || "",
      transcript: "", // YouTube Data API doesn't provide transcript
    });
  } catch (error: any) {
    console.error("Error fetching YouTube video details:", error);
    
    // Check for quota exceeded error
    if (error.code === 403) {
      return NextResponse.json(
        { error: "YouTube API quota exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Error fetching video details",
        fallbackTitle: `YouTube Video (ID: ${videoId.substring(0, 6)}...)`,
      },
      { status: 500 }
    );
  }
}
