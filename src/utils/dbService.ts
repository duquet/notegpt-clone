// Client-side database service that calls our API endpoints
// This avoids using 'fs' module on the client side

interface Summary {
  id?: number;
  video_id: string;
  type: string;
  title: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

interface Flashcard {
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

interface FlashcardSet {
  id?: number;
  video_id: string;
  title: string;
  created_at?: Date;
  updated_at?: Date;
  flashcards?: Flashcard[];
}

// New interface for transcripts
interface Transcript {
  id?: number;
  video_id: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

// Database service object with methods to interact with our API
export const dbService = {
  // Summary methods
  summaries: {
    // Get all summaries for a video
    async getByVideoId(videoId: string): Promise<Summary[]> {
      try {
        const response = await fetch(
          `/api/db?videoId=${encodeURIComponent(videoId)}`
        );
        if (!response.ok) {
          throw new Error(`Error fetching summaries: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching summaries:", error);
        return [];
      }
    },

    // Get a specific summary type
    async getByType(videoId: string, type: string): Promise<Summary | null> {
      try {
        const response = await fetch(
          `/api/db?videoId=${encodeURIComponent(
            videoId
          )}&type=${encodeURIComponent(type)}`
        );
        if (!response.ok) {
          throw new Error(`Error fetching summary: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching summary by type:", error);
        return null;
      }
    },

    // Save a summary
    async save(summary: {
      videoId: string;
      videoTitle?: string;
      videoUrl?: string;
      summaryType: string;
      summaryTitle?: string;
      content: string;
    }): Promise<Summary | null> {
      try {
        const response = await fetch("/api/db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(summary),
        });

        if (!response.ok) {
          throw new Error(`Error saving summary: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error saving summary:", error);
        return null;
      }
    },
  },

  // Flashcards methods
  flashcards: {
    // Get all flashcard sets for a video
    async getSetsByVideoId(videoId: string): Promise<FlashcardSet[]> {
      try {
        const response = await fetch(
          `/api/flashcards?videoId=${encodeURIComponent(videoId)}`
        );
        if (!response.ok) {
          throw new Error(
            `Error fetching flashcard sets: ${response.statusText}`
          );
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching flashcard sets:", error);
        return [];
      }
    },

    // Get a specific flashcard set
    async getSetById(setId: number): Promise<FlashcardSet | null> {
      try {
        const response = await fetch(`/api/flashcards?setId=${setId}`);
        if (!response.ok) {
          throw new Error(
            `Error fetching flashcard set: ${response.statusText}`
          );
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching flashcard set:", error);
        return null;
      }
    },

    // Save a flashcard set
    async saveSet(set: {
      videoId: string;
      videoTitle?: string;
      videoUrl?: string;
      title: string;
      flashcards: Flashcard[];
    }): Promise<FlashcardSet | null> {
      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(set),
        });

        if (!response.ok) {
          throw new Error(`Error saving flashcard set: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error saving flashcard set:", error);
        return null;
      }
    },
  },

  // Transcripts methods
  transcripts: {
    // Get transcript by video ID
    async getByVideoId(videoId: string): Promise<Transcript | null> {
      try {
        const response = await fetch(
          `/api/transcripts?videoId=${encodeURIComponent(videoId)}`
        );
        if (!response.ok) {
          throw new Error(`Error fetching transcript: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching transcript:", error);
        return null;
      }
    },

    // Save a transcript
    async save(transcript: {
      videoId: string;
      videoTitle?: string;
      videoUrl?: string;
      content: string;
    }): Promise<Transcript | null> {
      try {
        const response = await fetch("/api/transcripts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transcript),
        });

        if (!response.ok) {
          throw new Error(`Error saving transcript: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error saving transcript:", error);
        return null;
      }
    },
  },
};

export default dbService;
export type { Summary, Flashcard, FlashcardSet, Transcript };
