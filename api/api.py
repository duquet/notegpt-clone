# The following code is copied from backend/app.py to unify backend logic in api/api.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import time
from functools import wraps
import hashlib
import threading

app = Flask(__name__)
CORS(app)

# Cache for successful transcript results
transcript_cache = {}
CACHE_TTL = 3600  # Cache TTL in seconds (1 hour)

# Helper to cache partial transcripts while full transcript is being fetched
partial_transcript_cache = {}


class QuietLogger:
    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        print(msg)  # Only print errors


def extract_video_id(url):
    # Extracts the video ID from a YouTube URL
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",  # Standard YouTube URL
        r"youtu\.be\/([0-9A-Za-z_-]{11})"  # Shortened URL
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_video_info(url):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': True,
        'force_generic_extractor': False,
        'logger': QuietLogger(),
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title'),
            'uploaded_by': info.get('uploader'),
            'uploaded_at': info.get('upload_date'),
            'duration': info.get('duration'),
        }


def retry_on_failure(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    print(
                        f"Attempt {attempt + 1}/{max_retries} failed: {str(e)}", flush=True)
                    if attempt < max_retries - 1:
                        time.sleep(delay)
            raise last_error
        return wrapper
    return decorator


def get_cache_key(url, start_time=None, duration=None):
    """Generate a unique cache key for a video and time range"""
    key = f"{url}:{start_time}:{duration}"
    return hashlib.md5(key.encode()).hexdigest()


def is_cache_valid(cache_entry):
    """Check if a cache entry is still valid based on TTL"""
    if not cache_entry:
        return False
    timestamp, _ = cache_entry
    return time.time() - timestamp < CACHE_TTL


# Helper to cache by video ID only
def get_cache_key_by_video_id(url):
    video_id = extract_video_id(url)
    return video_id if video_id else url


@retry_on_failure(max_retries=3, delay=1)
def get_video_transcript(url):
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Failed to extract video ID from URL: {url}", flush=True)
        return None

    # Check cache by video ID
    cache_key = get_cache_key_by_video_id(url)
    cache_entry = transcript_cache.get(cache_key)
    if is_cache_valid(cache_entry):
        print(
            f"[Debug][Transcript Coverage] {len(cache_entry[1])} entries, min start: {min([e['start'] for e in cache_entry[1]]):.2f}, max start: {max([e['start'] for e in cache_entry[1]]):.2f}", flush=True)
        return cache_entry[1]

    try:
        print(f"Fetching transcript for video ID: {video_id}", flush=True)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript(['en'])
            print("Found English transcript", flush=True)
        except (NoTranscriptFound, TranscriptsDisabled) as e:
            print(
                f"English transcript not found, trying manually created: {str(e)}", flush=True)
            try:
                transcript = transcript_list.find_manually_created_transcript(
                    transcript_list._manually_created_transcripts.keys())
                print("Found manually created transcript", flush=True)
            except Exception as e:
                print(f"No transcript found: {str(e)}", flush=True)
                return None
        entries = transcript.fetch()
        print(
            f"Successfully fetched {len(entries)} transcript entries", flush=True)
        entries = [{'text': entry.text, 'start': entry.start,
                    'duration': entry.duration} for entry in entries]
        if entries:
            starts = [e['start'] for e in entries]
            print(
                f"[Debug][Transcript Coverage] {len(entries)} entries, min start: {min(starts):.2f}, max start: {max(starts):.2f}", flush=True)
        if not entries:
            print("No transcript entries found after fetching", flush=True)
            return None
        # Cache by video ID
        transcript_cache[cache_key] = (time.time(), entries)
        print(f"Cached transcript for video ID: {video_id}", flush=True)
        return entries
    except Exception as e:
        print(f"Transcript error: {str(e)}", flush=True)
        print(f"Full error details: {type(e).__name__}: {str(e)}", flush=True)
        return None


def get_video_transcript_chunked(url, start_time, duration):
    # Get cache key for this video
    cache_key = get_cache_key_by_video_id(url)
    cache_entry = transcript_cache.get(cache_key)

    if not is_cache_valid(cache_entry):
        # If no cache, get full transcript and cache it
        entries = get_video_transcript(url)
        if not entries:
            return None
        # Cache the full transcript
        transcript_cache[cache_key] = (time.time(), entries)
    else:
        # Use cached transcript
        entries = cache_entry[1]

    # Get only the chunks we need
    chunk = [entry for entry in entries if start_time <=
             entry['start'] < start_time + duration]

    # Group the chunks by interval
    grouped_segments = group_transcript_by_interval(chunk, 30) if chunk else []

    return {
        'start_time': start_time,
        'end_time': start_time + duration,
        'grouped_segments': grouped_segments
    }


def group_transcript_by_interval(entries, interval=30):
    if not entries or len(entries) == 0:
        return []
    entries = sorted(entries, key=lambda e: e['start'])
    groups = []
    n = len(entries)
    i = 0
    while i < n:
        group_start = entries[i]['start']
        group_text = [entries[i]['text']]
        j = i + 1
        # Add snippets to the group until the next snippet is at least 'interval' seconds after group_start
        while j < n and entries[j]['start'] < group_start + interval:
            group_text.append(entries[j]['text'])
            j += 1
        group_end = entries[j-1]['start'] + entries[j-1]['duration']
        groups.append({
            'startTime': group_start,
            'endTime': group_end,
            'text': ' '.join(group_text)
        })
        i = j
    return groups


def make_response(success, data=None, error=None, status=200):
    resp = {'success': success, 'data': data, 'error': error}
    return jsonify(resp), status


# Background function to fetch and cache the full transcript
def fetch_and_cache_full_transcript(url):
    entries = get_video_transcript(url)
    if entries:
        cache_key = get_cache_key_by_video_id(url)
        transcript_cache[cache_key] = (time.time(), entries)
        print(
            f"[Background] Full transcript cached for video: {url}", flush=True)
    else:
        print(
            f"[Background] Failed to fetch full transcript for video: {url}", flush=True)


@app.route('/video', methods=['POST'])
def get_video():
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return make_response(False, error='Missing URL in payload', status=400)

        url = data['url']
        if not isinstance(url, str) or not url.startswith('http'):
            return make_response(False, error='Invalid video URL', status=400)

        interval = int(data.get('segmentDuration', 30))
        chunk_size = int(data.get('chunkSize', 300))

        try:
            video_info = get_video_info(url)
            if not video_info:
                return make_response(False, error='Failed to get video info', status=400)
        except Exception as e:
            print(f"Error getting video info: {str(e)}", flush=True)
            return make_response(False, error=f'Video info error: {str(e)}', status=500)

        # Only fetch the first 5 minutes (300s) of transcript for initial response
        transcript = None
        last_error = None
        for attempt in range(3):
            try:
                transcript = get_video_transcript(url)
                if transcript:
                    break
            except Exception as e:
                last_error = e
                print(f"Attempt {attempt + 1} failed: {str(e)}", flush=True)
                time.sleep(1)

        if not transcript:
            error_msg = f'No transcript available: {str(last_error)}' if last_error else 'No transcript available'
            print(
                f"Failed to get transcript after 3 attempts: {error_msg}", flush=True)
            return make_response(False, error=error_msg, data={'video_info': video_info}, status=404)

        # Only return first 5 minutes of transcript initially
        initial_chunk = [entry for entry in transcript if entry['start'] < 300]
        grouped_segments = group_transcript_by_interval(
            initial_chunk, interval)

        # Cache the partial transcript
        cache_key = get_cache_key_by_video_id(url)
        partial_transcript_cache[cache_key] = (time.time(), initial_chunk)

        # Start background thread to fetch and cache the full transcript
        def background_fetch():
            fetch_and_cache_full_transcript(url)
        threading.Thread(target=background_fetch, daemon=True).start()

        return make_response(True, data={
            'title': video_info.get('title', ''),
            'uploaded_by': video_info.get('uploader', ''),
            'uploaded_at': video_info.get('upload_date', ''),
            'duration': video_info.get('duration', 0),
            'transcript_chunk': {
                'start_time': 0,
                'end_time': 300,
                'grouped_segments': grouped_segments
            }
        })

    except Exception as e:
        print(f"Error in /video endpoint: {str(e)}", flush=True)
        return make_response(False, error=str(e), status=500)


@app.route('/video/chunk', methods=['POST'])
def get_video_chunk():
    start_time = time.time()
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'startTime' not in data or 'duration' not in data:
            return make_response(False, error='Missing parameters', status=400)

        url = data['url']
        chunk_start_time = int(data['startTime'])
        duration = int(data['duration'])
        interval = int(data.get('segmentDuration', 30))

        print(
            f"[Backend] Processing chunk request - start_time: {chunk_start_time}, duration: {duration}", flush=True)

        if not isinstance(url, str) or not url.startswith('http'):
            return make_response(False, error='Invalid video URL', status=400)

        # Get cache key for this video
        cache_key = get_cache_key_by_video_id(url)
        cache_entry = transcript_cache.get(cache_key)
        partial_entry = partial_transcript_cache.get(cache_key)

        # Serve from full cache if available
        if is_cache_valid(cache_entry):
            full_transcript = cache_entry[1]
            chunk = [entry for entry in full_transcript if chunk_start_time <=
                     entry['start'] < chunk_start_time + duration]
        # Otherwise, serve from partial cache if it covers the requested chunk
        elif is_cache_valid(partial_entry):
            partial_transcript = partial_entry[1]
            chunk = [entry for entry in partial_transcript if chunk_start_time <=
                     entry['start'] < chunk_start_time + duration]
            # If the requested chunk is not yet available, return loading state
            if not chunk:
                print(
                    f"[Backend] Requested chunk not yet available in partial transcript", flush=True)
                return make_response(False, error='Chunk not yet available. Please try again shortly.', status=202)
        else:
            print(
                f"[Backend] No cached transcript for video: {url}", flush=True)
            return make_response(False, error='No transcript available', status=404)

        if not chunk:
            print(
                f"[Backend] No transcript entries found for time range {chunk_start_time}-{chunk_start_time + duration}", flush=True)
            return make_response(False, error='No transcript entries found for this time range', status=404)

        # Group the chunks by interval
        grouped_segments = group_transcript_by_interval(chunk, interval)

        print(
            f"[Backend] Created {len(grouped_segments)} grouped segments for chunk {chunk_start_time}-{chunk_start_time + duration}", flush=True)

        response_time = time.time() - start_time
        print(
            f"[Backend] Chunk processing time: {response_time:.2f}s", flush=True)

        return make_response(True, data={
            'start_time': chunk_start_time,
            'end_time': chunk_start_time + duration,
            'grouped_segments': grouped_segments,
            'processing_time': response_time
        })

    except Exception as e:
        print(
            f"[Backend] Error processing chunk request: {str(e)}", flush=True)
        return make_response(False, error=str(e), status=500)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
