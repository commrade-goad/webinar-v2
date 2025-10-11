import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('user');
    if (!token) {
      return new Response('Authentication token not found', { status: 401 });
    }
    
    const url = `${env.PRIVATE_API_URL}/api/protected/user-info`;
   
    console.log("Sending request to:", url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(`Failed to get user info: ${errorText}`, { status: res.status });
    }

    const responseData = await res.text();
    const contentType = res.headers.get('Content-Type') || 'application/json';
    
    return new Response(responseData, { 
      status: res.status,
      headers: {
        'Content-Type': contentType
      }
    });
  } catch (err) {
    console.error('API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};