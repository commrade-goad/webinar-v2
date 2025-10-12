import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get('user');
    if (!token) {
      return new Response('Authentication token not found', { status: 401 });
    }

    const b = await request.json();
    
    // Create URL with parameters, handling undefined values
    const params = new URLSearchParams();
    
    // Only add parameters that are defined
    if (b.limit !== undefined) params.append('limit', b.limit.toString());
    if (b.offset !== undefined) params.append('offset', b.offset.toString());
    if (b.search) params.append('search', b.search);
    if (b.sort) params.append('sort', b.sort);
    
    const url = `${env.PRIVATE_API_URL}/api/protected/user-search?${params.toString()}`;
   
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
      return new Response(`Failed to get search user: ${errorText}`, { status: res.status });
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
