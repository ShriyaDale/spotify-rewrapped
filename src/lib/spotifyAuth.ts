import { NextRequest, NextResponse } from 'next/server';

export const ACCESS_COOKIE = 'sp_access';
export const REFRESH_COOKIE = 'sp_refresh';
export const STATE_COOKIE = 'sp_state';

const REFRESH_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function secureCookieFromRequest(request: NextRequest) {
  return process.env.NODE_ENV === 'production' || new URL(request.url).protocol === 'https:';
}

export function resolveSpotifyRedirectUri(request: NextRequest) {
  const configured = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (configured) return configured;
  return new URL('/api/auth/callback', request.url).toString();
}

export function setSpotifyStateCookie(response: NextResponse, request: NextRequest, state: string) {
  // Try multiple cookie strategies to ensure state persists through OAuth redirect
  const cookieOptions = {
    httpOnly: false,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10,
  };
  
  // Set primary cookie
  response.cookies.set(STATE_COOKIE, state, cookieOptions);
  
  // Also store in a backup cookie with no restrictions
  response.cookies.set(`${STATE_COOKIE}_backup`, state, {
    ...cookieOptions,
    httpOnly: false,
  });
  
  console.log('[spotifyAuth] Set state cookies:', state);
}

export function clearSpotifyStateCookie(response: NextResponse) {
  response.cookies.delete(STATE_COOKIE);
}

export function setSpotifyAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: { accessToken: string; expiresIn?: number; refreshToken?: string }
) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: secureCookieFromRequest(request),
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.expiresIn ?? 3600,
  });

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: secureCookieFromRequest(request),
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_COOKIE_TTL_SECONDS,
    });
  }
}

export function clearSpotifyAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(STATE_COOKIE);
}