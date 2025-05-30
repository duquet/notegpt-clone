import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Get request data from frontend
    const requestData = await req.json();
    
    console.log('[Next.js API] Proxying summarize request to Python backend:', requestData);

    // Proxy request to Python backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://notegpt-clone.onrender.com";
    const backendResponse = await fetch(`${apiUrl}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('[Next.js API] Backend summarize request failed:', errorData);
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    console.log('[Next.js API] Successfully proxied summarize request');
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[Next.js API] Error in summarize proxy:', error);
    return NextResponse.json(
      { error: 'Failed to process summary request' },
      { status: 500 }
    );
  }
} 