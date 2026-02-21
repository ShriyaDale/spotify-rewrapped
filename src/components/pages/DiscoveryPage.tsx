'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props { data: any }

export default function DiscoveryPage({ data }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const topTracks = data?.topTracks || [];
  const defaultRecs = [
    { name: 'Hot Chip', type: 'artist' }, { name: 'Four Tet', type: 'artist' },
    { name: 'Caribou', type: 'artist' }, { name: 'Nicolas Jaar', type: 'artist' },
    { name: 'Floating Points', type: 'artist' }, { name: 'Jon Hopkins', type: 'artist' },
    { name: 'Burial', type: 'artist' }, { name: 'Objekt', type: 'artist' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const d = await res.json();
        setResults(d.tracks?.items || []);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>SEARCH CATALOG</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search tracks, artists, albums..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              color: 'white',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'Georgia, serif',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '0 16px', borderRadius: 10, border: 'none',
              background: 'rgba(46,74,172,0.5)', color: 'white',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            🔍
          </button>
        </div>
        {loading && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: 'monospace' }}>Searching…</div>}
        {results.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.slice(0, 5).map((r: any) => (
              <a
                key={r.id}
                href={r.external_urls?.spotify || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                }}
              >
                {r.album?.images?.[2] && (
                  <img src={r.album.images[2].url} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />
                )}
                <div>
                  <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.artists?.[0]?.name}</div>
                </div>
                {r.preview_url && (
                  <button
                    onClick={(e) => { e.preventDefault(); new Audio(r.preview_url).play(); }}
                    style={{ marginLeft: 'auto', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                  >▶️</button>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Your Top Tracks */}
      {topTracks.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>YOUR TOP TRACKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topTracks.slice(0, 5).map((t: any, i: number) => (
              <motion.div key={t.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 16 }}>{i + 1}</span>
                {t.image && <img src={t.image} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{t.artist}</div>
                </div>
                <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1DB954', textDecoration: 'none' }}>↗</a>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>RECOMMENDED · BASED ON YOUR DNA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {defaultRecs.map((r, i) => (
            <motion.div key={r.name}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(46,74,172,0.18)',
                cursor: 'pointer',
              }}
              whileHover={{ borderColor: 'rgba(46,74,172,0.4)', background: 'rgba(46,74,172,0.06)' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: `hsl(${i * 40 + 200}, 50%, 20%)` }}>🎵</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif' }}>{r.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
