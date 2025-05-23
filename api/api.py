# The following code is copied from backend/app.py to unify backend logic in api/api.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import time
from functools import wraps
import hashlib

app = Flask(__name__)
CORS(app)

# Cache for successful transcript results
transcript_cache = {}
CACHE_TTL = 3600  # Cache TTL in seconds (1 hour)


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
                        f"Attempt {attempt + 1}/{max_retries} failed: {str(e)}")
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


@retry_on_failure(max_retries=3, delay=1)
def get_video_transcript(url, start_time=None, duration=None):
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Failed to extract video ID from URL: {url}")
        return None

    # Check cache first
    cache_key = get_cache_key(url, start_time, duration)
    cache_entry = transcript_cache.get(cache_key)
    if is_cache_valid(cache_entry):
        print(f"Using cached transcript for video ID: {video_id}")
        return cache_entry[1]

    try:
        print(f"Fetching transcript for video ID: {video_id}")
        # Try to get the English transcript first, then fallback
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript(['en'])
            print("Found English transcript")
        except (NoTranscriptFound, TranscriptsDisabled) as e:
            print(
                f"English transcript not found, trying manually created: {str(e)}")
            try:
                transcript = transcript_list.find_manually_created_transcript(
                    transcript_list._manually_created_transcripts.keys())
                print("Found manually created transcript")
            except Exception as e:
                print(f"No transcript found: {str(e)}")
                return None

        entries = transcript.fetch()
        print(f"Successfully fetched {len(entries)} transcript entries")

        # Convert FetchedTranscriptSnippet objects to dictionaries
        entries = [{'text': entry.text, 'start': entry.start,
                    'duration': entry.duration} for entry in entries]

        # If start_time and duration are provided, filter entries
        if start_time is not None and duration is not None:
            entries = [entry for entry in entries if start_time <=
                       entry['start'] < start_time + duration]
            print(
                f"Filtered to {len(entries)} entries for time range {start_time}-{start_time + duration}")

        if not entries:
            print("No transcript entries found after filtering")
            return None

        # Only cache if we have valid entries
        if entries:
            transcript_cache[cache_key] = (time.time(), entries)
            print(f"Cached transcript for video ID: {video_id}")

        return entries
    except Exception as e:
        print(f"Transcript error: {str(e)}")
        print(f"Full error details: {type(e).__name__}: {str(e)}")
        return None


def get_video_transcript_chunked(url, start_time, duration):
    entries = get_video_transcript(url)
    if not entries:
        return None
    chunk = [entry for entry in entries if start_time <=
             entry['start'] < start_time + duration]
    return chunk


def group_transcript_by_interval(entries, interval=30):
    if not entries or len(entries) == 0:
        return []

    # Pre-allocate the list with estimated size
    # Assuming ~5 seconds per entry
    estimated_groups = len(entries) // (interval // 5)
    grouped = []
    grouped.reserve(estimated_groups) if hasattr(grouped, 'reserve') else None

    current_group = {
        'startTime': entries[0]['start'],
        'endTime': entries[0]['start'] + interval,
        'text': entries[0]['text']
    }

    for entry in entries[1:]:
        if entry['start'] >= current_group['endTime']:
            # Save current group and start a new one
            grouped.append(current_group)
            current_group = {
                'startTime': entry['start'],
                'endTime': entry['start'] + interval,
                'text': entry['text']
            }
        else:
            # Add to current group
            current_group['text'] += ' ' + entry['text']

    # Add the last group
    grouped.append(current_group)
    return grouped


def make_response(success, data=None, error=None, status=200):
    resp = {'success': success, 'data': data, 'error': error}
    return jsonify(resp), status


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
            print(f"Error getting video info: {str(e)}")
            return make_response(False, error=f'Video info error: {str(e)}', status=500)

        transcript = None
        last_error = None
        for attempt in range(3):
            try:
                transcript = get_video_transcript(url, 0, chunk_size)
                if transcript:
                    break
            except Exception as e:
                last_error = e
                print(f"Attempt {attempt + 1} failed: {str(e)}")
                time.sleep(1)  # Add delay between retries

        if not transcript:
            error_msg = f'No transcript available: {str(last_error)}' if last_error else 'No transcript available'
            print(f"Failed to get transcript after 3 attempts: {error_msg}")
            return make_response(False, error=error_msg, data={'video_info': video_info}, status=404)

        try:
            grouped_segments = group_transcript_by_interval(
                transcript, interval)
            if not grouped_segments:
                return make_response(False, error='Failed to process transcript: No segments generated', data={'video_info': video_info}, status=500)
        except Exception as e:
            print(f"Error processing transcript: {str(e)}")
            return make_response(False, error=f'Failed to process transcript: {str(e)}', data={'video_info': video_info}, status=500)

        response_data = {
            'title': video_info['title'],
            'uploaded_by': video_info['uploaded_by'],
            'uploaded_at': video_info['uploaded_at'],
            'duration': video_info['duration'],
            'transcript_chunk': {
                'grouped_segments': grouped_segments,
                'start_time': 0,
                'end_time': min(chunk_size, video_info['duration']),
                'segment_duration': interval,
                'total_duration': video_info['duration'],
                'chunk_size': chunk_size
            }
        }
        return make_response(True, data=response_data)
    except Exception as e:
        print(f"Unexpected error in /video endpoint: {str(e)}")
        return make_response(False, error=f'Internal server error: {str(e)}', status=500)


@app.route('/video/chunk', methods=['POST'])
def get_video_chunk():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'startTime' not in data or 'duration' not in data:
            return make_response(False, error='Missing parameters', status=400)

        url = data['url']
        start_time = int(data['startTime'])
        duration = int(data['duration'])
        interval = int(data.get('segmentDuration', 30))

        if not isinstance(url, str) or not url.startswith('http'):
            return make_response(False, error='Invalid video URL', status=400)

        video_info = get_video_info(url)
        if not video_info:
            return make_response(False, error='Failed to get video info', status=400)

        chunk = get_video_transcript(url, start_time, duration)
        if chunk is None:
            return make_response(False, error='Failed to get transcript chunk', status=400)

        grouped_segments = group_transcript_by_interval(chunk, interval)
        response_data = {
            'grouped_segments': grouped_segments,
            'start_time': start_time,
            'end_time': min(start_time + duration, video_info['duration']),
            'segment_duration': interval,
            'total_duration': video_info['duration']
        }
        return make_response(True, data=response_data)
    except Exception as e:
        return make_response(False, error=f'Error in /video/chunk endpoint: {str(e)}', status=500)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
