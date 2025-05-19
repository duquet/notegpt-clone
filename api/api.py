# The following code is copied from backend/app.py to unify backend logic in api/api.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import time
from functools import wraps

app = Flask(__name__)
CORS(app)


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


@retry_on_failure(max_retries=3, delay=1)
def get_video_transcript(url, start_time=None, duration=None):
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Failed to extract video ID from URL: {url}")
        return None
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


@app.route('/video', methods=['POST'])
def get_video():
    try:
        data = request.get_json()
        print(f"[DEBUG] Incoming /video payload: {data}")
        if not data or 'url' not in data:
            print("[ERROR] Missing URL in payload")
            return jsonify({'error': 'Missing URL'}), 400

        url = data['url']
        interval = int(data.get('segmentDuration', 30))
        chunk_size = int(data.get('chunkSize', 300))

        print(
            f"[DEBUG] Processing video URL: {url} (segment interval: {interval}s, chunk size: {chunk_size}s)")

        # Get video info with retry
        try:
            video_info = get_video_info(url)
            if not video_info:
                print("[ERROR] Failed to get video info")
                return jsonify({'error': 'Failed to get video info'}), 400
            print(f"[DEBUG] Video info retrieved: {video_info}")
        except Exception as e:
            print(f"[ERROR] Video info error: {str(e)}")
            return jsonify({'error': 'Failed to get video info', 'details': str(e)}), 500

        # Get transcript with retry and detailed error handling
        transcript = None
        last_error = None
        for attempt in range(3):  # 3 retries
            try:
                print(f"[DEBUG] Transcript fetch attempt {attempt + 1}/3")
                transcript = get_video_transcript(url, 0, chunk_size)
                if transcript:
                    print(
                        f"[DEBUG] Successfully fetched transcript with {len(transcript)} entries")
                    break
                else:
                    print(
                        f"[WARN] Empty transcript returned on attempt {attempt + 1}")
            except NoTranscriptFound as e:
                last_error = e
                print(
                    f"[ERROR] No transcript found (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'No transcript found',
                        'details': str(e),
                        'video_info': video_info
                    }), 404
            except TranscriptsDisabled as e:
                last_error = e
                print(
                    f"[ERROR] Transcripts disabled (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'Transcripts are disabled',
                        'details': str(e),
                        'video_info': video_info
                    }), 403
            except Exception as e:
                last_error = e
                print(
                    f"[ERROR] Transcript error (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'Transcript error',
                        'details': str(e),
                        'video_info': video_info
                    }), 500
            time.sleep(1)  # Wait before retry

        if not transcript:
            print("[ERROR] Failed to get transcript after all retries")
            return jsonify({
                'error': 'No transcript available',
                'details': str(last_error) if last_error else 'Unknown error',
                'video_info': video_info
            }), 404

        # Process transcript segments
        try:
            grouped_segments = group_transcript_by_interval(
                transcript, interval)
            print(f"[DEBUG] Created {len(grouped_segments)} grouped segments")
        except Exception as e:
            print(f"[ERROR] Failed to group transcript segments: {str(e)}")
            return jsonify({
                'error': 'Failed to process transcript',
                'details': str(e),
                'video_info': video_info
            }), 500

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
        print(f"[DEBUG] Successfully processed video request for: {url}")
        return jsonify(response_data)

    except Exception as e:
        print(f"[ERROR] Unexpected error in /video endpoint: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@app.route('/video/chunk', methods=['POST'])
def get_video_chunk():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'startTime' not in data or 'duration' not in data:
            return jsonify({'error': 'Missing parameters'}), 400

        url = data['url']
        start_time = int(data['startTime'])
        duration = int(data['duration'])
        interval = int(data.get('segmentDuration', 30))

        print(
            f"Processing chunk: {url}, start={start_time}, duration={duration}, segment interval: {interval}s")

        video_info = get_video_info(url)
        if not video_info:
            print("Failed to get video info for chunk")
            return jsonify({'error': 'Failed to get video info'}), 400

        chunk = get_video_transcript(url, start_time, duration)
        if chunk is None:
            print("Failed to get transcript chunk")
            return jsonify({'error': 'Failed to get transcript chunk'}), 400

        print("Transcript chunk retrieved successfully")
        grouped_segments = group_transcript_by_interval(chunk, interval)

        return jsonify({
            'grouped_segments': grouped_segments,
            'start_time': start_time,
            'end_time': min(start_time + duration, video_info['duration']),
            'segment_duration': interval,
            'total_duration': video_info['duration']
        })
    except Exception as e:
        print(f"Error in /video/chunk endpoint: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
