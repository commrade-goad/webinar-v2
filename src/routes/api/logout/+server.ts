import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.set('user', '', {
    path: '/',
    expires: new Date(0),
  });

  return new Response('Logged out', { status: 200 });
};
