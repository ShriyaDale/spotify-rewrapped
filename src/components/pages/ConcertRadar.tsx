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
      if (!city) { setAllEvents(events); setTotalAll(events.length); }
      setDisplayEvents(events);
      if (city) setTotalAll(allEvents.length);
    } catch { setError('Could not load concert data.'); }
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
    } catch { setArtistSearchError('Could not search for that artist.'); }
    setArtistSearchLoading(false);
  };

  const handleLocationChange = (val: string) => {
    setLocationInput(val);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (!val.trim()) { setActiveCity(''); setDisplayEvents(allEvents); return; }
    cityDebounceRef.current = setTimeout(() => {
      setActiveCity(val.trim());
      fetchTopArtistEvents(val.trim());
    }, 600);
  };

  const clearCity = () => { setLocationInput(''); setActiveCity(''); setDisplayEvents(allEvents); };

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
    if (days === 0) return { label: 'TONIGHT', urgent: true };
    if (days === 1) return { label: 'TOMORROW', urgent: true };
    if (days < 7) return { label: `${days} DAYS`, urgent: true };
    if (days < 30) return { label: `${Math.floor(days / 7)}W AWAY`, urgent: false };
    return { label: `${Math.floor(days / 30)}MO`, urgent: false };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

        .concert-input { font-family: 'Crimson Text', Georgia, serif; }
        .concert-input::placeholder { color: rgba(255,255,255,0.25); font-style: italic; }

        .concert-input::placeholder { color: rgba(255,255,255,0.25); }
        .concert-input:focus { border-color: rgba(255,210,60,0.5) !important; box-shadow: 0 0 0 3px rgba(255,210,60,0.08); }

        .artist-pill:hover { transform: translateY(-1px); }
        .artist-pill-active { background: rgba(255,210,60,0.15) !important; border-color: rgba(255,210,60,0.6) !important; }

        .event-row:hover .event-row-inner {
          background: rgba(255,210,60,0.06) !important;
          border-color: rgba(255,210,60,0.25) !important;
        }
        .event-row:hover .event-arrow { opacity: 1 !important; transform: translateX(0) !important; }
        .event-row:hover .date-badge { background: rgba(255,210,60,0.2) !important; }

        .search-btn:hover:not(:disabled) { background: rgba(255,210,60,0.25) !important; }
        .clear-btn:hover { background: rgba(255,255,255,0.12) !important; }

        .ticker-wrap { overflow: hidden; }
        .ticker-inner { display: flex; white-space: nowrap; animation: ticker 30s linear infinite; }
      `}</style>

      {/* Live ticker strip */}
      {!loading && allEvents.length > 0 && (
        <div style={{
          background: 'rgba(255,210,60,0.12)',
          border: '1px solid rgba(255,210,60,0.2)',
          borderRadius: 8,
          padding: '8px 0',
          overflow: 'hidden',
        }}>
          <div className="ticker-wrap">
            <div className="ticker-inner">
              {[...allEvents, ...allEvents].map((e, i) => (
                <span key={i} style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 13,
                  color: 'rgba(255,210,60,0.8)',
                  letterSpacing: 2,
                  paddingRight: 40,
                }}>
                  {e.artist.toUpperCase()} · {e.city}
                  <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 16px' }}>✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search row: artist + city side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Artist search */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 16,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 11,
            color: 'rgba(255,210,60,0.7)',
            letterSpacing: 3,
            marginBottom: 10,
          }}>
            🔍 SEARCH ANY ARTIST
          </div>
          <form onSubmit={e => { e.preventDefault(); handleArtistSearch(artistSearchInput); }} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="concert-input"
                value={artistSearchInput}
                onChange={e => setArtistSearchInput(e.target.value)}
                placeholder="Artist name..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '9px 12px',
                  color: 'white', fontSize: 13,
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              {artistSearchLoading && (
                <div style={{
                  position: 'absolute', right: 10, top: '50%', marginTop: -6,
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid rgba(255,210,60,0.6)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
            </div>
            <button
              className="search-btn"
              type="submit"
              disabled={!artistSearchInput.trim() || artistSearchLoading}
              style={{
                padding: '0 14px', borderRadius: 8, border: 'none',
                background: artistSearchInput.trim() ? 'rgba(255,210,60,0.15)' : 'rgba(255,255,255,0.04)',
                color: artistSearchInput.trim() ? 'rgba(255,210,60,0.9)' : 'rgba(255,255,255,0.2)',
                fontSize: 11, cursor: artistSearchInput.trim() ? 'pointer' : 'default',
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: 2, flexShrink: 0, transition: 'all 0.15s',
              }}
            >GO</button>
          </form>
          {artistSearchError && (
            <div style={{ fontSize: 11, color: 'rgba(255,100,80,0.8)', fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
              {artistSearchError}
            </div>
          )}
          {searchedArtists.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {searchedArtists.map(name => {
                const isActive = searchedArtistFilter === name;
                const count = searchedEvents.filter(e => e.artist === name).length;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setSearchedArtistFilter(isActive ? null : name)}
                      style={{
                        padding: '4px 8px 4px 10px', borderRadius: '20px 0 0 20px',
                        border: `1px solid ${isActive ? 'rgba(255,210,60,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRight: 'none',
                        cursor: 'pointer',
                        background: isActive ? 'rgba(255,210,60,0.12)' : 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 11, color: isActive ? 'rgba(255,210,60,0.95)' : 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>{name}</span>
                      <span style={{
                        fontSize: 9, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1,
                        color: isActive ? 'rgba(255,210,60,0.7)' : 'rgba(255,255,255,0.3)',
                      }}>{count}</span>
                    </button>
                    <button
                      onClick={() => removeSearchedArtist(name)}
                      style={{
                        width: 22, height: 26, borderRadius: '0 20px 20px 0',
                        border: `1px solid ${isActive ? 'rgba(255,210,60,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer',
                        background: isActive ? 'rgba(255,210,60,0.08)' : 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.3)', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* City filter */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${activeCity ? 'rgba(255,210,60,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 14,
          padding: 16,
          transition: 'border-color 0.2s',
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 11,
            color: activeCity ? 'rgba(255,210,60,0.7)' : 'rgba(255, 255, 255, 0.75)',
            letterSpacing: 3,
            marginBottom: 10,
            transition: 'color 0.2s',
          }}>
            📍 FILTER BY CITY
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="concert-input"
                value={locationInput}
                onChange={e => handleLocationChange(e.target.value)}
                placeholder="City or region..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeCity ? 'rgba(255,210,60,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '9px 12px',
                  color: 'white', fontSize: 13,
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              {searching && (
                <div style={{
                  position: 'absolute', right: 10, top: '50%', marginTop: -6,
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid rgba(255,210,60,0.6)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
            </div>
            {activeCity && (
              <button className="clear-btn" onClick={clearCity} style={{
                padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                fontSize: 11, cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1,
                flexShrink: 0, transition: 'all 0.15s',
              }}>CLEAR</button>
            )}
          </div>
          {activeCity && (
            <div style={{
              fontSize: 11, marginTop: 8,
              fontFamily: "'DM Sans', sans-serif",
              color: filteredTop.length === 0 ? 'rgba(255,100,80,0.7)' : 'rgba(255,210,60,0.7)',
            }}>
              {filteredTop.length === 0
                ? `No shows near "${activeCity}"`
                : `${filteredTop.length} show${filteredTop.length !== 1 ? 's' : ''} near ${activeCity}`}
            </div>
          )}
        </div>
      </div>

      {/* Artist pills */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 11, color: 'rgba(255, 255, 255, 0.76)', letterSpacing: 3,
          }}>
            YOUR TOP ARTISTS
          </div>
          {!loading && (
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 11, letterSpacing: 2,
              color: totalAll > 0 ? 'rgba(255,210,60,0.7)' : 'rgba(255, 255, 255, 0.56)',
            }}>
              {totalAll > 0 ? `${totalAll} SHOWS FOUND` : 'NO UPCOMING SHOWS'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {topArtists.map((name) => {
            const count = artistEventCount[name] || 0;
            const isActive = artistFilter === name;
            const touring = artistHasShow.has(name);
            return (
              <button
                key={name}
                className={`artist-pill ${isActive ? 'artist-pill-active' : ''}`}
                onClick={() => setArtistFilter(isActive ? null : name)}
                style={{
                  padding: '6px 12px', borderRadius: 100,
                  border: `1px solid ${isActive ? 'rgba(255,210,60,0.6)' : touring ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,210,60,0.15)' : touring ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                }}
              >
                {/* Live indicator dot */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: touring ? (isActive ? '#FFD23C' : 'rgba(255,210,60,0.6)') : 'rgba(255,255,255,0.15)',
                  animation: touring ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                }} />
                <span style={{
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  color: isActive ? 'rgba(255,210,60,0.95)' : touring ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                  letterSpacing: 0.2,
                }}>{name}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1,
                    color: isActive ? 'rgba(255,210,60,0.8)' : 'rgba(255,255,255,0.35)',
                    background: isActive ? 'rgba(255,210,60,0.12)' : 'rgba(255,255,255,0.06)',
                    padding: '1px 6px', borderRadius: 10,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Searched artist results */}
      <AnimatePresence>
        {searchedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          >
            <SectionBlock
              label="SEARCHED ARTISTS"
              accent="rgba(180,130,255,0.7)"
              accentBg="rgba(140,80,255,0.06)"
              accentBorder="rgba(140,80,255,0.2)"
              count={filteredSearched.length}
              events={filteredSearched}
              daysUntil={daysUntil}
              groupByMonth={groupByMonth}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main timeline */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div style={{ background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.15)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,100,80,0.8)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      ) : filteredTop.length === 0 ? (
        <EmptyState activeCity={activeCity} artistFilter={artistFilter} />
      ) : (
        <SectionBlock
          label={activeCity ? `NEAR ${activeCity.toUpperCase()}` : artistFilter ? artistFilter.toUpperCase() : 'ALL UPCOMING SHOWS'}
          accent="rgba(255,210,60,0.7)"
          accentBg="rgba(255,255,255,0.02)"
          accentBorder="rgba(255,255,255,0.08)"
          count={filteredTop.length}
          events={filteredTop}
          daysUntil={daysUntil}
          groupByMonth={groupByMonth}
        />
      )}
    </div>
  );
}

function SectionBlock({ label, accent, accentBg, accentBorder, count, events, daysUntil, groupByMonth }: {
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  count: number;
  events: ConcertEvent[];
  daysUntil: (d: string) => { label: string; urgent: boolean } | null;
  groupByMonth: (events: ConcertEvent[]) => Record<string, ConcertEvent[]>;
}) {
  return (
    <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 3, color: accent }}>
          {label}
        </span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.25)' }}>
          {count} SHOW{count !== 1 ? 'S' : ''}
        </span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(groupByMonth(events)).map(([month, monthEvents]) => (
          <MonthGroup key={month} month={month} events={monthEvents} daysUntil={daysUntil} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function MonthGroup({ month, events, daysUntil, accent }: {
  month: string;
  events: ConcertEvent[];
  daysUntil: (d: string) => { label: string; urgent: boolean } | null;
  accent: string;
}) {
  return (
    <div>
      {/* Month divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 12, letterSpacing: 4,
          color: 'rgba(255,255,255,0.25)',
        }}>
          {month.toUpperCase()}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnimatePresence>
          {events.map((e, i) => {
            const days = daysUntil(e.date);
            if (!days) return null;
            const d = new Date(e.date);
            return (
              <motion.div
                key={`${e.artist}-${e.date}-${e.venue}`}
                className="event-row"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <a
                  href={e.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-row-inner"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {/* Date block — ticket stub style */}
                  <div
                    className="date-badge"
                    style={{
                      flexShrink: 0, width: 46, textAlign: 'center',
                      padding: '7px 4px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      borderRight: '1px dashed rgba(255,255,255,0.08)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 9, letterSpacing: 2,
                      color: 'rgba(255,255,255,0.35)',
                    }}>
                      {d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 22, lineHeight: 1,
                      color: 'white',
                    }}>
                      {d.getDate()}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 9, color: 'rgba(255,255,255,0.25)',
                    }}>
                      {d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, fontWeight: 500,
                      color: 'rgba(255,255,255,0.92)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      letterSpacing: 0.1,
                    }}>{e.artist}</div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11, fontWeight: 300, fontStyle: 'italic',
                      color: 'rgba(255,255,255,0.4)',
                      marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {e.venue}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                      marginTop: 1,
                    }}>
                      {e.city}{e.region ? `, ${e.region}` : ''} · {e.country}
                    </div>
                  </div>

                  {/* Days away badge */}
                  <div style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
                  }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 10, letterSpacing: 1.5,
                      padding: '3px 8px', borderRadius: 6,
                      background: days.urgent ? 'rgba(255,210,60,0.15)' : 'rgba(255,255,255,0.05)',
                      color: days.urgent ? 'rgba(255,210,60,0.9)' : 'rgba(255,255,255,0.25)',
                      border: `1px solid ${days.urgent ? 'rgba(255,210,60,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}>{days.label}</div>

                    {/* Arrow */}
                    <div
                      className="event-arrow"
                      style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.2)',
                        opacity: 0, transform: 'translateX(-4px)',
                        transition: 'opacity 0.15s, transform 0.15s',
                      }}
                    >→</div>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingState() {
  const bars = [60, 80, 45, 70, 55, 85, 40, 65];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '32px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      {/* Animated equalizer bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 28 }}>
        {bars.map((h, i) => (
          <motion.div key={i}
            style={{ width: 4, borderRadius: 2, background: 'rgba(255,210,60,0.5)' }}
            animate={{ height: [h * 0.3, h, h * 0.5, h * 0.8, h * 0.3] }}
            transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: 'easeInOut', delay: i * 0.08 }}
          />
        ))}
      </div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 13, letterSpacing: 4,
        color: 'rgba(255,255,255,0.3)',
      }}>
        SCANNING TOUR DATES
      </div>
    </div>
  );
}

function EmptyState({ activeCity, artistFilter }: { activeCity: string; artistFilter: string | null }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '36px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>🎸</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 16, letterSpacing: 3,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6,
      }}>
        {activeCity ? `NOTHING IN ${activeCity.toUpperCase()}` : artistFilter ? 'NO UPCOMING SHOWS' : 'NO SHOWS FOUND'}
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontStyle: 'italic', fontWeight: 300,
        fontSize: 12, color: 'rgba(255, 255, 255, 0.5)',
        margin: 0,
      }}>
        {activeCity ? 'Try clearing the city filter to see all tour dates.' : 'Check back soon — tours get announced frequently.'}
      </p>
    </div>
  );
}