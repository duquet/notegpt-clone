import { NextResponse } from 'next/server';
import prompts from '@/api/summaryPrompts.json';
import { validateTemplateType, getTemplateValidationError } from '@/utils/templateValidation';

export async function POST(req: Request) {
  try {
    const { templateType, content } = await req.json();

    // Validate template type
    if (!validateTemplateType(templateType, prompts)) {
      const error = getTemplateValidationError(templateType, prompts);
      console.error('Template validation failed:', error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Get the template configuration
    const template = prompts[templateType];

    // Continue with summary generation using the template
    // ... existing summary generation code ...

  } catch (error) {
    console.error('Error in summarize endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 