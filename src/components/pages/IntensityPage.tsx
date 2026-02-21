'use client';
import { motion } from 'framer-motion';

interface Props { data: any }

export default function IntensityPage({ data }: Props) {
  const artists = data?.artists || [
    { name: 'Radiohead', intensity: 0.94, plays: 18, image: null },
    { name: 'Massive Attack', intensity: 0.81, plays: 12, image: null },
    { name: 'The National', intensity: 0.73, plays: 9, image: null },
    { name: 'Bon Iver', intensity: 0.65, plays: 7, image: null },
    { name: 'Fleet Foxes', intensity: 0.52, plays: 5, image: null },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top artist hero */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(176,32,32,0.25)', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: artists[0]?.image
              ? `url(${artists[0].image}) center/cover`
              : 'radial-gradient(circle at 35% 35%, #CC3300, #3D0000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '2px solid rgba(176,32,32,0.4)',
            boxShadow: '0 0 24px rgba(176,32,32,0.3)',
            flexShrink: 0,
          }}>
            {!artists[0]?.image && '🎸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace' }}>TOP ARTIST</div>
            <div style={{ fontSize: 22, color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 'bold', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {artists[0]?.name}
            </div>
            <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>
              🔥 {artists[0]?.plays} plays in last 50 · Streak active
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <motion.div
              style={{ fontSize: 52, fontWeight: 900, color: '#B02020', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              {Math.round(artists[0]?.intensity * 100)}
            </motion.div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: 1 }}>INTENSITY*</div>
          </div>
        </div>
      </div>

      {/* Artist bars */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 14 }}>FAN INTENSITY BARS</div>
        {artists.map((a: any, i: number) => (
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
                  animate={{ width: `${a.intensity * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.08 + 0.3 }}
                />
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#B02020', fontFamily: 'monospace', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {Math.round(a.intensity * 100)}
            </span>
          </motion.div>
        ))}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic', fontFamily: 'Georgia, serif', margin: '4px 0 0' }}>
          *Estimated: top rank × recent play frequency. Not official Spotify data.
        </p>
      </div>
    </div>
  );
}
