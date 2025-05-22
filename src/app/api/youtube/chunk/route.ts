import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const startTime = searchParams.get("startTime");
  const duration = searchParams.get("duration");

  if (!videoId || !startTime || !duration) {
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
    return NextResponse.json(data, { status: pythonResponse.status });
  } catch (error) {
    console.error("[YouTube API Chunk] Error accessing Python API:", error);
    return NextResponse.json(
      { error: "Error accessing chunked transcript", details: String(error) },
      { status: 500 }
    );
  }
}
