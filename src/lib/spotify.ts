// lib/spotify.ts — server-side Spotify API helpers

const BASE = 'https://api.spotify.com/v1';

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  if (!res.ok) throw new Error('Failed to refresh token');
  return res.json();
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function spotifyFetch(path: string, token: string, useCache = true) {
  const cacheKey = `${token.slice(-10)}:${path}`;
  
  // Check cache first
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
  }

  // Retry with exponential backoff for rate limits
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    
    // Handle rate limiting with exponential backoff
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retries) * 1000;
      
      if (retries < maxRetries) {
        console.log(`[spotify] Rate limited, waiting ${waitMs}ms before retry ${retries + 1}/${maxRetries}`);
        await sleep(waitMs);
        retries++;
        continue;
      } else {
        throw new Error('RATE_LIMITED');
      }
    }
    
    if (!res.ok) throw new Error(`Spotify error ${res.status}`);
    
    const data = await res.json();
    
    // Cache successful responses
    if (useCache) {
      cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
    }
    
    return data;
  }
  
  throw new Error('RATE_LIMITED');
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
