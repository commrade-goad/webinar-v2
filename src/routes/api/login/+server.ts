import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    const url = `${env.PRIVATE_API_URL}/api/login`;
    console.log(url, body);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      const realError = JSON.parse(errorText);
      return new Response(realError.message, { status: 401 });
    }

    const data = await res.json();

    cookies.set('user', data.token, {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24
    });

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};