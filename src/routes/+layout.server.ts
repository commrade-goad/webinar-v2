import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, url }) => {
    const token = cookies.get('token');
    const allowed = ['/login', '/land'];

    if (!token && !allowed.includes(url.pathname)) {
        throw redirect(303, '/login');
    }
return { user: token ? { name: 'User' } : null }; };