// lib/spotify.ts — server-side Spotify API helpers

const BASE = 'https://api.spotify.com/v1';

export type SpotifyRefreshResponse = {
  access_token: string;
  token_type: 'Bearer';
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Failed to refresh token (${res.status}): ${details}`);
  }
  return res.json() as Promise<SpotifyRefreshResponse>;
}

export async function spotifyFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (!res.ok) throw new Error(`Spotify error ${res.status}`);
  return res.json();
}

export async function getTopArtists(token: string, timeRange = 'medium_term', limit = 20) {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, token);
}

export async function getTopTracks(token: string, timeRange = 'medium_term', limit = 20) {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, token);
}

export async function getRecentlyPlayed(token: string, limit = 50) {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`, token);
}

export async function getAudioFeatures(token: string, trackIds: string[]) {
  const ids = trackIds.slice(0, 100).join(',');
  return spotifyFetch(`/audio-features?ids=${ids}`, token);
}

export async function getMe(token: string) {
  return spotifyFetch('/me', token);
}

export async function searchSpotify(token: string, q: string, type = 'track,artist', limit = 10) {
  return spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`, token);
}

export async function getRecommendations(token: string, seedArtists: string[], seedGenres: string[]) {
  const params = new URLSearchParams({
    limit: '10',
    seed_artists: seedArtists.slice(0, 2).join(','),
    seed_genres: seedGenres.slice(0, 3).join(','),
  });
  return spotifyFetch(`/recommendations?${params}`, token);
}
