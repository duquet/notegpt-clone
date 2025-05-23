import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  console.log("[YouTube API] Incoming GET /api/youtube with videoId:", videoId);

  if (!videoId) {
    console.error("[YouTube API] Missing videoId parameter");
    return NextResponse.json(
      {
        error:
          "Missing videoId parameter. Please provide a valid YouTube videoId as a query parameter.",
      },
      { status: 400 }
    );
  }

  try {
    // Create standardized YouTube URL from video ID
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log("[YouTube API] Posting to Python backend for:", videoUrl);
    const pythonResponse = await fetch("http://127.0.0.1:5001/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    const data = await pythonResponse.json();

    // Check if the Python backend returned an error
    if (!data.success) {
      console.error("[YouTube API] Python backend error:", data.error);
      return NextResponse.json(
        {
          error: data.error || "Failed to fetch video details",
          details: data.details,
          fallbackTitle: `YouTube Video (${videoId})`,
        },
        { status: pythonResponse.status }
      );
    }

    const hasTranscript =
      !!data.data?.transcript_chunk?.grouped_segments?.length;

    // Only log transcript status if we have a transcript
    if (hasTranscript) {
      console.log("[YouTube API] Successfully fetched data with transcript:", {
        title: data.data.title,
        transcriptLength: data.data.transcript_chunk.grouped_segments.length,
      });
    } else {
      console.log("[YouTube API] Successfully fetched data:", {
        title: data.data.title,
      });
    }

    return NextResponse.json({
      title: data.data.title || `YouTube Video (${videoId})`,
      channelTitle: data.data.uploaded_by || "Unknown Channel",
      publishedAt: data.data.uploaded_at || new Date().toISOString(),
      thumbnailUrl: "", // Python API doesn't provide thumbnail
      transcript: data.data.transcript || "", // Include transcript from Python API
      hasTranscript,
      transcript_chunk: data.data.transcript_chunk, // Include full transcript chunk data
      duration: data.data.duration, // Include video duration
    });
  } catch (error) {
    console.error("[YouTube API] Error in GET /api/youtube:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch video details or transcript.",
        details: error?.toString(),
        fallbackTitle: `YouTube Video (${videoId})`,
      },
      { status: 500 }
    );
  }
}
