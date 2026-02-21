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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artists: string[] = (data?.artists || []).map((a: any) => a.name).slice(0, 10);

  // Initial load — fetch ALL upcoming events for all artists, no city filter
  useEffect(() => {
    if (!artists.length) { setLoading(false); return; }
    fetchEvents('');
  }, [artists.length]);

  const fetchEvents = async (city: string) => {
    if (city) setSearching(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        artists: artists.join(','),
        ...(city ? { location: city } : {}),
      });
      const res = await fetch(`/api/concerts?${params}`);
      const d = await res.json();
      const events: ConcertEvent[] = d.events || [];

      if (!city) {
        setAllEvents(events);
        setTotalAll(d.totalAll ?? events.length);
      }
      setDisplayEvents(events);
      setTotalAll(d.totalAll ?? (city ? allEvents.length : events.length));
    } catch {
      setError('Could not load concert data.');
    }

    setLoading(false);
    setSearching(false);
  };

  // Debounced city search
  const handleLocationChange = (val: string) => {
    setLocationInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      // Restore full list without re-fetching
      setActiveCity('');
      setDisplayEvents(allEvents);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setActiveCity(val.trim());
      fetchEvents(val.trim());
    }, 600);
  };

  const clearCity = () => {
    setLocationInput('');
    setActiveCity('');
    setDisplayEvents(allEvents);
  };

  // Artist filter (client-side)
  const filtered = artistFilter
    ? displayEvents.filter(e => e.artist === artistFilter)
    : displayEvents;

  // Group by artist for summary
  const artistHasShow = new Set(allEvents.map(e => e.artist));
  const artistEventCount = artists.reduce<Record<string, number>>((acc, name) => {
    acc[name] = allEvents.filter(e => e.artist === name).length;
    return acc;
  }, {});

  // Group by month for the timeline
  const groupedByMonth = filtered.reduce<Record<string, ConcertEvent[]>>((acc, e) => {
    const key = new Date(e.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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

      {/* Artist pills + show count */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 14,
      }}>
        <div style={{
          fontSize: 9, color: 'rgba(255,255,255,0.4)',
          letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10,
        }}>
          MONITORING {artists.length} ARTISTS · {loading ? '...' : `${totalAll} SHOWS IN NEXT 12 MONTHS`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {artists.map((name) => {
            const count = artistEventCount[name] || 0;
            const isActive = artistFilter === name;
            const touring = artistHasShow.has(name);
            return (
              <button
                key={name}
                onClick={() => setArtistFilter(isActive ? null : name)}
                style={{
                  padding: '5px 10px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  background: isActive
                    ? 'rgba(139,92,246,0.35)'
                    : touring
                    ? 'rgba(139,92,246,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  outline: isActive ? '1px solid rgba(139,92,246,0.6)' : touring ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: touring ? '#8B5CF6' : 'rgba(255,255,255,0.18)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11,
                  color: touring ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                  fontFamily: 'Georgia, serif',
                }}>
                  {name}
                </span>
                {count > 0 && (
                  <span style={{
                    fontSize: 9, fontFamily: 'monospace',
                    color: 'rgba(139,92,246,0.8)',
                    background: 'rgba(139,92,246,0.15)',
                    padding: '1px 5px', borderRadius: 8,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* City search */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${activeCity ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: 14,
        transition: 'border-color 0.2s',
      }}>
        <div style={{
          fontSize: 9, color: 'rgba(255,255,255,0.4)',
          letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10,
        }}>
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
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '10px 14px', color: 'white', fontSize: 12,
                outline: 'none', fontFamily: 'Georgia, serif',
              }}
            />
            {searching && (
              <div style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(139,92,246,0.6)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
          </div>
          {activeCity && (
            <button
              onClick={clearCity}
              style={{
                padding: '0 14px', height: 40, borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              CLEAR
            </button>
          )}
        </div>
        {activeCity && (
          <div style={{
            fontSize: 10, color: 'rgba(139,92,246,0.7)',
            fontFamily: 'monospace', marginTop: 8,
          }}>
            {filtered.length === 0
              ? `No shows near "${activeCity}" — showing all`
              : `${filtered.length} show${filtered.length !== 1 ? 's' : ''} near "${activeCity}"`}
          </div>
        )}
      </div>

      {/* Main event timeline */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 20, textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,100,100,0.7)', fontFamily: 'monospace', fontSize: 11, margin: 0 }}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState activeCity={activeCity} artistFilter={artistFilter} />
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Summary line */}
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontFamily: 'monospace' }}>
            {activeCity
              ? `SHOWS NEAR ${activeCity.toUpperCase()} — ${filtered.length} FOUND`
              : artistFilter
              ? `${artistFilter.toUpperCase()} — ${filtered.length} UPCOMING SHOWS`
              : `ALL UPCOMING SHOWS — ${filtered.length} ACROSS ${Object.keys(groupedByMonth).length} MONTHS`}
          </div>

          {/* Month groups */}
          {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
            <div key={month}>
              <div style={{
                fontSize: 9, color: 'rgba(139,92,246,0.6)',
                letterSpacing: 2, fontFamily: 'monospace',
                marginBottom: 8, paddingBottom: 6,
                borderBottom: '1px solid rgba(139,92,246,0.12)',
              }}>
                {month.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence>
                  {monthEvents.map((e, i) => {
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
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          textDecoration: 'none',
                          transition: 'background 0.15s, border-color 0.15s',
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
                        {/* Date badge */}
                        <div style={{
                          minWidth: 40, textAlign: 'center',
                          padding: '5px 4px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.05)', flexShrink: 0,
                        }}>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                            {new Date(e.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                          </div>
                          <div style={{ fontSize: 15, color: 'white', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.2 }}>
                            {new Date(e.date).getDate()}
                          </div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, color: 'white',
                            fontFamily: 'Georgia, serif', fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {e.artist}
                          </div>
                          <div style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.45)',
                            fontFamily: 'monospace', marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {e.venue} · {e.city}{e.region ? `, ${e.region}` : ''}, {e.country}
                          </div>
                        </div>

                        {/* Days badge */}
                        <div style={{
                          fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                          letterSpacing: 1, flexShrink: 0, padding: '3px 7px',
                          borderRadius: 6,
                          background: days === 'TODAY' || days === 'TOMORROW'
                            ? 'rgba(139,92,246,0.25)'
                            : 'rgba(255,255,255,0.05)',
                          color: days === 'TODAY' || days === 'TOMORROW'
                            ? '#a78bfa'
                            : 'rgba(255,255,255,0.3)',
                        }}>
                          {days}
                        </div>
                      </motion.a>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 40, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
        SCANNING TOUR DATES...
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
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
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>🎸</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, margin: '0 0 4px' }}>
        {activeCity
          ? `None of your top artists are playing near ${activeCity} in the next year.`
          : artistFilter
          ? `${artistFilter} has no upcoming shows in the next year.`
          : 'No upcoming shows found for your top artists.'}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 10, margin: 0 }}>
        {activeCity ? 'Try clearing the city filter to see all tour dates.' : 'Check back soon — tours get announced frequently.'}
      </p>
    </div>
  );
}