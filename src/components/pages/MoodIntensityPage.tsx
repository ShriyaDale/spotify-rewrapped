'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function HelixCanvas({ width = 130, height = 280 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = width, H = height;
    const cx = W / 2;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      tRef.current += 0.018;
      const t = tRef.current;
      const numPoints = 36;
      const amplitude = 42;

      ctx.beginPath();
      ctx.moveTo(cx, 12);
      ctx.lineTo(cx, H - 12);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const pointsA: { x: number; y: number; z: number; frac: number }[] = [];
      const pointsB: { x: number; y: number; z: number; frac: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const frac = i / (numPoints - 1);
        const y = 12 + frac * (H - 24);
        const angle = t + frac * Math.PI * 5;
        const xA = cx + Math.cos(angle) * amplitude;
        const zA = Math.sin(angle);
        pointsA.push({ x: xA, y, z: zA, frac });
        const xB = cx + Math.cos(angle + Math.PI) * amplitude;
        const zB = Math.sin(angle + Math.PI);
        pointsB.push({ x: xB, y, z: zB, frac });
      }

      for (let i = 0; i < numPoints; i += 2) {
        const a = pointsA[i], b = pointsB[i];
        const avgZ = (a.z + b.z) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.03, 0.08 + avgZ * 0.15)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      for (let i = 0; i < numPoints - 1; i++) {
        const a = pointsA[i], b = pointsA[i + 1];
        const depth = (a.z + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(205,133,63,${0.3 + depth * 0.7})`;
        ctx.lineWidth = 1.5 + depth;
        ctx.stroke();
      }

      for (let i = 0; i < numPoints - 1; i++) {
        const a = pointsB[i], b = pointsB[i + 1];
        const depth = (a.z + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(100,200,100,${0.3 + depth * 0.7})`;
        ctx.lineWidth = 1.5 + depth;
        ctx.stroke();
      }

      for (const p of pointsA) {
        const depth = (p.z + 1) / 2;
        const r = 2.5 + depth * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(240,180,100,${0.6 + depth * 0.4})`);
        g.addColorStop(1, `rgba(150,80,20,${0.3 + depth * 0.4})`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      for (const p of pointsB) {
        const depth = (p.z + 1) / 2;
        const r = 2.5 + depth * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(140,230,140,${0.6 + depth * 0.4})`);
        g.addColorStop(1, `rgba(30,90,30,${0.3 + depth * 0.4})`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
}

function StatBar({ label, value, color, delay = 0, source }: { label: string; value: number; color: string; delay?: number; source?: string }) {
  const safe = typeof value === 'number' && !isNaN(value) ? Math.min(1, Math.max(0, value)) : 0.5;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'white', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'monospace', color, fontWeight: 700 }}>{(safe * 100).toFixed(0)}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.14)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(to right, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${safe * 100}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay }}
        />
      </div>
      {source && (
        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.2)', fontFamily: 'monospace', marginTop: 3 }}>{source}</div>
      )}
    </div>
  );
}

interface Props { data: any }

export default function MoodIntensityPage({ data }: Props) {
  const rawIndices = data?.dna?.indices;
  const indices = (rawIndices && typeof rawIndices.groove === 'number' && !isNaN(rawIndices.groove))
    ? rawIndices
    : { groove: 0.72, brightness: 0.65, heat: 0.81, pace: 0.58 };

  const mood = data?.mood || { valence: 0.5, energy: 0.5, danceability: 0.5, acousticness: 0.3, variety: 0.5, avgPop: 0.5 };
  const recent = data?.recent || [];
  const isRealData = !!data?.profile;
  const topArtists = data?.artists || [];
  const topTracks = data?.topTracks || [];

  // Build a readable genre summary
  const genreList = topArtists
    .flatMap((a: any) => a.genres || [])
    .slice(0, 6)
    .join(', ');

  const W = 260, cx = 130, cy = 130, R = 88;
  const axes = [
    { l: 'Valence', v: mood.valence ?? 0.5, a: -90, col: '#FFD700' },
    { l: 'Energy', v: mood.energy ?? 0.5, a: -18, col: '#FF6B6B' },
    { l: 'Dance', v: mood.danceability ?? 0.5, a: 54, col: '#90EE90' },
    { l: 'Acoustic', v: mood.acousticness ?? 0.3, a: 126, col: '#87CEEB' },
    { l: 'Calm', v: 1 - (mood.energy ?? 0.5), a: 198, col: '#DDA0DD' },
  ];
  const toXY = (a: number, d: number) => ({ x: cx + Math.cos((a * Math.PI) / 180) * d, y: cy + Math.sin((a * Math.PI) / 180) * d });
  const dataPath = axes.map((a) => toXY(a.a, R * a.v)).map((p) => `${p.x},${p.y}`).join(' ');

  // Summary labels
  const moodLabel = (mood.valence ?? 0.5) > 0.6 ? 'upbeat' : (mood.valence ?? 0.5) < 0.4 ? 'melancholic' : 'balanced';
  const energyLabel = (mood.energy ?? 0.5) > 0.65 ? 'high-energy' : (mood.energy ?? 0.5) < 0.35 ? 'laid-back' : 'mid-tempo';
  const danceLabel = (mood.danceability ?? 0.5) > 0.6 ? 'groove-heavy' : 'less rhythmic';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Row: Helix + DNA Indices + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
        {/* Helix */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgb(255, 255, 255)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 }}>SONIC HELIX</div>
          <HelixCanvas width={120} height={240} />
        </div>

        {/* DNA Indices + Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'rgb(255, 255, 255)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>DNA INDICES</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatBar label="Groove" value={indices.groove} color="#CD853F" delay={0} />
              <StatBar label="Brightness" value={indices.brightness} color="#90EE90" delay={0.1} />
              <StatBar label="Heat" value={indices.heat} color="#FF6B6B" delay={0.2} />
              <StatBar label="Pace" value={indices.pace} color="#87CEEB" delay={0.3} />
            </div>
          </div>
          <div style={{ background: 'rgba(205,133,63,0.07)', border: '1px solid rgba(205,133,63,0.18)', borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
              Your listening is <strong style={{ color: 'white' }}>{moodLabel}</strong>, <strong style={{ color: 'white' }}>{energyLabel}</strong>, and <strong style={{ color: 'white' }}>{danceLabel}</strong>.
            </p>
          </div>
        </div>

        {/* Radar */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible' }}>
          <div style={{ fontSize: 12, color: 'rgb(255, 255, 255)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 }}>MOOD RADAR</div>
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${W}`} style={{ maxWidth: 260, maxHeight: 260, overflow: 'visible' }}>
            {[0.25, 0.5, 0.75, 1].map((s, i) => (
              <polygon key={i}
                points={axes.map((a) => toXY(a.a, R * s)).map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke={`rgba(255,255,255,${0.04 + i * 0.03})`} strokeWidth="1" />
            ))}
            {axes.map((a) => {
              const e = toXY(a.a, R);
              return <line key={a.l} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
            })}
            <motion.polygon points={dataPath}
              fill="rgba(74,128,32,0.18)" stroke="#6ABF40" strokeWidth="1.5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              transition={{ duration: 0.9, ease: 'easeOut' }} />
            {axes.map((a) => {
              const lp = toXY(a.a, R + 24);
              return (
                <text key={a.l} x={lp.x} y={lp.y} textAnchor="middle"
                  fill={a.col} fontSize="10" fontFamily="Georgia, serif" opacity="0.9">{a.l}</text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Row: Mood Stats + Top Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Mood Stats */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>
            MOOD STATS {!isRealData && <span style={{ color: 'rgba(255,100,100,0.8)' }}>· DEMO</span>}
          </div>
          <StatBar label="Valence" value={mood.valence ?? 0.5} color="#FFD700" delay={0} source="happy vs sad tendency" />
          <StatBar label="Energy" value={mood.energy ?? 0.5} color="#FF6B6B" delay={0.1} source="intense vs calm" />
          <StatBar label="Danceability" value={mood.danceability ?? 0.5} color="#90EE90" delay={0.2} source="groove factor" />
          <StatBar label="Acousticness" value={mood.acousticness ?? 0.3} color="#87CEEB" delay={0.3} source="organic vs produced" />
        </div>

        {/* Top Tracks */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>
            TOP TRACKS {!isRealData && <span style={{ color: 'rgba(255,100,100,0.8)' }}>· DEMO</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topTracks.slice(0, 5).map((track: any, i: number) => (
              <motion.div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 14, flexShrink: 0 }}>{i + 1}</span>
                {track.image && (
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: `url(${track.image}) center/cover`, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.name || 'Unknown Track'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artist || 'Unknown Artist'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
