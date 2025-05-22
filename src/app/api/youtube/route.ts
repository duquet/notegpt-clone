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
    console.log(
      "[YouTube API] Python backend response:",
      JSON.stringify(data, null, 2)
    );

    const hasTranscript = !!data.transcript_chunk?.grouped_segments?.length;
    console.log("[YouTube API] Computed hasTranscript:", hasTranscript);

    return NextResponse.json({
      title: data.title || `YouTube Video (${videoId})`,
      channelTitle: data.uploaded_by || "Unknown Channel",
      publishedAt: data.uploaded_at || new Date().toISOString(),
      thumbnailUrl: "", // Python API doesn't provide thumbnail
      transcript: data.transcript || "", // Include transcript from Python API
      hasTranscript,
      transcript_chunk: data.transcript_chunk, // Include full transcript chunk data
      duration: data.duration, // Include video duration
    });
  } catch (error) {
    console.error("[YouTube API] Error in GET /api/youtube:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch video details or transcript.",
        details: error?.toString(),
      },
      { status: 500 }
    );
  }
}
