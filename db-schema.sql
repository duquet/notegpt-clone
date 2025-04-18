-- Create videos table to store video metadata
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT,
  thumbnail_url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create summaries table to store different summary types
CREATE TABLE IF NOT EXISTS summaries (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) REFERENCES videos(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'default', 'chapter', 'notes', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Constraint to ensure unique summary types per video
  UNIQUE(video_id, type)
);

-- Create flashcards table to store flashcard sets
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) REFERENCES videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create individual flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  set_id INTEGER REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
  category VARCHAR(50),
  position INTEGER NOT NULL DEFAULT 0, -- For ordering within a set
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_summaries_video_id ON summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_video_id ON flashcard_sets(video_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id); 