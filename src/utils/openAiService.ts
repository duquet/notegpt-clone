import OpenAI from "openai";

// Import the prompts
import summaryPrompts from './summaryPrompts.json';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface SummaryTemplateOptions {
  templateType?: string;
  customPrompt?: string;
  customTitle?: string;
}

/**
 * Summarizes a video transcript using OpenAI
 * @param transcript The full transcript text to summarize
 * @param options Optional options for customizing the summary
 * @returns A promise that resolves to the summary text
 */
export async function summarizeTranscript(transcript: string, options?: string | SummaryTemplateOptions): Promise<string> {
  try {
    // Handle different parameter types for backward compatibility
    let templateType = 'default';
    let customPrompt = '';
    let customTitle = '';
    
    if (typeof options === 'string') {
      // Backward compatibility for string prompt
      customPrompt = options;
    } else if (options) {
      // Using the new options object
      templateType = options.templateType || 'default';
      customPrompt = options.customPrompt || '';
      customTitle = options.customTitle || '';
    }
    
    // Get the appropriate prompts from the JSON file
    const promptTemplate = customPrompt 
      ? { 
          title: customTitle || 'Custom Summary',
          systemPrompt: "You are a helpful assistant that summarizes content according to specific instructions. Format your response in Markdown with appropriate headings, paragraphs, and bullet points as needed.",
          userPrompt: customPrompt + ":\n\n{transcript}"
        }
      : (summaryPrompts[templateType as keyof typeof summaryPrompts] || summaryPrompts.default);
    
    // Replace {transcript} in the user prompt with the actual transcript
    const userPrompt = promptTemplate.userPrompt.replace('{transcript}', transcript);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: promptTemplate.systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Return the generated summary
    return response.choices[0].message.content || 'Failed to generate summary.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate summary');
  }
} 