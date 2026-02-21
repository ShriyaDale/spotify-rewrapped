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
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
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
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(to right, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${safe * 100}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay }}
        />
      </div>
      {source && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: 3 }}>{source}</div>
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

  // Build a readable genre summary
  const genreList = topArtists
    .flatMap((a: any) => a.genres || [])
    .slice(0, 6)
    .join(', ');

  const W = 220, cx = 110, cy = 110, R = 85;
  const axes = [
    { l: 'Valence', v: mood.valence ?? 0.5, a: -90, col: '#FFD700' },
    { l: 'Energy', v: mood.energy ?? 0.5, a: -18, col: '#FF6B6B' },
    { l: 'Dance', v: mood.danceability ?? 0.5, a: 54, col: '#90EE90' },
    { l: 'Acoustic', v: mood.acousticness ?? 0.3, a: 126, col: '#87CEEB' },
    { l: 'Calm', v: 1 - (mood.energy ?? 0.5), a: 198, col: '#DDA0DD' },
  ];
  const toXY = (a: number, d: number) => ({ x: cx + Math.cos((a * Math.PI) / 180) * d, y: cy + Math.sin((a * Math.PI) / 180) * d });
  const dataPath = axes.map((a) => toXY(a.a, R * a.v)).map((p) => `${p.x},${p.y}`).join(' ');

  // Mood timeline
  const hasValence = recent.some((r: any) => r.valence != null);
  const timeline = recent.length
    ? recent.map((r: any, i: number) => ({
        x: i * (360 / Math.max(recent.length - 1, 1)),
        y: r.valence != null ? r.valence : mood.valence ?? 0.5,
      }))
    : Array.from({ length: 20 }, (_, i) => ({ x: i * 19, y: 0.5 + Math.sin(i * 0.5) * 0.15 }));

  const pathD = timeline.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x},${55 - p.y * 50}`).join(' ');
  const areaD = pathD + ` L${timeline[timeline.length - 1].x},60 L0,60 Z`;

  // Summary labels
  const moodLabel = (mood.valence ?? 0.5) > 0.6 ? 'upbeat' : (mood.valence ?? 0.5) < 0.4 ? 'melancholic' : 'balanced';
  const energyLabel = (mood.energy ?? 0.5) > 0.65 ? 'high-energy' : (mood.energy ?? 0.5) < 0.35 ? 'laid-back' : 'mid-tempo';
  const danceLabel = (mood.danceability ?? 0.5) > 0.6 ? 'groove-heavy' : 'less rhythmic';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Helix + DNA Indices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Helix */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 }}>SONIC HELIX</div>
          <HelixCanvas width={120} height={240} />
        </div>

        {/* DNA Indices */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>DNA INDICES</div>
          <StatBar label="Groove" value={indices.groove} color="#CD853F" delay={0} />
          <StatBar label="Brightness" value={indices.brightness} color="#90EE90" delay={0.1} />
          <StatBar label="Heat" value={indices.heat} color="#FF6B6B" delay={0.2} />
          <StatBar label="Pace" value={indices.pace} color="#87CEEB" delay={0.3} />
          <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, background: 'rgba(205,133,63,0.07)', border: '1px solid rgba(205,133,63,0.18)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
              "Your needle lands on high-energy grooves with upbeat melodies."
            </p>
          </div>
        </div>
      </div>
      {/* Top artist hero */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(176,32,32,0.25)', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: topArtists[0]?.image
              ? `url(${topArtists[0].image}) center/cover`
              : 'radial-gradient(circle at 35% 35%, #CC3300, #3D0000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '2px solid rgba(176,32,32,0.4)',
            boxShadow: '0 0 24px rgba(176,32,32,0.3)',
            flexShrink: 0,
          }}>
            {!topArtists[0]?.image && '🎸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace' }}>TOP ARTIST</div>
            <div style={{ fontSize: 22, color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 'bold', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topArtists[0]?.name}
            </div>
            <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>
              🔥 {topArtists[0]?.plays} plays in last 50 · Streak active
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <motion.div
              style={{ fontSize: 52, fontWeight: 900, color: '#B02020', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              {Math.round(topArtists[0]?.intensity * 100 || 75)}
            </motion.div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: 1 }}>INTENSITY</div>
          </div>
        </div>
      </div>

      {/* Radar + Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Radar */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 }}>MOOD RADAR</div>
          <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
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
              const lp = toXY(a.a, R + 22);
              return (
                <text key={a.l} x={lp.x} y={lp.y} textAnchor="middle"
                  fill={a.col} fontSize="10" fontFamily="Georgia, serif" opacity="0.9">{a.l}</text>
              );
            })}
          </svg>
        </div>

        {/* Stats */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>
            MOOD STATS {!isRealData && <span style={{ color: 'rgba(255,100,100,0.8)' }}>· DEMO</span>}
          </div>
          <StatBar label="Valence" value={mood.valence ?? 0.5} color="#FFD700" delay={0} source="happy vs sad tendency" />
          <StatBar label="Energy" value={mood.energy ?? 0.5} color="#FF6B6B" delay={0.1} source="intense vs calm" />
          <StatBar label="Danceability" value={mood.danceability ?? 0.5} color="#90EE90" delay={0.2} source="groove factor" />
          <StatBar label="Acousticness" value={mood.acousticness ?? 0.3} color="#87CEEB" delay={0.3} source="organic vs produced" />

          {/* Summary */}
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'rgba(74,128,32,0.07)', border: '1px solid rgba(74,128,32,0.2)' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
              Your listening is <strong style={{ color: 'white' }}>{moodLabel}</strong>, <strong style={{ color: 'white' }}>{energyLabel}</strong>, and <strong style={{ color: 'white' }}>{danceLabel}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Fan intensity bars */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>TOP ARTISTS</div>
        {topArtists.slice(0, 5).map((a: any, i: number) => (
          <motion.div
            key={a.name}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 14, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', marginBottom: 5 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 8 }}>{a.plays} plays</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(to right, #5A0808, #B02020)', boxShadow: '0 0 6px rgba(176,32,32,0.4)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(a.intensity ?? 0.5) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.08 + 0.3 }}
                />
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#B02020', fontFamily: 'monospace', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {Math.round((a.intensity ?? 0.5) * 100)}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Mood timeline */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace' }}>MOOD TIMELINE — LAST {recent.length || 20} PLAYS</div>
          {!hasValence && (
            <div style={{ fontSize: 9, color: 'rgba(255,180,50,0.6)', fontFamily: 'monospace' }}>estimated valence</div>
          )}
        </div>
        <svg width="100%" height="70" viewBox="0 0 380 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="moodgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <path d={areaD} fill="url(#moodgrad)" />
          <motion.path
            d={pathD} fill="none" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>oldest</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>most recent</span>
        </div>
      </div>
    </div>
  );
}
