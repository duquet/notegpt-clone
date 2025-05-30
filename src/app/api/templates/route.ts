import { NextResponse } from 'next/server';
import prompts from '@/api/summaryPrompts.json';
import { getTemplateConfigs } from '@/utils/templateValidation';

export async function GET() {
  try {
    const templateConfigs = getTemplateConfigs(prompts);
    return NextResponse.json(templateConfigs);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
} 