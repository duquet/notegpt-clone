import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Simple in-memory rate limiting (per IP, resets every 15 min)
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 20; // max requests per window
const rateLimitMap = new Map();

function getClientIp(request: Request): string {
  // Try to get IP from headers (works for Vercel)
  // Fallback to empty string if not found
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    // Reset window
    entry = { count: 1, start: now };
    rateLimitMap.set(ip, entry);
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  // Debug log to confirm key is loaded
  console.log("Loaded OpenAI key:", process.env.OPENAI_API_KEY?.slice(0, 8));
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Validation
  if (!data || typeof data.transcript !== "string" || !data.transcript.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid 'transcript' field." },
      { status: 400 }
    );
  }
  const transcript = data.transcript.trim();
  const options = data.options || {};
  const templateType = options.templateType || "default";
  const customPrompt = options.customPrompt;
  const systemPrompt = options.systemPrompt;

  // Compose prompt
  let userPrompt =
    customPrompt ||
    "Summarize the following content in a clear, concise way highlighting the main points and key insights.\n\n{transcript}";
  userPrompt = userPrompt.replace("{transcript}", transcript);
  const sysPrompt =
    systemPrompt || "You are a helpful assistant that summarizes content.";

  // OpenAI call
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    const summary = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ summary, templateType });
  } catch (error: unknown) {
    console.error("[Summarize API] OpenAI error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}
