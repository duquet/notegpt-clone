import { NextResponse } from "next/server";
import { Pool } from "pg";

// Create a connection pool - this only runs server-side
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Route handler for fetching summaries
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const type = searchParams.get("type");

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter" },
      { status: 400 }
    );
  }

  try {
    // If type is provided, get specific summary type
    if (type) {
      const query = "SELECT * FROM summaries WHERE video_id = $1 AND type = $2";
      const result = await pool.query(query, [videoId, type]);
      return NextResponse.json(result.rows[0] || null);
    }

    // Otherwise get all summaries
    const query =
      "SELECT * FROM summaries WHERE video_id = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [videoId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// Route handler for saving summaries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      videoId,
      videoTitle,
      videoUrl,
      summaryType,
      summaryTitle,
      content,
    } = body;

    if (!videoId || !summaryType || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First save the video
    const videoQuery = `
      INSERT INTO videos (id, title, source_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET 
        title = $2,
        source_url = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    await pool.query(videoQuery, [
      videoId,
      videoTitle || "Untitled Video",
      videoUrl || "",
    ]);

    // Then save the summary
    const summaryQuery = `
      INSERT INTO summaries (video_id, type, title, content)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (video_id, type) DO UPDATE
      SET 
        title = $3,
        content = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const summaryResult = await pool.query(summaryQuery, [
      videoId,
      summaryType,
      summaryTitle || "Summary",
      content,
    ]);

    return NextResponse.json(summaryResult.rows[0]);
  } catch (error) {
    console.error("Error saving summary:", error);
    return NextResponse.json(
      { error: "Failed to save summary" },
      { status: 500 }
    );
  }
}
