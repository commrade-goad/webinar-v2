import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { decodeUser } from '$lib/server/auth';
import type { ApiResponse, EventParticipant } from '$lib/types/api';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {
	const user = decodeUser(cookies);
	if (!user) throw redirect(303, '/login');

	const webinarId = params.id;

	let participantData: Partial<EventParticipant> = {};
	let isRegistered = false;

	try {
		const response = await fetch('/api/get-event-part-info', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: webinarId })
		});

		if (!response.ok) throw new Error(`Error: ${response.status}`);

		const data: ApiResponse<EventParticipant> = await response.json();
		if (data.success && data.data) {
			participantData = data.data;
			isRegistered = true;
		}
	} catch (err) {
		console.error('Error fetching participant data:', err);
	}

	if (!user.admin) {
		if (!isRegistered) throw redirect(303, '/dashboard');
		if (participantData.EventPRole !== 'committee') throw redirect(303, '/dashboard');
	}

	return {
		user,
		participantData,
		isRegistered
	};
};