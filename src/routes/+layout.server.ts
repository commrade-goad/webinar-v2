import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import jwt from 'jsonwebtoken';
import { PRIVATE_JWT_SECRET } from '$env/static/private';

export const load: LayoutServerLoad = ({ cookies, url }) => {
    const token = cookies.get('user');
    const allowed = ['/login', '/land', '/register', '/cert-view'];

    if (!token && !allowed.includes(url.pathname)) {
        throw redirect(303, '/login');
    }

	if (token) {
		try {
			const decoded = jwt.verify(token, PRIVATE_JWT_SECRET) as jwt.JwtPayload;
			return { user: decoded };
		} catch {
			throw redirect(303, '/login');
		}
	}
return { user: null }; };