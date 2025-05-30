import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Next.js API] Proxying templates request to Python backend');

    // Proxy request to Python backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://notegpt-clone.onrender.com";
    const backendResponse = await fetch(`${apiUrl}/api/templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('[Next.js API] Backend templates request failed:', errorData);
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    console.log('[Next.js API] Successfully proxied templates request');
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[Next.js API] Error in templates proxy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
} 