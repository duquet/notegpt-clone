import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Type definitions
export interface Video {
  id: string;
  title: string;
  thumbnail_url?: string;
  source_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Summary {
  id?: number;
  video_id: string;
  type: string;
  title: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FlashcardSet {
  id?: number;
  video_id: string;
  title: string;
  created_at?: Date;
  updated_at?: Date;
  flashcards?: Flashcard[];
}

export interface Flashcard {
  id?: number;
  set_id?: number;
  question: string;
  answer: string;
  difficulty?: string;
  category?: string;
  position?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Database functions
export const db = {
  // Video functions
  videos: {
    /**
     * Save a video to the database
     */
    async save(video: Video): Promise<Video> {
      const { id, title, thumbnail_url, source_url } = video;

      const query = `
        INSERT INTO videos (id, title, thumbnail_url, source_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET 
          title = $2,
          thumbnail_url = $3,
          source_url = $4,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [id, title, thumbnail_url, source_url];
      const result = await pool.query(query, values);
      return result.rows[0];
    },

    /**
     * Get a video by ID
     */
    async getById(id: string): Promise<Video | null> {
      const query = "SELECT * FROM videos WHERE id = $1";
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    },
  },

  // Summary functions
  summaries: {
    /**
     * Save a summary to the database
     */
    async save(summary: Summary): Promise<Summary> {
      const { video_id, type, title, content } = summary;

      const query = `
        INSERT INTO summaries (video_id, type, title, content)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (video_id, type) DO UPDATE
        SET 
          title = $3,
          content = $4,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [video_id, type, title, content];
      const result = await pool.query(query, values);
      return result.rows[0];
    },

    /**
     * Get all summaries for a video
     */
    async getByVideoId(videoId: string): Promise<Summary[]> {
      const query =
        "SELECT * FROM summaries WHERE video_id = $1 ORDER BY created_at DESC";
      const result = await pool.query(query, [videoId]);
      return result.rows;
    },

    /**
     * Get a specific summary type for a video
     */
    async getByType(videoId: string, type: string): Promise<Summary | null> {
      const query = "SELECT * FROM summaries WHERE video_id = $1 AND type = $2";
      const result = await pool.query(query, [videoId, type]);
      return result.rows[0] || null;
    },

    /**
     * Delete a summary
     */
    async delete(id: number): Promise<boolean> {
      const query = "DELETE FROM summaries WHERE id = $1 RETURNING id";
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    },
  },

  // Flashcard functions
  flashcards: {
    /**
     * Save a flashcard set and its cards
     */
    async saveSet(set: FlashcardSet): Promise<FlashcardSet> {
      // Begin transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Insert or update the flashcard set
        const setQuery = `
          INSERT INTO flashcard_sets (video_id, title)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE
          SET 
            title = $2,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const setResult = await client.query(setQuery, [
          set.video_id,
          set.title,
        ]);
        const newSet = setResult.rows[0];

        // If we have flashcards, insert them
        if (set.flashcards && set.flashcards.length > 0) {
          // First, delete any existing flashcards for this set
          if (newSet.id) {
            await client.query("DELETE FROM flashcards WHERE set_id = $1", [
              newSet.id,
            ]);
          }

          // Insert the new flashcards
          for (let i = 0; i < set.flashcards.length; i++) {
            const card = set.flashcards[i];
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
        }

        await client.query("COMMIT");

        // Return the new set with flashcards
        return {
          ...newSet,
          flashcards: set.flashcards,
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    /**
     * Get a flashcard set with all its cards
     */
    async getSetById(id: number): Promise<FlashcardSet | null> {
      // Get the set
      const setQuery = "SELECT * FROM flashcard_sets WHERE id = $1";
      const setResult = await pool.query(setQuery, [id]);

      if (setResult.rows.length === 0) {
        return null;
      }

      const set = setResult.rows[0];

      // Get the flashcards
      const cardsQuery =
        "SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position";
      const cardsResult = await pool.query(cardsQuery, [id]);

      return {
        ...set,
        flashcards: cardsResult.rows,
      };
    },

    /**
     * Get all flashcard sets for a video
     */
    async getSetsByVideoId(videoId: string): Promise<FlashcardSet[]> {
      // Get all sets for this video
      const setsQuery =
        "SELECT * FROM flashcard_sets WHERE video_id = $1 ORDER BY created_at DESC";
      const setsResult = await pool.query(setsQuery, [videoId]);

      // For each set, get its flashcards
      const sets = await Promise.all(
        setsResult.rows.map(async (set: FlashcardSet) => {
          const cardsQuery =
            "SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position";
          const cardsResult = await pool.query(cardsQuery, [set.id]);

          return {
            ...set,
            flashcards: cardsResult.rows,
          };
        })
      );

      return sets;
    },

    /**
     * Delete a flashcard set and all its cards
     */
    async deleteSet(id: number): Promise<boolean> {
      const query = "DELETE FROM flashcard_sets WHERE id = $1 RETURNING id";
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    },
  },
};

export default db;
