import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.email || body.email.trim() === '') {
      return new Response('Email is required', { status: 400 });
    }
    
    const encodedEmail = encodeURIComponent(body.email);
    const url = `${env.PRIVATE_API_URL}/api/gen-otp-for-register?email=${encodedEmail}`;
    
    console.log("Sending request to:", url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OTP generation failed with status:", res.status, errorText);
      return new Response(`Failed to generate OTP Code: ${errorText}`, { status: res.status });
    }

    return new Response('OTP sent successfully', { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};