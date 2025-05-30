import { SummaryTemplates } from '../types/summary';

export function validateTemplateType(templateType: string, validTemplates: SummaryTemplates): boolean {
  return templateType in validTemplates;
}

export function getTemplateValidationError(templateType: string, validTemplates: SummaryTemplates): string {
  if (!validateTemplateType(templateType, validTemplates)) {
    return `Invalid template type: ${templateType}. Valid types are: ${Object.keys(validTemplates).join(', ')}`;
  }
  return '';
}

export function getTemplateConfigs(templates: SummaryTemplates) {
  return Object.entries(templates).map(([type, config]) => ({
    type,
    title: config.title
  }));
} 