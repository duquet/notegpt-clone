import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter" },
      { status: 400 }
    );
  }

  try {
    // Create standardized YouTube URL from video ID
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const pythonApiResponse = await fetch("http://127.0.0.1:5001/video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        segmentDuration: 30,
        chunkSize: 300, // 5 minutes per chunk
      }),
    });

    if (pythonApiResponse.ok) {
      const data = await pythonApiResponse.json();
      console.log("Python API response:", data);

      return NextResponse.json({
        title: data.title || `YouTube Video (${videoId})`,
        channelTitle: data.uploaded_by || "Unknown Channel",
        publishedAt: data.uploaded_at || new Date().toISOString(),
        thumbnailUrl: "", // Python API doesn't provide thumbnail
        transcript: data.transcript || "", // Include transcript from Python API
        hasTranscript: !!data.transcript_chunk,
        transcript_chunk: data.transcript_chunk, // Include full transcript chunk data
        duration: data.duration, // Include video duration
      });
    }

    // If Python API didn't respond properly, return error
    const errorData = await pythonApiResponse.json().catch(() => ({}));
    console.error("Python API failed:", {
      status: pythonApiResponse.status,
      statusText: pythonApiResponse.statusText,
      error: errorData,
    });

    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: pythonApiResponse.status }
    );
  } catch (error) {
    console.error("Error accessing Python API:", error);
    return NextResponse.json(
      { error: "Error accessing video details" },
      { status: 500 }
    );
  }
}
