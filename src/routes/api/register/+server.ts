import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    const url = `${env.PRIVATE_API_URL}/api/register`;
    console.log(url, body);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(errorText, { status: 401 });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};