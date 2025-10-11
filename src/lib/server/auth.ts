import jwt from 'jsonwebtoken';
import { PRIVATE_JWT_SECRET } from '$env/static/private';

export interface UserClaims extends jwt.JwtPayload {
	email: string;
	admin: number;
	exp: number;
}

export function decodeUser(cookies: import('@sveltejs/kit').Cookies): UserClaims | null {
	const token = cookies.get('user');
	if (!token) return null;

	try {
		return jwt.verify(token, PRIVATE_JWT_SECRET) as UserClaims;
	} catch {
		return null;
	}
}