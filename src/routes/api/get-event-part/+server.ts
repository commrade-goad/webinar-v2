import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const token = cookies.get('user');
        if (!token) {
            return new Response('Authentication token not found', { status: 401 });
        }

        const body = await request.json();
        const eventId = body?.id ?? -1;

        if (eventId < 0) {
            return new Response(`Invalid event id is given`, { status: 400 });
        }

        const url = `${env.PRIVATE_API_URL}/api/protected/event-participate-of-event?event_id=${eventId}`;

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
            console.error("Failed to get event part data: ", res.status, errorText);
            return new Response(`Failed to get event part data: ${errorText}`, { status: res.status });
        }

        const responseData = await res.text();
        const contentType = res.headers.get('Content-Type') || 'application/json';

        // IF error code 5 then it didnt exist!
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
