import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const b64 = body?.b64 ?? "";
    
    if (b64.lenght <= 0) {
      return new Response(`Invalid base64 is given`, { status: 400 });
    }
    const url = `${env.PRIVATE_API_URL}/api/certificate/${b64}`;
    
    console.log("Sending request to:", url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(res);
      return new Response(errorText, { status: res.status });
    }

    // Get the HTML content
    const html = await res.text();
    
    // Return the HTML content with appropriate headers
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (err) {
    console.error('API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};