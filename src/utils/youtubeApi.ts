/**
 * Video details interface
 */
export interface VideoDetails {
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

// Cache for API responses to prevent repeated failing calls
const apiCache: Record<string, VideoDetails> = {};

/**
 * Fetch YouTube video details by ID using our API route
 * @param videoId YouTube video ID
 * @returns Promise with video title and other details
 */
export async function getYouTubeVideoDetails(
  videoId: string
): Promise<VideoDetails | null> {
  // Check cache first
  if (apiCache[videoId]) {
    return apiCache[videoId];
  }

  try {
    const response = await fetch(`/api/youtube?videoId=${videoId}`);

    if (!response.ok) {
      // Check for specific error codes
      if (response.status === 429) {
        console.warn("YouTube API quota exceeded. Using fallback title.");
        const fallback = createFallbackDetails(videoId);
        apiCache[videoId] = fallback;
        return fallback;
      }

      const errorData = await response.json();
      if (errorData.fallbackTitle) {
        const fallback = {
          title: errorData.fallbackTitle,
          channelTitle: "Unknown Channel",
          publishedAt: new Date().toISOString(),
          thumbnailUrl: "",
        };
        apiCache[videoId] = fallback;
        return fallback;
      }
      return null;
    }

    const data = await response.json();
    // Cache successful response
    apiCache[videoId] = data;
    return data;
  } catch (error) {
    console.error("Error fetching YouTube video details:", error);
    // Cache the error response to prevent repeated failing calls
    const fallback = createFallbackDetails(videoId);
    apiCache[videoId] = fallback;
    return fallback;
  }
}

/**
 * Create a fallback video details object
 */
function createFallbackDetails(videoId: string): VideoDetails {
  return {
    title: generateFallbackTitle(videoId),
    channelTitle: "Unknown Channel",
    publishedAt: new Date().toISOString(),
    thumbnailUrl: "",
  };
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
