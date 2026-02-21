import { NextRequest, NextResponse } from 'next/server';
import { resolveSpotifyRedirectUri, setSpotifyStateCookie } from '@/lib/spotifyAuth';

export async function GET(request: NextRequest) {
  const scopes = [
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'playlist-read-private',
    'user-read-private',
    'user-read-email',
  ].join(' ');

  const redirectUri = resolveSpotifyRedirectUri(request);
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
  setSpotifyStateCookie(response, request, state);
  
  console.log('[auth/login] Setting state cookie:', {
    state,
    redirectUri,
    requestUrl: request.url,
    hostname: new URL(request.url).hostname
  });
  
  return response;
}
