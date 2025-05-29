import os
import json
import openai
from functools import wraps
import time
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import re
import yt_dlp
from flask_cors import CORS
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests
import random
import uuid
load_dotenv()

# Debug environment variables at startup
print("\n[DEBUG] Environment Variables Check:")
print("-----------------------------------")
print(f"NEXT_PUBLIC_API_URL: {os.environ.get('NEXT_PUBLIC_API_URL')}")
print(f"OPENAI_API_KEY: {'Set' if os.environ.get('OPENAI_API_KEY') else 'Not Set'}")

if os.environ.get('USE_WEBSHARE_PROXY', 'false').lower() == 'true':
    print("[Proxy] Using Webshare Proxy")
    print(f"WEBSHARE_PROXY_USERNAME: {os.environ.get('WEBSHARE_PROXY_USERNAME')}")
    print(f"WEBSHARE_PROXY_HOST: {os.environ.get('WEBSHARE_PROXY_HOST')}")
    print(f"WEBSHARE_PROXY_PORT: {os.environ.get('WEBSHARE_PROXY_PORT')}")
elif os.environ.get('USE_DECODO_PROXY', 'false').lower() == 'true':
    print("[Proxy] Using Decodo Proxy")
    print(f"DECODO_PROXY_HOST: {os.environ.get('DECODO_PROXY_HOST')}")
    print(f"DECODO_PROXY_USERNAME: {os.environ.get('DECODO_PROXY_USERNAME')}")
    print(f"DECODO_PROXY_PORT_MIN: {os.environ.get('DECODO_PROXY_PORT_MIN')}")
    print(f"DECODO_PROXY_PORT_MAX: {os.environ.get('DECODO_PROXY_PORT_MAX')}")
else:
    print("[Proxy] No proxy in use.")
print("-----------------------------------\n")

# Webshare proxy rotation setup
BASE_USERNAME = os.environ.get('WEBSHARE_PROXY_USERNAME')
if not BASE_USERNAME:
    print("[ERROR] WEBSHARE_PROXY_USERNAME is not set!")
USERNAMES = [f"{BASE_USERNAME}-{i}" for i in range(1, 11)]
PASSWORD = os.environ.get('WEBSHARE_PROXY_PASSWORD')
if not PASSWORD:
    print("[ERROR] WEBSHARE_PROXY_PASSWORD is not set!")
PROXY_HOST = os.environ.get('WEBSHARE_PROXY_HOST')
if not PROXY_HOST:
    print("[ERROR] WEBSHARE_PROXY_HOST is not set!")
PROXY_PORT = os.environ.get('WEBSHARE_PROXY_PORT')
if not PROXY_PORT:
    print("[ERROR] WEBSHARE_PROXY_PORT is not set!")

# Add USE_PROXY toggle
USE_PROXY = os.environ.get('USE_PROXY', 'true').lower() == 'true'

# Decodo proxy setup
def get_decodo_proxy():
    use_decodo = os.environ.get('USE_DECODO_PROXY', 'false').lower() == 'true'
    if not use_decodo:
        return None
    host = os.environ.get('DECODO_PROXY_HOST')
    username = os.environ.get('DECODO_PROXY_USERNAME')
    password = os.environ.get('DECODO_PROXY_PASSWORD')
    port_min = int(os.environ.get('DECODO_PROXY_PORT_MIN', 10001))
    port_max = int(os.environ.get('DECODO_PROXY_PORT_MAX', 10010))
    port = random.randint(port_min, port_max)
    proxy_url = f"http://{username}:{password}@{host}:{port}"
    print(f"[Decodo Proxy] Using proxy: {proxy_url}")
    return proxy_url

def get_random_user_agent():
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
    ]
    return random.choice(user_agents)


def get_random_proxy():
    username = random.choice(USERNAMES)
    proxy = f"http://{username}:{PASSWORD}@{PROXY_HOST}:{PROXY_PORT}"
    print(f"[DEBUG] Generated new proxy: {proxy}")
    return proxy


def set_residential_proxy():
    use_webshare = os.environ.get('USE_WEBSHARE_PROXY', 'false').lower() == 'true'
    use_decodo = os.environ.get('USE_DECODO_PROXY', 'false').lower() == 'true'

    if use_webshare:
        proxy = get_random_proxy()
        os.environ['http_proxy'] = proxy
        os.environ['https_proxy'] = proxy
        print(f"[Proxy] Using Webshare proxy: {proxy}")
        return proxy
    elif use_decodo:
        proxy = get_decodo_proxy()
        if proxy:
            os.environ['http_proxy'] = proxy
            os.environ['https_proxy'] = proxy
            print(f"[Proxy] Using Decodo proxy: {proxy}")
            return proxy
        else:
            print("[Proxy] Decodo proxy requested but not configured properly.")
            return None
    else:
        print("[Proxy] Proxy usage disabled.")
        return None

# The following code is copied from backend/app.py to unify backend logic in api/api.py


app = Flask(__name__)
CORS(app, origins="*", supports_credentials=False)

# Load summary prompts from backend copy
with open('summaryPrompts.json', 'r') as f:
    SUMMARY_PROMPTS = json.load(f)

openai.api_key = os.environ.get("OPENAI_API_KEY")

# Add this line to ensure the app is properly configured for production
app.config['JSON_AS_ASCII'] = False


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
    proxy = set_residential_proxy()
    if proxy:
        print(f"[DEBUG] Using proxy for video info: {proxy}")
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'extract_flat': True,
            'force_generic_extractor': False,
            'proxy': proxy,
            'http_headers': {
                'User-Agent': get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-us,en;q=0.5',
                'Sec-Fetch-Mode': 'navigate',
            },
            'cookiefile': 'www.youtube.com_cookies.txt',  # Use cookies for yt-dlp
        }
    else:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'extract_flat': True,
            'force_generic_extractor': False,
            'http_headers': {
                'User-Agent': get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-us,en;q=0.5',
                'Sec-Fetch-Mode': 'navigate',
            },
            'cookiefile': 'www.youtube.com_cookies.txt',  # Use cookies for yt-dlp
        }

    print("[DEBUG] Attempting to fetch video info with yt-dlp")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            print("[DEBUG] Successfully fetched video info")
            return {
                'title': info.get('title'),
                'uploaded_by': info.get('uploader'),
                'uploaded_at': info.get('upload_date'),
                'duration': info.get('duration'),
            }
    except Exception as e:
        print(f"[ERROR] Video info error: {str(e)}")
        raise


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
    proxy = set_residential_proxy()
    if proxy:
        print(f"[DEBUG] Using proxy for transcript: {proxy}")
    else:
        print("[Proxy] Proxy usage disabled.")

    video_id = extract_video_id(url)
    if not video_id:
        print(f"Failed to extract video ID from URL: {url}")
        return None
    try:
        print(f"Fetching transcript for video ID: {video_id}")
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
        entries = [{'text': entry.text, 'start': entry.start,
                    'duration': entry.duration} for entry in entries]
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


@app.route('/video', methods=['POST', 'OPTIONS'])
def get_video():
    if request.method == 'OPTIONS':
        response = jsonify({'ok': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    # Generate a unique request ID for tracking
    request_id = str(uuid.uuid4())[:8]
    print(f"[{request_id}] Received /video request")

    try:
        data = request.get_json()
        print(f"[{request_id}] Request payload: {json.dumps(data, indent=2)}")

        if not data or 'url' not in data:
            print(f"[{request_id}] [ERROR] Missing URL in payload")
            return jsonify({
                'error': 'Missing URL',
                'request_id': request_id,
                'details': 'The request must include a YouTube URL'
            }), 400

        url = data['url']
        interval = int(data.get('segmentDuration', 30))
        chunk_size = int(data.get('chunkSize', 300))

        print(f"[{request_id}] Processing video URL: {url}")
        print(
            f"[{request_id}] Parameters: interval={interval}s, chunk_size={chunk_size}s")

        # Get video info with retry
        try:
            print(f"[{request_id}] Fetching video info...")
            video_info = get_video_info(url)
            if not video_info:
                print(f"[{request_id}] [ERROR] Failed to get video info")
                return jsonify({
                    'error': 'Failed to get video info',
                    'request_id': request_id,
                    'details': 'Could not retrieve video metadata'
                }), 400
            print(
                f"[{request_id}] Video info retrieved: {json.dumps(video_info, indent=2)}")
        except Exception as e:
            print(f"[{request_id}] [ERROR] Video info error: {str(e)}")
            return jsonify({
                'error': 'Failed to get video info',
                'request_id': request_id,
                'details': str(e),
                'type': type(e).__name__
            }), 500

        # Get transcript with retry and detailed error handling
        transcript = None
        last_error = None
        for attempt in range(3):  # 3 retries
            try:
                print(f"[{request_id}] Transcript fetch attempt {attempt + 1}/3")
                transcript = get_video_transcript(url, 0, chunk_size)
                if transcript:
                    print(
                        f"[{request_id}] Successfully fetched transcript with {len(transcript)} entries")
                    break
                else:
                    print(
                        f"[{request_id}] [WARN] Empty transcript returned on attempt {attempt + 1}")
            except NoTranscriptFound as e:
                last_error = e
                print(
                    f"[{request_id}] [ERROR] No transcript found (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'No transcript found',
                        'request_id': request_id,
                        'details': str(e),
                        'video_info': video_info,
                        'type': 'NoTranscriptFound'
                    }), 404
            except TranscriptsDisabled as e:
                last_error = e
                print(
                    f"[{request_id}] [ERROR] Transcripts disabled (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'Transcripts are disabled',
                        'request_id': request_id,
                        'details': str(e),
                        'video_info': video_info,
                        'type': 'TranscriptsDisabled'
                    }), 403
            except Exception as e:
                last_error = e
                print(
                    f"[{request_id}] [ERROR] Transcript error (attempt {attempt + 1}): {str(e)}")
                if attempt == 2:  # Last attempt
                    return jsonify({
                        'error': 'Transcript error',
                        'request_id': request_id,
                        'details': str(e),
                        'video_info': video_info,
                        'type': type(e).__name__
                    }), 500
            time.sleep(1)  # Wait before retry

        if not transcript:
            print(
                f"[{request_id}] [ERROR] Failed to get transcript after all retries")
            return jsonify({
                'error': 'No transcript available',
                'request_id': request_id,
                'details': str(last_error) if last_error else 'Unknown error',
                'video_info': video_info,
                'type': type(last_error).__name__ if last_error else 'Unknown'
            }), 404

        # Process transcript segments
        try:
            print(f"[{request_id}] Processing transcript segments...")
            grouped_segments = group_transcript_by_interval(
                transcript, interval)
            print(f"[{request_id}] Created {len(grouped_segments)} grouped segments")
        except Exception as e:
            print(
                f"[{request_id}] [ERROR] Failed to group transcript segments: {str(e)}")
            return jsonify({
                'error': 'Failed to process transcript',
                'request_id': request_id,
                'details': str(e),
                'video_info': video_info,
                'type': type(e).__name__
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
            },
            'request_id': request_id
        }
        print(f"[{request_id}] Successfully processed video request for: {url}")
        return jsonify(response_data)

    except Exception as e:
        print(f"[{request_id}] [ERROR] Unexpected error in /video endpoint: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'request_id': request_id,
            'details': str(e),
            'type': type(e).__name__
        }), 500


@app.route('/video/chunk', methods=['POST', 'OPTIONS'])
def get_video_chunk():
    if request.method == 'OPTIONS':
        response = jsonify({'ok': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
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


@app.route('/api/summarize', methods=['POST', 'OPTIONS'])
def summarize():
    if request.method == 'OPTIONS':
        response = jsonify({'ok': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    print("[DEBUG] /api/summarize endpoint called")
    data = request.get_json()
    print(f"[DEBUG] Incoming data: {data}")
    transcript = data.get('transcript')
    options = data.get('options', {})

    # Determine template type and customizations
    template_type = "default"
    custom_prompt = None
    custom_title = None
    system_prompt = None

    if isinstance(options, dict):
        template_type = options.get("templateType", "default")
        custom_prompt = options.get("customPrompt")
        custom_title = options.get("customTitle")
        system_prompt = options.get("systemPrompt")
    elif isinstance(options, str):
        template_type = options

    print(f"[DEBUG] Using template_type: {template_type}")

    # Get prompt config from summaryPrompts.json
    prompt_config = SUMMARY_PROMPTS.get(
        template_type, SUMMARY_PROMPTS["default"])
    system_prompt = system_prompt or prompt_config.get("systemPrompt", "")
    user_prompt = prompt_config.get("userPrompt", "")

    # If a custom prompt is provided, use it
    if custom_prompt:
        user_prompt = custom_prompt

    # Format the user prompt with the transcript
    user_prompt = user_prompt.replace("{transcript}", transcript)

    # Compose OpenAI messages
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    print(
        f"[DEBUG] Calling OpenAI with system prompt: {system_prompt[:100]}...")
    print(f"[DEBUG] User prompt (first 100 chars): {user_prompt[:100]}...")

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if you have access
            messages=messages,
            max_tokens=1500,
            temperature=0.7,
        )
        summary = response.choices[0].message.content.strip()
        print("[DEBUG] OpenAI call successful, returning summary.")
        return jsonify({"summary": summary})
    except Exception as e:
        print(f"[ERROR] OpenAI call failed: {e}")
        return jsonify({"error": str(e)}), 500


# Modify the main block to handle both development and production
if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)), debug=True)
else:
    # For production (Gunicorn)
    gunicorn_app = app
