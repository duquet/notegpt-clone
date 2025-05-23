import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const startTime = searchParams.get("startTime");
  const duration = searchParams.get("duration");

  console.log("[YouTube API Chunk] Request params:", {
    videoId,
    startTime,
    duration,
  });

  if (!videoId || !startTime || !duration) {
    console.error("[YouTube API Chunk] Missing parameters");
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const pythonResponse = await fetch("http://127.0.0.1:5001/video/chunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        startTime: Number(startTime),
        duration: Number(duration),
        segmentDuration: 30,
      }),
    });

    const data = await pythonResponse.json();

    if (!pythonResponse.ok) {
      console.error("[YouTube API Chunk] Python API error:", data.error);
      return NextResponse.json(
        { error: data.error || "Failed to fetch transcript chunk" },
        { status: pythonResponse.status }
      );
    }

    console.log("[YouTube API Chunk] Successfully fetched chunk:", {
      startTime: data.data.start_time,
      endTime: data.data.end_time,
      segmentCount: data.data.grouped_segments.length,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[YouTube API Chunk] Error accessing Python API:", error);
    return NextResponse.json(
      { error: "Error accessing chunked transcript", details: String(error) },
      { status: 500 }
    );
  }
}
