import { Language } from "@/types";

interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

const TRANSLATION_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATION_API_KEY;
const TRANSLATION_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export async function translateText(text: string, targetLanguage: Language): Promise<string> {
  if (!TRANSLATION_API_KEY) {
    throw new Error('Translation API key is not configured');
  }

  try {
    const response = await fetch(`${TRANSLATION_API_URL}?key=${TRANSLATION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage.code,
        format: 'text'
      }),
    });

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export async function translateTranscriptSegments(
  segments: TranscriptSegment[],
  targetLanguage: Language
): Promise<TranscriptSegment[]> {
  try {
    // Create a unique separator that won't appear in the text
    const separator = '|||SEGMENT_SEPARATOR|||';
    
    // Join all segments with the unique separator
    const fullText = segments.map(segment => segment.text).join(separator);
    
    // Translate the full text
    const translatedText = await translateText(fullText, targetLanguage);
    
    // Split the translated text using the unique separator
    const translatedSegments = translatedText.split(separator);
    
    // Map the translated segments back to the original segments
    return segments.map((segment, index) => ({
      ...segment,
      text: translatedSegments[index]?.trim() || segment.text
    }));
  } catch (error) {
    console.error('Error translating transcript:', error);
    throw error;
  }
} 