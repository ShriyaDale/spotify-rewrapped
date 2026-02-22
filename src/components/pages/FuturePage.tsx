'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { data: any }

function toNumber(...values: any[]): number {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export default function FuturePage({ data }: Props) {
  const [llmSummary, setLlmSummary] = useState<string | null>(null);
  const [llmPredictions, setLlmPredictions] = useState<any[] | null>(null);
  const [llmRecommendations, setLlmRecommendations] = useState<any[] | null>(null);
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
      drift: data?.drift
        ? {
            tempoDrift: toNumber(data.drift.tempoDrift, data.drift.tempo_drift, data.drift.tempo),
            valenceDrift: toNumber(data.drift.valenceDrift, data.drift.valence_drift),
            danceabilityDrift: toNumber(data.drift.danceabilityDrift, data.drift.danceability_drift),
            energyDrift: toNumber(data.drift.energyDrift, data.drift.energy_drift),
          }
        : null,
      genres,
      topArtists,
      topTracks,
    };
  }, [data]);

  useEffect(() => {
    if (!llmPayload || !llmRequested) return;
    let cancelled = false;
    setLlmStatus('loading');
    console.log('Fetching AI insights with payload:', llmPayload);
    fetch('/api/future', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(llmPayload),
    })
      .then((res) => {
        console.log('Fetch response status:', res.status);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((res) => {
        console.log('Fetch response data:', res);
        if (cancelled) return;
        if (res?.summary || (Array.isArray(res?.predictions) && res.predictions.length > 0)) {
          setLlmSummary(res.summary ?? null);
          setLlmPredictions(res.predictions ?? null);
          setLlmRecommendations(res.recommendations ?? null);
          setLlmStatus('ready');
          return;
        }
        setLlmStatus('idle');
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        if (!cancelled) setLlmStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [llmPayload, llmRequested]);

  const profileName = typeof data?.profile?.name === 'string' && data.profile.name.trim().length > 0
    ? data.profile.name.trim()
    : 'Your';

  const drift = data?.drift ?? {};

  const safeDrift = {
    tempoDrift: toNumber(drift.tempoDrift, drift.tempo_drift, drift.tempo),
    valenceDrift: toNumber(drift.valenceDrift, drift.valence_drift),
    danceabilityDrift: toNumber(drift.danceabilityDrift, drift.danceability_drift),
    energyDrift: toNumber(drift.energyDrift, drift.energy_drift),
  };

  const activePredictions = (llmPredictions && llmPredictions.length > 0) ? llmPredictions : [];
  const activeRecommendations = (llmRecommendations && llmRecommendations.length > 0) ? llmRecommendations : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,0.9)', margin: 0, fontFamily: 'Georgia, serif', letterSpacing: 1 }}>
          Your Upcoming Trends
        </h2>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '8px 0 0', fontFamily: 'monospace', letterSpacing: 1 }}>
          {profileName}&apos;s taste trends · AI insights · 6-month forecast
        </p>
      </div>

      {/* AI Futurecast Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid rgba(112,48,176,0.2)',
          borderRadius: 14,
          padding: 16,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.63)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6 }}>
            AI FUTURECAST
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.37)', fontFamily: 'Georgia, serif', lineHeight: 1.5, margin: '0 0 10px' }}>
            Get personalized predictions powered by your Spotify listening patterns. Click below to generate insights.
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => setLlmRequested(true)}
          disabled={!llmPayload || llmStatus === 'loading'}
          style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.85)',
            background: llmStatus === 'loading' ? 'rgba(112,48,176,0.15)' : 'rgba(112,48,176,0.25)',
            border: '1px solid rgba(112,48,176,0.6)',
            borderRadius: 999,
            padding: '9px 18px',
            cursor: !llmPayload || llmStatus === 'loading' ? 'default' : 'pointer',
            opacity: (!llmPayload || llmStatus === 'loading') ? 0.6 : 1,
            transition: 'all 0.3s ease',
            marginBottom: llmSummary || activePredictions.length > 0 ? 16 : 0,
          }}
        >
          {llmStatus === 'loading' ? '⏳ GENERATING...' : 'GENERATE INSIGHTS'}
        </button>

        {/* Results */}
        {llmStatus === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: 1.5 }}
          >
            Analyzing your taste patterns...
          </motion.div>
        )}

        {llmStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: 11,
              color: '#FF8080',
              fontFamily: 'monospace',
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          >
            ⚠️ Failed to generate insights. Check console for details.
          </motion.div>
        )}

        {llmSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(112,48,176,0.08)',
              border: '1px solid rgba(112,48,176,0.15)',
              borderRadius: 12,
              padding: 14,
              marginBottom: activePredictions.length > 0 ? 12 : 0,
            }}
          >
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>
              {llmSummary}
            </p>
          </motion.div>
        )}

        {/* Predictions */}
        {activePredictions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activePredictions.map((p: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(112,48,176,0.05)',
                  border: '1px solid rgba(112,48,176,0.1)',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif', lineHeight: 1.5, margin: '0 0 8px' }}>
                    {p.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', background: '#7030B0', borderRadius: 1 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.confidence * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: '#7030B0', fontFamily: 'monospace', minWidth: '30px' }}>
                      {Math.round(p.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Song & Artist Recommendations */}
        {activeRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(112,48,176,0.1)',
            }}
          >
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 10 }}>
              PREDICTED NEXT LISTENS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeRecommendations.map((r: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: 'rgba(112,48,176,0.03)',
                    border: '1px solid rgba(112,48,176,0.08)',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Georgia, serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.song}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Georgia, serif', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      by {r.artist}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}