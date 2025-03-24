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
