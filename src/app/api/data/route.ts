import { NextRequest, NextResponse } from 'next/server';
import { getMe, getTopArtists, getTopTracks, getRecentlyPlayed, refreshAccessToken, getAudioFeatures } from '@/lib/spotify';
import { computeGenreMix, computeIntensity, computeDrift, buildCountryAvailability, generatePredictions } from '@/lib/analytics';
import { setSpotifyAuthCookies } from '@/lib/spotifyAuth';

async function getToken(request: NextRequest) {
  let token = request.cookies.get('sp_access')?.value;
  const refresh = request.cookies.get('sp_refresh')?.value;
  let refreshedAccessToken: string | null = null;
  let refreshedRefreshToken: string | null = null;
  let expiresIn: number | undefined;

  if (!token && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    token = refreshed.access_token || undefined;
    refreshedAccessToken = refreshed.access_token || null;
    refreshedRefreshToken = refreshed.refresh_token ?? null;
    expiresIn = refreshed.expires_in;
  }

  return { token, refresh, refreshedAccessToken, refreshedRefreshToken, expiresIn };
}

function computeDNAFromAvailable(tracks: any[], artists: any[]) {
  if (!tracks.length) return { groove: 0.5, brightness: 0.5, heat: 0.5, pace: 0.5 };
  const allGenres = artists.flatMap((a: any) => a.genres || []).join(' ').toLowerCase();
  const avgPop = tracks.reduce((s: number, t: any) => s + (t.popularity || 50), 0) / tracks.length;
  const match = (kws: string[]) => Math.min(1, kws.filter(k => allGenres.includes(k)).length / Math.max(1, kws.length * 0.3));
  return {
    groove: Math.min(1, match(['dance', 'pop', 'hip', 'r&b', 'funk', 'disco', 'house', 'soul']) * 0.65 + (avgPop / 100) * 0.35),
    brightness: Math.min(1, match(['pop', 'indie', 'folk', 'acoustic', 'soft', 'dream', 'chill', 'bedroom', 'singer']) * 0.6 + 0.25),
    heat: Math.min(1, match(['metal', 'rock', 'punk', 'hardcore', 'trap', 'drill', 'edm', 'bass', 'heavy', 'grunge']) * 0.75 + (avgPop / 100) * 0.25),
    pace: Math.min(1, match(['fast', 'speed', 'power', 'energy', 'uptempo', 'drum', 'breakbeat']) * 0.4 + (avgPop / 100) * 0.35 + 0.1),
  };
}

function computeMoodFromAvailable(tracks: any[], artists: any[], recentItems: any[]) {
  const allGenres = artists.flatMap((a: any) => a.genres || []).join(' ').toLowerCase();
  const avgPop = tracks.length
    ? tracks.reduce((s: number, t: any) => s + (t.popularity || 50), 0) / tracks.length
    : 50;

  const match = (kws: string[]) =>
    Math.min(1, kws.filter(k => allGenres.includes(k)).length / Math.max(1, kws.length * 0.25));

  // Valence: upbeat/happy genres push this up
  const valence = Math.min(1, Math.max(0,
    match(['happy', 'pop', 'funk', 'soul', 'disco', 'tropical', 'reggae', 'feel-good', 'summer']) * 0.5
    + match(['sad', 'emo', 'doom', 'depressive', 'melancholy', 'dark', 'gothic']) * -0.3
    + 0.4
  ));

  // Energy: driven by genre intensity
  const energy = Math.min(1, Math.max(0,
    match(['metal', 'rock', 'punk', 'hardcore', 'edm', 'dubstep', 'drum', 'bass', 'trap', 'rage', 'intense']) * 0.6
    + match(['ambient', 'acoustic', 'sleep', 'calm', 'soft', 'meditation']) * -0.3
    + (avgPop / 100) * 0.3
    + 0.2
  ));

  // Danceability: rhythm-focused genres
  const danceability = Math.min(1, Math.max(0,
    match(['dance', 'house', 'techno', 'hip hop', 'hip-hop', 'r&b', 'funk', 'disco', 'pop', 'club']) * 0.6
    + (avgPop / 100) * 0.2
    + 0.15
  ));

  // Acousticness: inverse of electronic/produced genres
  const acousticness = Math.min(1, Math.max(0,
    match(['acoustic', 'folk', 'singer-songwriter', 'country', 'bluegrass', 'unplugged']) * 0.6
    + match(['electronic', 'synth', 'edm', 'house', 'techno', 'digital']) * -0.3
    + 0.25
  ));

  // Recently played variety — how many unique artists in last 50
  const uniqueArtists = new Set(
    recentItems.map((r: any) => r.track?.artists?.[0]?.name).filter(Boolean)
  ).size;
  const variety = Math.min(1, uniqueArtists / 20);

  // Tempo: average BPM from tracks if available, fallback to genre estimation
  const tempoFromTracks = tracks.length 
    ? tracks.reduce((sum: number, t: any) => sum + (t.tempo || 120), 0) / tracks.length 
    : 120;

  return { valence, energy, danceability, acousticness, variety, avgPop: avgPop / 100, tempo: tempoFromTracks };
}

export async function GET(request: NextRequest) {
  const tokenState = await getToken(request);
  let token = tokenState.token;
  const refresh = tokenState.refresh;

  if (!token) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  try {
    const loadData = async (activeToken: string) => Promise.all([
      getMe(activeToken),
      getTopArtists(activeToken, 'short_term', 20),
      getTopArtists(activeToken, 'medium_term', 20),
      getTopArtists(activeToken, 'long_term', 20),
      getTopTracks(activeToken, 'short_term', 20),
      getTopTracks(activeToken, 'long_term', 20),
      getRecentlyPlayed(activeToken, 50),
    ]);

    let apiResult: Awaited<ReturnType<typeof loadData>>;
    try {
      apiResult = await loadData(token);
    } catch (error: any) {
      if (error?.message === 'UNAUTHORIZED' && refresh) {
        const refreshed = await refreshAccessToken(refresh);
        token = refreshed.access_token || undefined;
        tokenState.refreshedAccessToken = refreshed.access_token || null;
        tokenState.refreshedRefreshToken = refreshed.refresh_token ?? null;
        tokenState.expiresIn = refreshed.expires_in;
        if (!token) throw new Error('Token refresh failed: no access token');
        apiResult = await loadData(token);
      } else {
        throw error;
      }
    }

    const [profile, shortArtists, medArtists, longArtists, shortTracks, longTracks, recent] = apiResult;

    // Fetch audio features for accurate tempo/audio data
    const shortTrackIds = shortTracks.items.map((t: any) => t.id).filter(Boolean);
    const longTrackIds = longTracks.items.map((t: any) => t.id).filter(Boolean);
    
    let shortFeatures = { audio_features: [] };
    let longFeatures = { audio_features: [] };
    
    try {
      [shortFeatures, longFeatures] = await Promise.all([
        shortTrackIds.length > 0 ? getAudioFeatures(token, shortTrackIds) : Promise.resolve({ audio_features: [] }),
        longTrackIds.length > 0 ? getAudioFeatures(token, longTrackIds) : Promise.resolve({ audio_features: [] }),
      ]);
    } catch (error) {
      console.error('Failed to fetch audio features:', error);
      // Continue without audio features if fetch fails
    }

    // Attach features to tracks, ensuring all audio properties are included
    const shortTracksWithFeatures = shortTracks.items.map((t: any) => {
      const features = shortFeatures.audio_features?.find?.((f: any) => f?.id === t.id) as any;
      return {
        ...t,
        ...(features || {}),
        // Ensure tempo defaults to 120 if not found
        tempo: (features as any)?.tempo ?? t?.tempo ?? 120,
      };
    });
    
    const longTracksWithFeatures = longTracks.items.map((t: any) => {
      const features = longFeatures.audio_features?.find?.((f: any) => f?.id === t.id) as any;
      return {
        ...t,
        ...(features || {}),
        // Ensure tempo defaults to 120 if not found
        tempo: (features as any)?.tempo ?? t?.tempo ?? 120,
      };
    });

    console.log('[data-route] Short term - first track tempo:', shortTracksWithFeatures[0]?.tempo);
    console.log('[data-route] Long term - first track tempo:', longTracksWithFeatures[0]?.tempo);

    const dnaIndices = computeDNAFromAvailable(shortTracksWithFeatures, shortArtists.items);
    const shortAvg = computeMoodFromAvailable(shortTracksWithFeatures, shortArtists.items, recent.items || []);
    const longAvg = computeMoodFromAvailable(longTracksWithFeatures, longArtists.items, recent.items || []);
    
    console.log('[data-route] Short avg:', shortAvg);
    console.log('[data-route] Long avg:', longAvg);
    const drift = computeDrift(shortAvg, longAvg);
    console.log('[data-route] Calculated drift:', drift);
    const shortGenres = computeGenreMix(shortArtists.items).map((g: any) => g.name);
    const longGenres = computeGenreMix(longArtists.items).map((g: any) => g.name);
    const predictions = generatePredictions(drift, shortGenres, longGenres);

    const artistsWithIntensity = shortArtists.items.slice(0, 10).map((a: any, i: number) => ({
      name: a.name,
      image: a.images?.[0]?.url,
      genres: a.genres,
      rank: i + 1,
      intensity: computeIntensity(a.name, i + 1, recent.items || []),
      plays: (recent.items || []).filter((item: any) =>
        item.track?.artists?.some((ar: any) => ar.name === a.name)
      ).length,
    }));

    const countryMap = buildCountryAvailability(shortTracks.items);

    const response = NextResponse.json({
      profile: { name: profile.display_name, image: profile.images?.[0]?.url, email: profile.email },
      dna: { indices: dnaIndices, averages: shortAvg },
      genres: computeGenreMix(medArtists.items),
      mood: shortAvg,
      artists: artistsWithIntensity,
      topTracks: shortTracks.items.slice(0, 10).map((t: any) => ({
        name: t.name, artist: t.artists?.[0]?.name, image: t.album?.images?.[1]?.url,
        preview: t.preview_url, spotifyUrl: t.external_urls?.spotify,
      })),
      recent: (recent.items || []).slice(0, 20).map((item: any) => ({
        name: item.track?.name, artist: item.track?.artists?.[0]?.name,
        image: item.track?.album?.images?.[2]?.url, playedAt: item.played_at,
        valence: null,
      })),
      countryMap,
      predictions,
      drift,
    });

    if (tokenState.refreshedAccessToken) {
      setSpotifyAuthCookies(response, request, {
        accessToken: tokenState.refreshedAccessToken,
        refreshToken: tokenState.refreshedRefreshToken ?? undefined,
        expiresIn: tokenState.expiresIn,
      });
    }

    return response;
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}