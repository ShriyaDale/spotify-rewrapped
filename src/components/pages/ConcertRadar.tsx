'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConcertEvent {
  artist: string;
  venue: string;
  city: string;
  region: string;
  country: string;
  date: string;
  url: string;
}

async function fetchFromTicketmaster(artists: string[], city?: string): Promise<ConcertEvent[]> {
  const params = new URLSearchParams({
    artists: artists.join(','),
    ...(city ? { location: city } : {}),
  });

  const res = await fetch(`/api/concerts?${params}`);
  if (!res.ok) throw new Error('API request failed');
  const data = await res.json();
  return data.events ?? [];
}

interface Props { data: any }

export default function ConcertRadar({ data }: Props) {
  const [allEvents, setAllEvents] = useState<ConcertEvent[]>([]);
  const [displayEvents, setDisplayEvents] = useState<ConcertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [totalAll, setTotalAll] = useState(0);
  const [error, setError] = useState('');
  const [artistFilter, setArtistFilter] = useState<string | null>(null);

  const [artistSearchInput, setArtistSearchInput] = useState('');
  const [artistSearchLoading, setArtistSearchLoading] = useState(false);
  const [artistSearchError, setArtistSearchError] = useState('');
  const [searchedArtists, setSearchedArtists] = useState<string[]>([]);
  const [searchedEvents, setSearchedEvents] = useState<ConcertEvent[]>([]);
  const [searchedArtistFilter, setSearchedArtistFilter] = useState<string | null>(null);

  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topArtists: string[] = (data?.artists || []).map((a: any) => a.name).slice(0, 10);

  useEffect(() => {
    if (!topArtists.length) { setLoading(false); return; }
    fetchTopArtistEvents('');
  }, [topArtists.length]);

  const fetchTopArtistEvents = async (city: string) => {
    if (city) setSearching(true);
    else setLoading(true);
    setError('');
    try {
      const events = await fetchFromTicketmaster(topArtists, city || undefined);
      if (!city) {
        setAllEvents(events);
        setTotalAll(events.length);
      }
      setDisplayEvents(events);
      if (city) setTotalAll(allEvents.length);
    } catch {
      setError('Could not load concert data.');
    }
    setLoading(false);
    setSearching(false);
  };

  const handleArtistSearch = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (searchedArtists.includes(trimmed)) {
      setSearchedArtistFilter(trimmed);
      setArtistSearchInput('');
      return;
    }
    setArtistSearchLoading(true);
    setArtistSearchError('');
    try {
      const events = await fetchFromTicketmaster([trimmed]);
      if (events.length === 0) {
        setArtistSearchError(`No upcoming shows found for "${trimmed}".`);
      } else {
        setSearchedArtists(prev => [...prev, trimmed]);
        setSearchedEvents(prev => [...prev, ...events]);
        setSearchedArtistFilter(trimmed);
        setArtistSearchInput('');
      }
    } catch {
      setArtistSearchError('Could not search for that artist.');
    }
    setArtistSearchLoading(false);
  };

  const handleLocationChange = (val: string) => {
    setLocationInput(val);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (!val.trim()) {
      setActiveCity('');
      setDisplayEvents(allEvents);
      return;
    }
    cityDebounceRef.current = setTimeout(() => {
      setActiveCity(val.trim());
      fetchTopArtistEvents(val.trim());
    }, 600);
  };

  const clearCity = () => {
    setLocationInput('');
    setActiveCity('');
    setDisplayEvents(allEvents);
  };

  const removeSearchedArtist = (name: string) => {
    setSearchedArtists(prev => prev.filter(a => a !== name));
    setSearchedEvents(prev => prev.filter(e => e.artist !== name));
    if (searchedArtistFilter === name) setSearchedArtistFilter(null);
  };

  const filteredTop = artistFilter ? displayEvents.filter(e => e.artist === artistFilter) : displayEvents;
  const filteredSearched = searchedArtistFilter ? searchedEvents.filter(e => e.artist === searchedArtistFilter) : searchedEvents;

  const artistHasShow = new Set(allEvents.map(e => e.artist));
  const artistEventCount = topArtists.reduce<Record<string, number>>((acc, name) => {
    acc[name] = allEvents.filter(e => e.artist === name).length;
    return acc;
  }, {});

  const groupByMonth = (events: ConcertEvent[]) =>
    events.reduce<Record<string, ConcertEvent[]>>((acc, e) => {
      const key = new Date(e.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days === 0) return 'TODAY';
    if (days === 1) return 'TOMORROW';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    return `${Math.floor(days / 30)}mo`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Artist search */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 }}>
          SEARCH ANY ARTIST
        </div>
        <form onSubmit={e => { e.preventDefault(); handleArtistSearch(artistSearchInput); }} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              value={artistSearchInput}
              onChange={e => setArtistSearchInput(e.target.value)}
              placeholder="e.g. Radiohead, Charli XCX, Fred again.."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 12,
                outline: 'none', fontFamily: 'Georgia, serif',
              }}
            />
            {artistSearchLoading && <Spinner />}
          </div>
          <button
            type="submit"
            disabled={!artistSearchInput.trim() || artistSearchLoading}
            style={{
              padding: '0 16px', borderRadius: 10, border: 'none',
              background: artistSearchInput.trim() ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)',
              color: artistSearchInput.trim() ? 'white' : 'rgba(255,255,255,0.25)',
              fontSize: 11, cursor: artistSearchInput.trim() ? 'pointer' : 'default',
              fontFamily: 'monospace', letterSpacing: 1, flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            SEARCH
          </button>
        </form>

        {artistSearchError && (
          <div style={{ fontSize: 10, color: 'rgba(255,120,120,0.7)', fontFamily: 'monospace', marginTop: 8 }}>
            {artistSearchError}
          </div>
        )}

        {searchedArtists.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {searchedArtists.map(name => {
              const isActive = searchedArtistFilter === name;
              const count = searchedEvents.filter(e => e.artist === name).length;
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setSearchedArtistFilter(isActive ? null : name)}
                    style={{
                      padding: '5px 8px 5px 10px', borderRadius: '20px 0 0 20px', border: 'none',
                      cursor: 'pointer', background: isActive ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.1)',
                      outline: `1px solid ${isActive ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.25)'}`,
                      outlineOffset: -1, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif' }}>{name}</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(139,92,246,0.8)', background: 'rgba(139,92,246,0.15)', padding: '1px 5px', borderRadius: 8 }}>{count}</span>
                  </button>
                  <button
                    onClick={() => removeSearchedArtist(name)}
                    style={{
                      width: 24, minHeight: 28, borderRadius: '0 20px 20px 0', border: 'none',
                      cursor: 'pointer', background: isActive ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.07)',
                      outline: `1px solid ${isActive ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.25)'}`,
                      outlineOffset: -1, color: 'rgba(255,255,255,0.35)', fontSize: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    }}
                  >×</button>
                </div>
              );
            })}
            {searchedArtistFilter && (
              <button onClick={() => setSearchedArtistFilter(null)} style={{ padding: '5px 10px', borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}>
                ALL
              </button>
            )}
          </div>
        )}
      </div>

      {/* Searched artist timeline */}
      <AnimatePresence>
        {searchedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div style={{ fontSize: 9, color: 'rgba(139,92,246,0.7)', letterSpacing: 3, fontFamily: 'monospace' }}>
              SEARCHED ARTISTS — {filteredSearched.length} SHOWS
            </div>
            {Object.entries(groupByMonth(filteredSearched)).map(([month, monthEvents]) => (
              <MonthGroup key={month} month={month} events={monthEvents} daysUntil={daysUntil} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top artists pills */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 }}>
          YOUR TOP {topArtists.length} ARTISTS · {loading ? '...' : `${totalAll} SHOWS IN NEXT 12 MONTHS`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {topArtists.map((name) => {
            const count = artistEventCount[name] || 0;
            const isActive = artistFilter === name;
            const touring = artistHasShow.has(name);
            return (
              <button
                key={name}
                onClick={() => setArtistFilter(isActive ? null : name)}
                style={{
                  padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: isActive ? 'rgba(139,92,246,0.35)' : touring ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
                  outline: `1px solid ${isActive ? 'rgba(139,92,246,0.6)' : touring ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: touring ? '#8B5CF6' : 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: touring ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif' }}>{name}</span>
                {count > 0 && (
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(139,92,246,0.8)', background: 'rgba(139,92,246,0.15)', padding: '1px 5px', borderRadius: 8 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* City filter */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${activeCity ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: 14, transition: 'border-color 0.2s',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 }}>
          FILTER BY CITY
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              value={locationInput}
              onChange={e => handleLocationChange(e.target.value)}
              placeholder="Search city, region, or country..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 12,
                outline: 'none', fontFamily: 'Georgia, serif',
              }}
            />
            {searching && <Spinner />}
          </div>
          {activeCity && (
            <button onClick={clearCity} style={{ padding: '0 14px', height: 40, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', flexShrink: 0 }}>
              CLEAR
            </button>
          )}
        </div>
        {activeCity && (
          <div style={{ fontSize: 10, color: 'rgba(139,92,246,0.7)', fontFamily: 'monospace', marginTop: 8 }}>
            {filteredTop.length === 0 ? `No shows near "${activeCity}"` : `${filteredTop.length} show${filteredTop.length !== 1 ? 's' : ''} near "${activeCity}"`}
          </div>
        )}
      </div>

      {/* Top artist timeline */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,100,100,0.7)', fontFamily: 'monospace', fontSize: 11, margin: 0 }}>{error}</p>
        </div>
      ) : filteredTop.length === 0 ? (
        <EmptyState activeCity={activeCity} artistFilter={artistFilter} />
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontFamily: 'monospace' }}>
            {activeCity
              ? `SHOWS NEAR ${activeCity.toUpperCase()} — ${filteredTop.length} FOUND`
              : artistFilter
              ? `${artistFilter.toUpperCase()} — ${filteredTop.length} UPCOMING SHOWS`
              : `ALL UPCOMING SHOWS — ${filteredTop.length} ACROSS ${Object.keys(groupByMonth(filteredTop)).length} MONTHS`}
          </div>
          {Object.entries(groupByMonth(filteredTop)).map(([month, monthEvents]) => (
            <MonthGroup key={month} month={month} events={monthEvents} daysUntil={daysUntil} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      width: 12, height: 12, borderRadius: '50%',
      border: '2px solid rgba(139,92,246,0.6)', borderTopColor: 'transparent',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function MonthGroup({ month, events, daysUntil }: {
  month: string;
  events: ConcertEvent[];
  daysUntil: (d: string) => string | null;
}) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'rgba(139,92,246,0.6)', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        {month.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence>
          {events.map((e, i) => {
            const days = daysUntil(e.date);
            if (days === null) return null;
            return (
              <motion.a
                key={`${e.artist}-${e.date}-${e.venue}`}
                href={e.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={el => {
                  (el.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)';
                  (el.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)';
                }}
                onMouseLeave={el => {
                  (el.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  (el.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <div style={{ minWidth: 40, textAlign: 'center', padding: '5px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                    {new Date(e.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, color: 'white', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
                    {new Date(e.date).getDate()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'white', fontFamily: 'Georgia, serif', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.artist}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.venue} · {e.city}{e.region ? `, ${e.region}` : ''}, {e.country}
                  </div>
                </div>
                <div style={{
                  fontSize: 9, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1,
                  flexShrink: 0, padding: '3px 7px', borderRadius: 6,
                  background: days === 'TODAY' || days === 'TOMORROW' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                  color: days === 'TODAY' || days === 'TOMORROW' ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                }}>
                  {days}
                </div>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
        SCANNING TOUR DATES...
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div key={i}
            style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(139,92,246,0.6)' }}
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ activeCity, artistFilter }: { activeCity: string; artistFilter: string | null }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>🎸</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, margin: '0 0 4px' }}>
        {activeCity ? `None of your top artists are playing near ${activeCity} in the next year.` : artistFilter ? `${artistFilter} has no upcoming shows in the next year.` : 'No upcoming shows found for your top artists.'}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 10, margin: 0 }}>
        {activeCity ? 'Try clearing the city filter to see all tour dates.' : 'Check back soon — tours get announced frequently.'}
      </p>
    </div>
  );
}