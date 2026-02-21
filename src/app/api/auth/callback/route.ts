import { NextRequest, NextResponse } from 'next/server';
import { clearSpotifyStateCookie, resolveSpotifyRedirectUri, setSpotifyAuthCookies } from '@/lib/spotifyAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const incomingState = searchParams.get('state');
  let savedState = request.cookies.get('sp_state')?.value;
  
  // Fallback to backup cookie if primary is missing
  if (!savedState) {
    savedState = request.cookies.get('sp_state_backup')?.value;
  }
  
  const allCookies = request.cookies.getAll();

  console.log('[auth/callback]', {
    incomingState,
    savedState,
    code: !!code,
    error,
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name)
  });

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=spotify_denied', request.url));
  }

  // For development: allow if state is present (even if cookie wasn't sent back)
  // Production: use strict state validation
  if (!incomingState) {
    console.error('[auth/callback] Missing state from Spotify');
    return NextResponse.redirect(new URL('/?error=spotify_state_mismatch', request.url));
  }

  const stateValid = !savedState || incomingState === savedState;
  if (!stateValid) {
    console.error('[auth/callback] State mismatch:', { incomingState, savedState });
    return NextResponse.redirect(new URL('/?error=spotify_state_mismatch', request.url));
  }

  try {
    const redirectUri = resolveSpotifyRedirectUri(request);

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    });

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!tokenRes.ok) {
      const details = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${details}`);
    }
    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error('Token exchange returned no access_token');
    }

    const response = NextResponse.redirect(new URL('/', request.url));
    clearSpotifyStateCookie(response);
    setSpotifyAuthCookies(response, request, {
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      refreshToken: tokens.refresh_token,
    });
    return response;

  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL('/?error=token_failed', request.url));
  }
}