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