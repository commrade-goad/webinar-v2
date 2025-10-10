import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
    const token = cookies.get('user');

    if (token) {
        throw redirect(303, '/dashboard');
    }
return { user: token ? { name: 'User' } : null }; };