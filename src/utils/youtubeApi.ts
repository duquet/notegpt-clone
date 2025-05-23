/**
 * Video details interface
 */
export interface VideoDetails {
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  transcript?: string;
}

// Keep track of in-flight requests to prevent duplicates
const pendingRequests = new Map<string, Promise<VideoDetails | null>>();

/**
 * Fetch YouTube video details by ID using our API route
 * @param videoId YouTube video ID
 * @returns Promise with video title and other details
 */
export async function getYouTubeVideoDetails(
  videoId: string
): Promise<VideoDetails | null> {
  // Check if there's already a request in progress for this video
  const existingRequest = pendingRequests.get(videoId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const request = (async () => {
    try {
      const response = await fetch(`/api/youtube?videoId=${videoId}`);

      if (!response.ok) {
        console.error("[YouTube API] Error response:", {
          status: response.status,
          statusText: response.statusText,
        });

        // Check for specific error codes
        if (response.status === 429) {
          console.warn("[YouTube API] Quota exceeded. Using fallback title.");
          return createFallbackDetails(videoId);
        }

        const errorData = await response.json().catch(() => ({}));
        console.error("[YouTube API] Error data:", errorData);

        if (errorData.fallbackTitle) {
          return {
            title: errorData.fallbackTitle,
            channelTitle: "Unknown Channel",
            publishedAt: new Date().toISOString(),
            thumbnailUrl: "",
            transcript: "",
          };
        }
        return null;
      }

      const data = await response.json();

      // Only log if we have a transcript
      if (data.transcript_chunk?.grouped_segments?.length) {
        console.log(
          "[YouTube API] Successfully fetched data with transcript:",
          {
            title: data.title,
            transcriptLength: data.transcript_chunk.grouped_segments.length,
          }
        );
      }

      return data;
    } catch (error) {
      console.error("[YouTube API] Error fetching video details:", error);
      return createFallbackDetails(videoId);
    } finally {
      // Clean up the pending request
      pendingRequests.delete(videoId);
    }
  })();

  // Store the request
  pendingRequests.set(videoId, request);
  return request;
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
    transcript: "",
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
