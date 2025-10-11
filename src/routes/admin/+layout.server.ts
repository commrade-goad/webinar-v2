import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { decodeUser } from '$lib/server/auth';

export const load: LayoutServerLoad = ({ cookies }) => {
    const user = decodeUser(cookies);
	if (!user) throw redirect(303, '/login');
    if (!user.admin) throw redirect(303, '/dashboard');
};
