import { NextResponse } from "next/server";
import { Pool } from "pg";

// Create a connection pool - this only runs server-side
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Route handler for fetching flashcard sets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const setId = searchParams.get("setId");

  if (!videoId && !setId) {
    return NextResponse.json(
      { error: "Missing videoId or setId parameter" },
      { status: 400 }
    );
  }

  try {
    // If setId is provided, get that specific set with its flashcards
    if (setId) {
      // Get the set
      const setQuery = "SELECT * FROM flashcard_sets WHERE id = $1";
      const setResult = await pool.query(setQuery, [setId]);

      if (setResult.rows.length === 0) {
        return NextResponse.json(null);
      }

      const set = setResult.rows[0];

      // Get the flashcards for this set
      const cardsQuery =
        "SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position";
      const cardsResult = await pool.query(cardsQuery, [setId]);

      // Return the set with its flashcards
      return NextResponse.json({
        ...set,
        flashcards: cardsResult.rows,
      });
    }

    // Otherwise get all sets for the video
    const setsQuery =
      "SELECT * FROM flashcard_sets WHERE video_id = $1 ORDER BY created_at DESC";
    const setsResult = await pool.query(setsQuery, [videoId]);

    // For each set, get its flashcards
    const sets = await Promise.all(
      setsResult.rows.map(async (set) => {
        const cardsQuery =
          "SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position";
        const cardsResult = await pool.query(cardsQuery, [set.id]);

        return {
          ...set,
          flashcards: cardsResult.rows,
        };
      })
    );

    return NextResponse.json(sets);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// Route handler for saving flashcard sets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, videoUrl, title, flashcards } = body;

    if (
      !videoId ||
      !flashcards ||
      !Array.isArray(flashcards) ||
      flashcards.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get a client from the pool for a transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

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

      await client.query(videoQuery, [
        videoId,
        videoTitle || "Untitled Video",
        videoUrl || "",
      ]);

      // Create the flashcard set
      const setQuery = `
        INSERT INTO flashcard_sets (video_id, title)
        VALUES ($1, $2)
        RETURNING *
      `;

      const setResult = await client.query(setQuery, [
        videoId,
        title || "AI Flash Cards",
      ]);
      const newSet = setResult.rows[0];

      // Insert all flashcards
      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        const cardQuery = `
          INSERT INTO flashcards (set_id, question, answer, difficulty, category, position)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        await client.query(cardQuery, [
          newSet.id,
          card.question,
          card.answer,
          card.difficulty || "medium",
          card.category || "General",
          i, // Use the array index as position
        ]);
      }

      await client.query("COMMIT");

      // Get all cards for the new set
      const cardsQuery =
        "SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position";
      const cardsResult = await client.query(cardsQuery, [newSet.id]);

      // Return the complete set with its flashcards
      return NextResponse.json({
        ...newSet,
        flashcards: cardsResult.rows,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving flashcards:", error);
    return NextResponse.json(
      { error: "Failed to save flashcards" },
      { status: 500 }
    );
  }
}
