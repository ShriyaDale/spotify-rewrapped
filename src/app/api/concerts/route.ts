import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artists = searchParams.get('artists')?.split(',').filter(Boolean) || [];
  const location = searchParams.get('location')?.trim().toLowerCase() || '';

  if (!artists.length) return NextResponse.json({ events: [] });

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  try {
    const results = await Promise.allSettled(
      artists.slice(0, 10).map(async (artist) => {
        const encoded = encodeURIComponent(artist.trim());
        const res = await fetch(
          `https://rest.bandsintown.com/artists/${encoded}/events?app_id=spotify-rewrapped&date=upcoming`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const events = await res.json();
        if (!Array.isArray(events)) return [];

        return events
          .filter((e: any) => {
            const eventDate = new Date(e.datetime);
            return eventDate <= oneYearFromNow;
          })
          .slice(0, 30) // cap per artist
          .map((e: any) => ({
            artist: artist.trim(),
            venue: e.venue?.name,
            city: e.venue?.city,
            region: e.venue?.region,
            country: e.venue?.country,
            date: e.datetime,
            url: e.url,
            lineup: e.lineup,
          }));
      })
    );

    let events = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .filter((e) => e.venue && e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If location provided, filter to matching city/region
    const filtered = location
      ? events.filter(
          (e) =>
            e.city?.toLowerCase().includes(location) ||
            e.region?.toLowerCase().includes(location) ||
            e.country?.toLowerCase().includes(location)
        )
      : events;

    return NextResponse.json({
      events: filtered,
      total: filtered.length,
      // Also return unfiltered count so UI knows if city filter narrowed things
      totalAll: events.length,
    });
  } catch (e: any) {
    return NextResponse.json({ events: [], error: e.message });
  }
}