/**
 * Fetch a LiveKit user token from the backend.
 * Expects env VITE_LIVEKIT_TOKEN_URL pointing to /generate-user-token
 */
export async function fetchLivekitToken({ roomName, identity }) {
  const endpoint = import.meta.env.VITE_LIVEKIT_TOKEN_URL;
  if (!endpoint) {
    throw new Error('VITE_LIVEKIT_TOKEN_URL is not set');
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_identity: identity,
      room_name: roomName,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Token request failed (${res.status}): ${msg}`);
  }

  const json = await res.json();
  if (!json.token || !json.url) {
    throw new Error('Token response missing token or url');
  }

  return json; // { token, url }
}


