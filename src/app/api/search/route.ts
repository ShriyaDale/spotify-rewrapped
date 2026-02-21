import { NextRequest, NextResponse } from 'next/server';
import { searchSpotify, refreshAccessToken } from '@/lib/spotify';
import { setSpotifyAuthCookies } from '@/lib/spotifyAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'no query' }, { status: 400 });

  let token = request.cookies.get('sp_access')?.value;
  const refresh = request.cookies.get('sp_refresh')?.value;
  let refreshedAccessToken: string | null = null;
  let refreshedRefreshToken: string | null = null;
  let refreshedExpiresIn: number | undefined;

  if (!token && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    token = refreshed.access_token || undefined;
    refreshedAccessToken = refreshed.access_token || null;
    refreshedRefreshToken = refreshed.refresh_token ?? null;
    refreshedExpiresIn = refreshed.expires_in;
  }
  if (!token) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  try {
    let results;
    try {
      results = await searchSpotify(token, q, 'track,artist', 10);
    } catch (error: any) {
      if (error?.message === 'UNAUTHORIZED' && refresh) {
        const refreshed = await refreshAccessToken(refresh);
        token = refreshed.access_token || undefined;
        refreshedAccessToken = refreshed.access_token || null;
        refreshedRefreshToken = refreshed.refresh_token ?? null;
        refreshedExpiresIn = refreshed.expires_in;
        if (!token) throw new Error('Token refresh failed: no access token');
        results = await searchSpotify(token, q, 'track,artist', 10);
      } else {
        throw error;
      }
    }

    const response = NextResponse.json(results);
    if (refreshedAccessToken) {
      setSpotifyAuthCookies(response, request, {
        accessToken: refreshedAccessToken,
        refreshToken: refreshedRefreshToken ?? undefined,
        expiresIn: refreshedExpiresIn,
      });
    }

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
