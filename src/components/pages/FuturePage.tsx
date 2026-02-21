'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { data: any }

export default function FuturePage({ data }: Props) {
  const [llmSummary, setLlmSummary] = useState<string | null>(null);
  const [llmPredictions, setLlmPredictions] = useState<any[] | null>(null);
  const [llmStatus, setLlmStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [llmRequested, setLlmRequested] = useState(false);

  const llmPayload = useMemo(() => {
    if (!data) return null;
    const genres = Array.isArray(data.genres)
      ? data.genres.slice(0, 6).map((g: any) => g?.name ?? g).filter(Boolean)
      : [];
    const topArtists = Array.isArray(data.artists)
      ? data.artists.slice(0, 6).map((a: any) => a?.name).filter(Boolean)
      : [];
    const topTracks = Array.isArray(data.topTracks)
      ? data.topTracks.slice(0, 6).map((t: any) => ({ name: t?.name, artist: t?.artist })).filter((t: any) => t.name)
      : [];

    return {
      profileName: data.profile?.name ?? null,
      mood: data.mood ?? null,
      drift: data.drift ?? null,
      genres,
      topArtists,
      topTracks,
    };
  }, [data]);

  useEffect(() => {
    if (!llmPayload || !llmRequested) return;
    let cancelled = false;
    setLlmStatus('loading');
    fetch('/api/future', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(llmPayload),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('future_failed'))))
      .then((res) => {
        if (cancelled) return;
        if (res?.summary || (Array.isArray(res?.predictions) && res.predictions.length > 0)) {
          setLlmSummary(res.summary ?? null);
          setLlmPredictions(res.predictions ?? null);
          setLlmStatus('ready');
          return;
        }
        setLlmStatus('idle');
      })
      .catch(() => {
        if (!cancelled) setLlmStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [llmPayload]);


  const drift = (data?.drift && data.drift.tempoDrift !== undefined)
    ? data.drift
    : { tempoDrift: 8, valenceDrift: 0.07, danceabilityDrift: -0.04, energyDrift: 0.06 };

  const safeDrift = {
    tempoDrift: drift.tempoDrift ?? 0,
    valenceDrift: drift.valenceDrift ?? 0,
    danceabilityDrift: drift.danceabilityDrift ?? 0,
    energyDrift: drift.energyDrift ?? 0,
  };

  const activePredictions = (llmPredictions && llmPredictions.length > 0) ? llmPredictions : [];
  const topArtistsText = llmPayload?.topArtists?.length
    ? llmPayload.topArtists.join(', ')
    : '';
  const topTracksText = llmPayload?.topTracks?.length
    ? llmPayload.topTracks.map((t: any) => `${t.name}${t.artist ? ` — ${t.artist}` : ''}`).join(', ')
    : '';
  const hasTopData = Boolean(topArtistsText || topTracksText);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(112,48,176,0.25)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>TASTE DRIFT · SHORT vs LONG TERM</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Tempo', value: safeDrift.tempoDrift, fmt: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)} BPM` },
            { label: 'Valence', value: safeDrift.valenceDrift, fmt: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}` },
            { label: 'Danceability', value: safeDrift.danceabilityDrift, fmt: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}` },
            { label: 'Energy', value: safeDrift.energyDrift, fmt: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}` },
          ].map((d) => (
            <div key={d.label} style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: d.value > 0 ? '#90EE90' : d.value < 0 ? '#FF8080' : 'rgba(255,255,255,0.4)', fontFamily: "'Playfair Display', serif" }}>
                {d.fmt(d.value)}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'monospace', letterSpacing: 1 }}>Δ {d.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontFamily: 'Georgia, serif', margin: '10px 0 0' }}>
          Comparing recent 4 weeks vs. all time. Positive = recent trend.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 4 }}>
          AI FUTURECAST
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic', fontFamily: 'Georgia, serif', margin: '0 0 14px' }}>
          Generated from your Spotify listening signals.
        </p>
        {hasTopData ? (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Georgia, serif', lineHeight: 1.6, margin: '0 0 10px' }}>
            Your top artists/songs were {topArtistsText}{topArtistsText && topTracksText ? ' and ' : ''}{topTracksText}.
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Georgia, serif', lineHeight: 1.6, margin: '0 0 10px' }}>
            Connect Spotify to see your top artists and tracks here.
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            onClick={() => setLlmRequested(true)}
            disabled={!llmPayload || llmStatus === 'loading'}
            style={{
              fontSize: 10,
              letterSpacing: 1.5,
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(112,48,176,0.2)',
              border: '1px solid rgba(112,48,176,0.6)',
              borderRadius: 999,
              padding: '7px 14px',
              cursor: 'pointer',
              opacity: (!llmPayload || llmStatus === 'loading') ? 0.6 : 1,
            }}
          >
            {llmStatus === 'loading' ? 'GENERATING...' : 'GENERATE AI FUTURECAST'}
          </button>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: 1.5 }}>
            Uses your current Spotify stats for the AI prompt
          </span>
        </div>
        {llmStatus === 'loading' && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 10 }}>
            GENERATING WITH AI...
          </div>
        )}
        {llmSummary && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: '0 0 12px' }}>
            {llmSummary}
          </p>
        )}
        {activePredictions.length === 0 && llmStatus !== 'loading' && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: 1.5 }}>
            Click generate to see your AI futurecast.
          </div>
        )}
        {activePredictions.map((p: any, i: number) => (
          <motion.div
            key={i}
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex', gap: 12, padding: 14, borderRadius: 12,
              background: 'rgba(112,48,176,0.06)',
              border: '1px solid rgba(112,48,176,0.14)',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', lineHeight: 1.65, margin: '0 0 8px' }}>{p.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: '#7030B0', borderRadius: 2, boxShadow: '0 0 6px rgba(112,48,176,0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.confidence * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.5, duration: 0.8 }}
                  />
                </div>
                <span style={{ fontSize: 10, color: '#7030B0', fontFamily: 'monospace' }}>{Math.round(p.confidence * 100)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}