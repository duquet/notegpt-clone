export interface SummaryTemplateOptions {
  templateType?: string;
  customPrompt?: string;
  customTitle?: string;
  systemPrompt?: string;
}

/**
 * Summarizes a video transcript using OpenAI
 * @param transcript The full transcript text to summarize
 * @param options Optional options for customizing the summary
 * @returns A promise that resolves to the summary text
 */
export async function summarizeTranscript(
  transcript: string,
  options?: string | SummaryTemplateOptions
): Promise<string> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://notegpt-clone.onrender.com";
    const response = await fetch(`${apiUrl}/api/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate summary");
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error calling summarize API:", error);
    throw new Error("Failed to generate summary");
  }
}
