import { NextRequest, NextResponse } from 'next/server';
import { clearSpotifyAuthCookies } from '@/lib/spotifyAuth';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url));
  clearSpotifyAuthCookies(response);
  return response;
}
