import { NextRequest, NextResponse } from 'next/server';
import { getTopArtists, getTopTracks, refreshAccessToken } from '@/lib/spotify';
import { computeGenreMix } from '@/lib/analytics';

/**
 * Apple RSS uses storefront codes like: us, gb, ca...
 * Accept:
 *   ?code=US (ISO2) preferred
 *   ?name=United States of America fallback
 */

const ISO2_TO_STOREFRONT: Record<string, string> = {
  us: 'us',
  gb: 'gb',
  ca: 'ca',
  mx: 'mx',
  br: 'br',
  ar: 'ar',
  ie: 'ie',
  fr: 'fr',
  de: 'de',
  es: 'es',
  it: 'it',
  nl: 'nl',
  se: 'se',
  no: 'no',
  pl: 'pl',
  au: 'au',
  nz: 'nz',
  jp: 'jp',
  kr: 'kr',
  in: 'in',
  cn: 'cn',
  ru: 'ru',
  za: 'za',
  eg: 'eg',
  ng: 'ng',
  cz: 'cz',
  ir: 'ir',
  vn: 'vn',
  bo: 'bo',
  tz: 'tz',
};

const NAME_TO_STOREFRONT: Record<string, string> = {
  'United States of America': 'us',
  'United States': 'us',
  USA: 'us',
  Canada: 'ca',
  Mexico: 'mx',
  Brazil: 'br',
  Argentina: 'ar',
  England: 'gb',
  Scotland: 'gb',
  Wales: 'gb',
  'Northern Ireland': 'gb',
  'United Kingdom': 'gb',
  Ireland: 'ie',
  France: 'fr',
  Germany: 'de',
  Spain: 'es',
  Italy: 'it',
  Netherlands: 'nl',
  Sweden: 'se',
  Norway: 'no',
  Poland: 'pl',
  Australia: 'au',
  'New Zealand': 'nz',
  Japan: 'jp',
  'South Korea': 'kr',
  India: 'in',
  China: 'cn',
  Russia: 'ru',
  'Russian Federation': 'ru',
  'South Africa': 'za',
  Egypt: 'eg',
  Nigeria: 'ng',
  'Czechia': 'cz',
  Iran: 'ir',
  'Viet Nam': 'vn',
  Bolivia: 'bo',
  Tanzania: 'tz',
};

async function getToken(request: NextRequest) {
  let token = request.cookies.get('sp_access')?.value;
  const refresh = request.cookies.get('sp_refresh')?.value;

  if (!token && refresh) {
    const refreshed = await refreshAccessToken(refresh);
    token = refreshed.access_token;
  }
  return token;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normText(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // remove (...) like (feat. ...)
    .replace(/\[.*?\]/g, ' ') // remove [...]
    .replace(/feat\.|featuring|ft\./g, ' ') // remove feat tokens
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ') // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

function songKey(title: string, artist: string) {
  // title|artist (normalized)
  return `${normText(title)}|${normText(artist)}`;
}

function tokenizeGenrePhrase(genre: string) {
  const stop = new Set([
    'music',
    'pop',
    'rap',
    'rock',
    'hip',
    'hop',
    'rnb',
    'and',
    'the',
    'of',
    'to',
    'a',
  ]);
  return normText(genre)
    .split(' ')
    .filter((t) => t && t.length >= 3 && !stop.has(t));
}

async function spotifySearchArtist(token: string, name: string) {
  const q = encodeURIComponent(name);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.artists?.items?.[0] ?? null;
}

export async function GET(req: NextRequest) {
  const countryName = (req.nextUrl.searchParams.get('name') || '').trim();
  const codeParamRaw = (req.nextUrl.searchParams.get('code') || '').trim();
  const iso2 = codeParamRaw ? codeParamRaw.slice(0, 2).toLowerCase() : '';

  const storefront =
    (iso2 && ISO2_TO_STOREFRONT[iso2]) ||
    (countryName ? NAME_TO_STOREFRONT[countryName] : undefined);

  if (!storefront) {
    return NextResponse.json({
      name: countryName || null,
      code: null,
      hasData: false,
      score: 0,
      topSongs: [],
      reason: 'no_storefront_mapping',
    });
  }

  // 1) Apple Top Songs
  const appleUrl = `https://rss.applemarketingtools.com/api/v2/${storefront}/music/most-played/50/songs.json`;

  let results: any[] = [];
  try {
    const appleRes = await fetch(appleUrl, { cache: 'no-store' });
    if (!appleRes.ok) {
      return NextResponse.json({
        name: countryName || null,
        code: storefront.toUpperCase(),
        hasData: false,
        score: 0,
        topSongs: [],
        reason: 'apple_fetch_failed',
      });
    }
    const appleJson = await appleRes.json();
    results = appleJson?.feed?.results ?? [];
  } catch {
    return NextResponse.json({
      name: countryName || null,
      code: storefront.toUpperCase(),
      hasData: false,
      score: 0,
      topSongs: [],
      reason: 'apple_parse_failed',
    });
  }

  const topSongs = results.slice(0, 5).map((r: any) => ({
    title: r?.name ?? '',
    artist: r?.artistName ?? '',
    url: r?.url ?? '',
  }));

  if (results.length === 0) {
    return NextResponse.json({
      name: countryName || null,
      code: storefront.toUpperCase(),
      hasData: false,
      score: 0,
      topSongs: [],
      reason: 'empty_chart',
    });
  }

  // 2) Spotify token (but ALWAYS return songs)
  const token = await getToken(req);
  if (!token) {
    return NextResponse.json({
      name: countryName || null,
      code: storefront.toUpperCase(),
      hasData: topSongs.length > 0,
      score: 0.15,
      topSongs,
      reason: 'no_spotify_token',
    });
  }

  // 3) Similarity score: SONG overlap + ARTIST overlap + GENRE keyword overlap
  try {
    // Chart artists (top 10 songs)
    const chartArtists = Array.from(
      new Set(
        results
          .slice(0, 10)
          .map((r: any) => (r?.artistName ?? '').trim())
          .filter(Boolean)
      )
    );

    // Chart songs (top 20 for overlap)
    const chartSongKeys = new Set(
      results.slice(0, 20).map((r: any) => songKey(r?.name ?? '', r?.artistName ?? ''))
    );

    // User top artists + tracks
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(token, 'short_term', 25),
      getTopTracks(token, 'short_term', 50),
    ]);

    const userTopArtistNames = new Set(
      (topArtists.items || [])
        .slice(0, 20)
        .map((a: any) => normText(a?.name ?? ''))
        .filter(Boolean)
    );

    const userTopTrackKeys = new Set(
      (topTracks.items || []).map((t: any) =>
        songKey(t?.name ?? '', t?.artists?.[0]?.name ?? '')
      )
    );

    // SONG overlap (Apple chart ↔ Spotify top tracks)
    let songHits = 0;
    for (const k of chartSongKeys) {
      if (userTopTrackKeys.has(k)) songHits += 1;
    }
    const songComponent = clamp01(songHits / Math.max(1, chartSongKeys.size)); // 0..1

    // ARTIST overlap (chart artists ↔ your top artists)
    let artistHits = 0;
    for (const a of chartArtists) {
      if (userTopArtistNames.has(normText(a))) artistHits += 1;
    }
    const artistComponent = clamp01(artistHits / Math.max(1, chartArtists.length)); // 0..1

    // GENRE keyword overlap (more forgiving than exact genre string match)
    const mixArr = computeGenreMix(topArtists.items || []) as any[];
    const userTopGenres = (mixArr || [])
      .slice(0, 18)
      .map((g: any) => String(g?.name ?? ''))
      .filter(Boolean);

    const userGenreKeywords = new Set<string>();
    for (const g of userTopGenres) {
      for (const tok of tokenizeGenrePhrase(g)) userGenreKeywords.add(tok);
    }

    let genreChecked = 0;
    let genreHits = 0;

    for (const artistName of chartArtists) {
      const spArtist = await spotifySearchArtist(token, artistName);
      const genres: string[] = (spArtist?.genres ?? []).map((x: string) => String(x));

      genreChecked += 1;

      // If ANY token from ANY genre phrase hits your keyword set, count as hit
      let hit = false;
      for (const phrase of genres) {
        const toks = tokenizeGenrePhrase(phrase);
        if (toks.some((t) => userGenreKeywords.has(t))) {
          hit = true;
          break;
        }
      }
      if (hit) genreHits += 1;
    }

    const genreComponent = clamp01(genreHits / Math.max(1, genreChecked)); // 0..1

    // Final blend:
    // - songs most meaningful (directly your taste)
    // - artists next
    // - genres last
    const score = clamp01(songComponent * 0.50 + artistComponent * 0.35 + genreComponent * 0.15);

    // If everything is truly 0, still allow a tiny baseline so map isn't dead
    const finalScore = score === 0 ? 0.05 : score;

    return NextResponse.json({
      name: countryName || null,
      code: storefront.toUpperCase(),
      hasData: topSongs.length > 0,
      score: finalScore,
      topSongs,
      debug: {
        songComponent,
        artistComponent,
        genreComponent,
        songHits,
        chartSongs: chartSongKeys.size,
        artistHits,
        chartArtists: chartArtists.length,
        genreHits,
        genreChecked,
      },
    });
  } catch (e: any) {
    // Do NOT lose songs if scoring fails
    return NextResponse.json({
      name: countryName || null,
      code: storefront.toUpperCase(),
      hasData: topSongs.length > 0,
      score: 0.15,
      topSongs,
      reason: 'spotify_scoring_failed',
      error: String(e?.message ?? e),
    });
  }
}