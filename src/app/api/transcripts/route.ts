import { NextResponse } from "next/server";
import { Pool } from "pg";

// Create a connection pool - this only runs server-side
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Ensure the transcripts table exists
async function ensureTable() {
  try {
    // First check if videos table exists, create it if not
    const checkVideosTable = `
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        source_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(checkVideosTable);
    console.log("Verified videos table exists");

    // Now create transcripts table with foreign key reference
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id)
      );
    `;
    await pool.query(createTableQuery);
    console.log("Transcripts table check complete");
  } catch (error) {
    console.error("Error ensuring transcripts table exists:", error);
  }
}

// Route handler for fetching transcripts
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
    // Make sure tables exist before querying
    await ensureTable();

    // Get transcript by video ID
    const query = "SELECT * FROM transcripts WHERE video_id = $1";
    const result = await pool.query(query, [videoId]);

    // If no transcript found, return null
    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error in transcripts GET:", error);
    return NextResponse.json(
      {
        error: "Database error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Route handler for saving transcripts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, videoUrl, content } = body;

    if (!videoId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Make sure tables exist before inserting
    await ensureTable();

    // First save the video if it doesn't exist
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

    // Then save the transcript
    const transcriptQuery = `
      INSERT INTO transcripts (video_id, content)
      VALUES ($1, $2)
      ON CONFLICT (video_id) DO UPDATE
      SET 
        content = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const transcriptResult = await pool.query(transcriptQuery, [
      videoId,
      content,
    ]);

    return NextResponse.json(transcriptResult.rows[0]);
  } catch (error) {
    console.error("Error saving transcript:", error);
    return NextResponse.json(
      {
        error: "Failed to save transcript",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
