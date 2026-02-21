'use client';
import { motion } from 'framer-motion';

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

export default function MoodPage({ data }: Props) {
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

  // Mood timeline — use valence if available, otherwise flat 0.5
  const hasValence = recent.some((r: any) => r.valence != null);
  const timeline = recent.length
    ? recent.map((r: any, i: number) => ({
        x: i * (360 / Math.max(recent.length - 1, 1)),
        y: r.valence != null ? r.valence : mood.valence ?? 0.5,
      }))
    : Array.from({ length: 20 }, (_, i) => ({ x: i * 19, y: 0.5 + Math.sin(i * 0.5) * 0.15 }));

  const pathD = timeline.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x},${55 - p.y * 50}`).join(' ');
  const areaD = pathD + ` L${timeline[timeline.length - 1].x},60 L0,60 Z`;

  // Generate a human-readable summary from the actual scores
  const moodLabel = (mood.valence ?? 0.5) > 0.6 ? 'upbeat' : (mood.valence ?? 0.5) < 0.4 ? 'melancholic' : 'balanced';
  const energyLabel = (mood.energy ?? 0.5) > 0.65 ? 'high-energy' : (mood.energy ?? 0.5) < 0.35 ? 'laid-back' : 'mid-tempo';
  const danceLabel = (mood.danceability ?? 0.5) > 0.6 ? 'groove-heavy' : 'less rhythmic';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

      {/* Radar */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8 }}>RADAR PROFILE</div>
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
          CHEMISTRY STATS {!isRealData && <span style={{ color: 'rgba(255,100,100,0.8)' }}>· DEMO</span>}
        </div>
        <StatBar label="Valence" value={mood.valence ?? 0.5} color="#FFD700" delay={0} source="derived from happy/sad genre presence" />
        <StatBar label="Energy" value={mood.energy ?? 0.5} color="#FF6B6B" delay={0.1} source="derived from intense vs calm genre presence" />
        <StatBar label="Danceability" value={mood.danceability ?? 0.5} color="#90EE90" delay={0.2} source="derived from rhythm-focused genres" />
        <StatBar label="Acousticness" value={mood.acousticness ?? 0.3} color="#87CEEB" delay={0.3} source="derived from acoustic vs electronic genres" />
        {mood.variety != null && (
          <StatBar label="Variety" value={mood.variety} color="#DDA0DD" delay={0.4} source="unique artists in your last 50 plays" />
        )}

        {/* Human summary */}
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'rgba(74,128,32,0.07)', border: '1px solid rgba(74,128,32,0.2)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
            Your listening is <strong style={{ color: 'white' }}>{moodLabel}</strong>, <strong style={{ color: 'white' }}>{energyLabel}</strong>, and <strong style={{ color: 'white' }}>{danceLabel}</strong>.
            {genreList && <span> Shaped primarily by: <span style={{ color: 'rgba(205,133,63,0.9)' }}>{genreList}</span>.</span>}
          </p>
        </div>
      </div>

      {/* Mood timeline */}
      <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'monospace' }}>MOOD TIMELINE — LAST {recent.length || 20} PLAYS</div>
          {!hasValence && (
            <div style={{ fontSize: 9, color: 'rgba(255,180,50,0.6)', fontFamily: 'monospace' }}>using estimated valence · audio features deprecated</div>
          )}
        </div>
        <svg width="100%" height="70" viewBox="0 0 380 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="moodgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Midline */}
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