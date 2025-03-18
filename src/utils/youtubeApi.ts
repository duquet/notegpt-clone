/**
 * Video details interface
 */
export interface VideoDetails {
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

/**
 * Fetch YouTube video details by ID using our API route
 * @param videoId YouTube video ID
 * @returns Promise with video title and other details
 */
export async function getYouTubeVideoDetails(
  videoId: string
): Promise<VideoDetails | null> {
  try {
    const response = await fetch(`/api/youtube?videoId=${videoId}`);

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallbackTitle) {
        return {
          title: errorData.fallbackTitle,
          channelTitle: "Unknown Channel",
          publishedAt: new Date().toISOString(),
          thumbnailUrl: "",
        };
      }
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching YouTube video details:", error);
    return null;
  }
}

/**
 * Fallback function for when the API call fails
 * @param videoId YouTube video ID
 * @returns A generated title based on the video ID
 */
export function generateFallbackTitle(videoId: string): string {
  // Create a mapping of known video IDs to titles for demo purposes
  const videoTitles: Record<string, string> = {
    lOxsW7zT1nw: "The Future of Artificial Intelligence in Healthcare",
    c3wu0dUNd4c: "10 Amazing Facts About the Universe",
    dQw4w9WgXcQ: "History of Internet Culture: Memes and Viral Content",
  };

  // Return the mapped title if we have one, or generate a title based on the ID
  return (
    videoTitles[videoId] || `YouTube Video (ID: ${videoId.substring(0, 6)}...)`
  );
}
