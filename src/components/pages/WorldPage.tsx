'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { AnimatePresence, motion } from 'framer-motion';

const GEO_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

const DEMO_SCORES: Record<string, number> = {
  'United States of America': 0.55,
  Canada: 0.38,
  Mexico: 0.3,
  Brazil: 0.28,
  France: 0.22,
  Germany: 0.24,
  Spain: 0.2,
  Italy: 0.18,
  Australia: 0.26,
  Japan: 0.23,
  India: 0.16,
  'United Kingdom': 0.34,
};

type Song = { title: string; artist: string; url?: string };

type CountryPanel = {
  name: string;
  code?: string | null;
  score: number;
  topSongs: Song[];
  hasData: boolean;
  reason?: string;
  source: 'live' | 'demo';
};

export default function WorldPage({ data }: { data: any }) {
  const [panel, setPanel] = useState<CountryPanel | null>(null);
  const [loadingName, setLoadingName] = useState<string | null>(null);

  const [selectedName, setSelectedName] = useState<string | null>(null);

  // cache by COUNTRY NAME only (stable)
  const [cache, setCache] = useState<Record<string, CountryPanel>>({});

  // persist scores by country name
  const [scores, setScores] = useState<Record<string, number>>({});

  // brighter orange scale
  const orangeHeat = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 0.2, 0.5, 0.8, 1])
      .range([
        'rgba(200,118,44,0.10)',
        'rgba(200,118,44,0.26)',
        'rgba(200,118,44,0.46)',
        'rgba(200,118,44,0.72)',
        'rgba(200,118,44,0.98)',
      ]);
  }, []);

  useEffect(() => {
    const names: string[] = data?.countryMap?.names ?? [];
    if (!Array.isArray(names) || names.length === 0) return;

    const toPrefetch = names.slice(0, 25);

    (async () => {
      for (const nm of toPrefetch) {
        try {
          await fetchCountry(nm, '');
        } catch {
          // ignore
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function baseScoreFor(name: string) {
    return scores[name] ?? cache[name]?.score ?? DEMO_SCORES[name] ?? 0.06;
  }

  function fillFor(name: string) {
    return orangeHeat(baseScoreFor(name));
  }

  function hoverFillFor(name: string) {
    return orangeHeat(Math.min(1, baseScoreFor(name) + 0.12));
  }

  async function fetchCountry(countryName: string, iso2?: string): Promise<CountryPanel> {
    const cached = cache[countryName];
    if (cached) return cached;

    try {
      const res = await fetch(
        `/api/world/country?name=${encodeURIComponent(countryName)}&code=${encodeURIComponent(iso2 || '')}`
      );

      const json = await res.json().catch(() => null);

      if (res.ok && json) {
        const songs = Array.isArray(json.topSongs) ? json.topSongs : [];

        const live: CountryPanel = {
          name: json.name ?? countryName,
          code: json.code ?? null,
          score: typeof json.score === 'number' ? json.score : 0,
          topSongs: songs,
          hasData: songs.length > 0,
          reason: json.reason,
          source: 'live',
        };

        setCache((prev) => ({ ...prev, [countryName]: live }));
        setScores((prev) => ({ ...prev, [countryName]: live.score }));
        return live;
      }

      const reason =
        (json && (json.reason || json.error)) ? String(json.reason || json.error) : `http_${res.status}`;

      const fallback: CountryPanel = {
        name: countryName,
        code: iso2 ? iso2.toUpperCase() : null,
        score: DEMO_SCORES[countryName] ?? 0.06,
        topSongs: [],
        hasData: false,
        reason,
        source: 'demo',
      };

      setCache((prev) => ({ ...prev, [countryName]: fallback }));
      setScores((prev) => ({ ...prev, [countryName]: fallback.score }));
      return fallback;
    } catch {
      const demoScore = DEMO_SCORES[countryName] ?? 0.06;
      const demoHasData = Object.prototype.hasOwnProperty.call(DEMO_SCORES, countryName);

      const demo: CountryPanel = {
        name: countryName,
        code: iso2 ? iso2.toUpperCase() : null,
        score: demoScore,
        topSongs: demoHasData
          ? [
              { title: 'Demo Song 1', artist: 'Demo Artist' },
              { title: 'Demo Song 2', artist: 'Demo Artist' },
              { title: 'Demo Song 3', artist: 'Demo Artist' },
              { title: 'Demo Song 4', artist: 'Demo Artist' },
              { title: 'Demo Song 5', artist: 'Demo Artist' },
            ]
          : [],
        hasData: demoHasData,
        reason: demoHasData ? 'demo_data' : 'network_error',
        source: 'demo',
      };

      setCache((prev) => ({ ...prev, [countryName]: demo }));
      setScores((prev) => ({ ...prev, [countryName]: demoScore }));
      return demo;
    }
  }

  async function previewCountry(countryName: string, iso2?: string) {
    if (!countryName || countryName === 'Unknown') return;
    if (selectedName) return;

    setLoadingName(countryName);
    const p = await fetchCountry(countryName, iso2);
    setPanel(p);
    setLoadingName(null);
  }

  async function selectCountry(countryName: string, iso2?: string) {
    if (!countryName || countryName === 'Unknown') return;

    setSelectedName(countryName);
    setLoadingName(countryName);

    const p = await fetchCountry(countryName, iso2);
    setPanel(p);

    setLoadingName(null);
  }

  function clearSelection() {
    // IMPORTANT: do NOT clear scores or panel
    // This keeps the map colored and the last panel visible.
    setSelectedName(null);
  }

  function SongBubble({ song }: { song: Song }) {
    const clickable = !!song.url;
    return (
      <motion.div
        whileHover={clickable ? { scale: 1.02 } : undefined}
        whileTap={clickable ? { scale: 0.99 } : undefined}
        onClick={() => {
          if (!song.url) return;
          window.open(song.url, '_blank', 'noopener,noreferrer');
        }}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '10px 12px',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontSize: 12, color: 'white', lineHeight: 1.2 }}>{song.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
          {song.artist}
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
      {/* MAP */}
      <div
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 3,
            fontFamily: 'monospace',
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span>WORLD TASTE MAP</span>
          <span style={{ letterSpacing: 1, color: 'rgba(255,255,255,0.22)' }}>
            more orange = higher match
          </span>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 150 }} style={{ width: '100%', height: 'auto' }}>
            <Geographies geography={GEO_URL}>
                {({ geographies }: any) =>
                  geographies.map((geo: any) => {
                    const name = (geo.properties?.name as string) || 'Unknown';
                    const iso2 =
                      (geo.properties?.iso_a2 as string) ||
                      (geo.properties?.ISO_A2 as string) ||
                      '';
                    const isSelected = selectedName === name;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => previewCountry(name, iso2)}
                      onClick={() => selectCountry(name, iso2)}
                      style={{
                        default: {
                          fill: fillFor(name),
                          outline: 'none',
                          stroke: isSelected ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.12)',
                          strokeWidth: isSelected ? 1.8 : 0.55,
                        },
                        hover: {
                          fill: hoverFillFor(name),
                          outline: 'none',
                          stroke: isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.26)',
                          strokeWidth: isSelected ? 2.0 : 1.0,
                        },
                        pressed: { fill: hoverFillFor(name), outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Hover to preview. Click to lock a country.
        </div>

        {loadingName && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace' }}>
            loading {loadingName}…
          </div>
        )}
      </div>

      {/* PANEL */}
      <div
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace' }}>
          COUNTRY DETAILS
        </div>

        <AnimatePresence mode="wait">
          {panel ? (
            <motion.div
              key={(selectedName ? 'selected:' : 'hover:') + panel.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ type: 'spring', damping: 18 }}
              style={{ marginTop: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 18, color: 'white', fontFamily: "'Playfair Display', serif" }}>
                  {panel.name}
                  {panel.code ? (
                    <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                      {panel.code}
                    </span>
                  ) : null}
                </div>

                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                  match {Math.round(panel.score * 100)}%
                </div>
              </div>

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace' }}>
                  {selectedName ? 'selected (click another country to switch)' : 'hover preview (click a country to lock)'}
                </div>

                {selectedName ? (
                  <button
                    onClick={clearSelection}
                    style={{
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.75)',
                      padding: '6px 10px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                    }}
                  >
                    ← back
                  </button>
                ) : null}
              </div>

              {panel.hasData && panel.topSongs.length > 0 ? (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {panel.topSongs.slice(0, 5).map((song, idx) => (
                    <SongBubble key={idx} song={song} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  No data available for this country.
                  <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                    {panel.reason ? `reason: ${panel.reason}` : 'limited chart coverage'}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}
            >
              Hover a country to preview. Click to lock selection.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}