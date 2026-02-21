'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function StatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0.5;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Georgia, serif' }}>{label}</span>
        <span style={{ fontFamily: 'monospace', color }}>{Math.round(safeValue * 100)}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${safeValue * 100}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay }}
        />
      </div>
    </div>
  );
}

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

interface Props { data: any }

export default function DNAPage({ data }: Props) {
  const rawIndices = data?.dna?.indices;
  const indices = (rawIndices && typeof rawIndices.groove === 'number' && !isNaN(rawIndices.groove))
    ? rawIndices
    : { groove: 0.72, brightness: 0.65, heat: 0.81, pace: 0.58 };

  const genres = (data?.genres && data.genres.length > 0) ? data.genres : [
    { name: 'Indie Rock', pct: 32 }, { name: 'Alternative', pct: 24 },
    { name: 'Electronic', pct: 18 }, { name: 'Pop', pct: 16 }, { name: 'Other', pct: 10 },
  ];

  const topTracks = data?.topTracks || [];

  // Organize tracks by popularity tiers
  const highPop = topTracks.filter((t: any) => (t.popularity ?? 0) >= 70);
  const midPop = topTracks.filter((t: any) => (t.popularity ?? 0) >= 40 && (t.popularity ?? 0) < 70);
  const deepCuts = topTracks.filter((t: any) => (t.popularity ?? 0) < 40);

  const TrackItem = ({ t, i }: { t: any; i: number }) => (
    <motion.a
      href={t.spotifyUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        textDecoration: 'none',
        flex: '1 1 200px',
      }}
    >
      {t.image && <img src={t.image} alt={t.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{t.artist}</div>
      </div>
    </motion.a>
  );

  const TrackSection = ({ title, tracks, color }: { title: string; tracks: any[]; color: string }) => {
    if (!tracks.length) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 }}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tracks.map((t: any, i: number) => <TrackItem key={t.name} t={t} i={i} />)}
        </div>
      </div>
    );
  };

  return (
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

      {/* Genre blend */}
      <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>GENRE DNA BLEND</div>
        <div style={{ display: 'flex', height: 44, borderRadius: 8, overflow: 'hidden', gap: 1 }}>
          {genres.map((g: any, i: number) => (
            <motion.div
              key={g.name}
              style={{
                width: `${g.pct}%`, background: `hsl(${i * 55 + 15}, 55%, ${26 + i * 3}%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif',
                position: 'relative', cursor: 'default',
              }}
              title={`${g.name}: ${g.pct}%`}
              initial={{ scaleY: 0, transformOrigin: 'bottom' }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.09, duration: 0.5 }}
            >
              {g.pct > 12 && g.name}
            </motion.div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {genres.map((g: any, i: number) => (
            <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: `hsl(${i * 55 + 15}, 55%, 30%)` }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Georgia, serif' }}>{g.name} {g.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top tracks by category */}
      {topTracks.length > 0 && (
        <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>YOUR TOP TRACKS</div>
          <TrackSection title="MAINSTREAM HITS" tracks={highPop} color="rgba(205,133,63,0.7)" />
          <TrackSection title="MID-TIER FAVORITES" tracks={midPop} color="rgba(135,206,235,0.7)" />
          <TrackSection title="Records on Repeat" tracks={deepCuts} color="rgba(144,238,144,0.7)" />
        </div>
      )}

    </div>
  );
}