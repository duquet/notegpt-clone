export interface SummaryTemplate {
  title: string;
  systemPrompt: string;
  userPrompt: string;
}

export interface SummaryTemplates {
  [key: string]: SummaryTemplate;
}

export type TemplateType = keyof SummaryTemplates;

export interface TemplateConfig {
  type: string;
  title: string;
}

export interface SummarySection {
  name: string;
  content: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface PerformanceMetrics {
  total_time: number;
  transcript_fetch_time: number;
  openai_time: number;
  parsing_time: number;
  request_id: string;
}

export interface StructuredSummaryResponse {
  templateType: string;
  title: string;
  sections?: SummarySection[];
  flashcards?: Flashcard[];
  raw_content: string;
  parsing_error?: string;
  performance_metrics: PerformanceMetrics;
}

export interface SummaryRequest {
  url?: string;
  videoId?: string;
  pdfText?: string;
  options: {
    templateType: string;
    customPrompt?: string;
  };
} 