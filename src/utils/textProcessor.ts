export async function processText(text: string): Promise<string> {
  try {
    const response = await fetch("http://localhost:8000/api/process-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Failed to process text");
    }

    const data = await response.json();
    return data.processed_text;
  } catch (error) {
    console.error("Error processing text:", error);
    throw error;
  }
}
