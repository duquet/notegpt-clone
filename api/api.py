from flask import Flask, request, jsonify
import yt_dlp
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    CouldNotRetrieveTranscript
)
from urllib.parse import urlparse, parse_qs
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def clean_youtube_url(url):
    """
    Extract the video ID from a YouTube URL and return a standardized URL.
    """
    parsed = urlparse(url)
    video_id = None
    if parsed.hostname in ['youtu.be']:
        video_id = parsed.path[1:]  # remove leading '/'
    elif parsed.hostname in ['www.youtube.com', 'youtube.com']:
        query = parse_qs(parsed.query)
        video_id = query.get("v", [None])[0]
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    else:
        return url  # fallback if extraction fails

def get_video_metadata(url):
    """
    Fetch metadata for a YouTube video using yt-dlp.
    Only returns required fields.
    """
    try:
        ydl_opts = {}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        metadata = {
            "title": info.get("title"),
            "view_count": info.get("view_count"),
            "duration": info.get("duration"),  # in seconds
            "uploaded_at": info.get("upload_date"),
            "uploaded_by": info.get("uploader"),
            "like_count": info.get("like_count")
        }
        return metadata
    except Exception as e:
        raise Exception(f"Failed to retrieve metadata: {e}")

def get_video_transcript(url):
    """
    Retrieve transcript of the YouTube video using its video ID.
    If an English transcript is not available, fetch any available transcript and translate it to English.
    """
    try:
        parsed = urlparse(url)
        video_id = None
        if parsed.hostname in ['youtu.be']:
            video_id = parsed.path[1:]
        elif parsed.hostname in ['www.youtube.com', 'youtube.com']:
            query = parse_qs(parsed.query)
            video_id = query.get("v", [None])[0]
        if not video_id:
            return "Invalid YouTube URL."
            
        # Get a list of available transcripts.
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            # Attempt to get an English transcript.
            transcript_obj = transcript_list.find_transcript(['en'])
        except NoTranscriptFound:
            # If no English transcript, use the first available transcript.
            transcript_obj = next(iter(transcript_list))
            # Translate the transcript if it's not already in English.
            if transcript_obj.language_code != 'en':
                transcript_obj = transcript_obj.translate('en')
        transcript_entries = transcript_obj.fetch()
        # Use attribute access instead of subscript notation.
        transcript = " ".join(entry.text for entry in transcript_entries)
        return transcript
    except TranscriptsDisabled:
        return "Transcripts are disabled for this video."
    except NoTranscriptFound:
        return "No transcript was found for this video."
    except CouldNotRetrieveTranscript as e:
        return f"Could not retrieve transcript: {e}"
    except Exception as e:
        return f"An error occurred while fetching transcript: {e}"

@app.route('/video', methods=['POST'])
def video_info():
    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "Body must contain a 'url' field."}), 400

    url = data["url"]
    cleaned_url = clean_youtube_url(url)
    try:
        metadata = get_video_metadata(cleaned_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    transcript = get_video_transcript(cleaned_url)
    
    response = metadata
    response["transcript"] = transcript
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)