import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artists = searchParams.get('artists')?.split(',').filter(Boolean) || [];
  const location = searchParams.get('location')?.trim() || '';

  if (!artists.length) return NextResponse.json({ events: [] });

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return NextResponse.json({ events: [], error: 'Missing API key' });

  const now = new Date();
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  // Ticketmaster requires this exact format: 2026-06-01T00:00:00Z
  const startDateTime = now.toISOString().split('.')[0] + 'Z';
  const endDateTime = oneYear.toISOString().split('.')[0] + 'Z';

  try {
    const results = await Promise.allSettled(
      artists.slice(0, 10).map(async (artist) => {
        const params = new URLSearchParams({
          apikey: apiKey,
          keyword: artist.trim(),
          classificationName: 'music',
          startDateTime,
          endDateTime,
          size: '50',
          sort: 'date,asc',
          ...(location ? { city: location } : {}),
        });

        const res = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
          { next: { revalidate: 3600 } }
        );

        if (!res.ok) {
          const err = await res.text();
          console.error(`TM error for ${artist}:`, res.status, err);
          return [];
        }

        const data = await res.json();
        const events = data?._embedded?.events ?? [];

        return events.map((e: any) => ({
          artist: e._embedded?.attractions?.[0]?.name ?? artist.trim(),
          venue: e._embedded?.venues?.[0]?.name ?? '',
          city: e._embedded?.venues?.[0]?.city?.name ?? '',
          region: e._embedded?.venues?.[0]?.state?.stateCode ?? '',
          country: e._embedded?.venues?.[0]?.country?.name ?? '',
          date: e.dates?.start?.dateTime ?? e.dates?.start?.localDate,
          url: e.url,
        }));
      })
    );

    const all = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .filter((e) => e.venue && e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const seen = new Set<string>();
    const events = all.filter((e) => {
      const key = `${e.artist}||${e.date}||${e.venue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ events, total: events.length, totalAll: events.length });
  } catch (e: any) {
    console.error('Concert API error:', e);
    return NextResponse.json({ events: [], error: e.message });
  }
}