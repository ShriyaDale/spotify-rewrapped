'use client';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DEMO_MAP: Record<string, number> = {
  US: 68, GB: 62, DE: 58, FR: 55, AU: 52, JP: 48, CA: 51, BR: 44,
  SE: 47, NL: 50, ES: 46, IT: 43, NO: 45, PL: 41, MX: 38, KR: 35, AR: 32, IN: 30,
};

function GlobeCanvas({ countryMap, size = 260 }: { countryMap: Record<string, number>; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const rotRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const R = size / 2 - 6;
    const cx = size / 2, cy = size / 2;

    const countryCenters: Record<string, [number, number]> = {
      US: [38, -97], GB: [55, -3], DE: [51, 10], FR: [46, 2], AU: [-25, 133],
      JP: [36, 138], CA: [56, -96], BR: [-14, -51], SE: [62, 15], NL: [52, 5],
      ES: [40, -4], IT: [42, 12], NO: [65, 13], PL: [52, 20], MX: [23, -102],
      AR: [-34, -64], KR: [36, 128], NZ: [-42, 174], ZA: [-29, 25], IN: [20, 77],
      RU: [60, 100], CN: [35, 105], NG: [10, 8], EG: [27, 30],
    };

    function project(lat: number, lng: number, rot: number) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + rot) * (Math.PI / 180);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      return { x: cx + x * R, y: cy - y * R, z };
    }

    function drawGraticule(rot: number) {
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = project(lat, lng, rot);
          if (p.z < 0) { first = true; continue; }
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lng, rot);
          if (p.z < 0) { first = true; continue; }
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const rot = rotRef.current;

      const globe = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
      globe.addColorStop(0, '#1a3050');
      globe.addColorStop(0.5, '#0d1e35');
      globe.addColorStop(1, '#050f1e');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globe;
      ctx.fill();

      const atmo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R + 8);
      atmo.addColorStop(0, 'rgba(30,80,180,0.0)');
      atmo.addColorStop(1, 'rgba(30,80,180,0.25)');
      ctx.beginPath();
      ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();

      drawGraticule(rot);

      const maxCount = Math.max(...Object.values(countryMap), 1);

      Object.entries(countryCenters).forEach(([code, [lat, lng]]) => {
        const p = project(lat, lng, rot);
        if (p.z < 0.05) return;
        const depth = (p.z + 1) / 2;
        const count = countryMap[code] || 0;
        const hasData = count > 0;
        const intensity = count / maxCount;
        const dotR = hasData ? (3 + intensity * 8) * depth : 2 * depth;

        ctx.beginPath();
        ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
        if (hasData) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dotR);
          g.addColorStop(0, `rgba(0,255,160,${0.7 * depth})`);
          g.addColorStop(0.5, `rgba(0,180,100,${0.5 * depth})`);
          g.addColorStop(1, `rgba(0,80,40,${0.2 * depth})`);
          ctx.fillStyle = g;
          ctx.fill();
          if (intensity > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, dotR + 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,255,160,${0.2 * depth})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = `rgba(100,160,100,${0.25 * depth})`;
          ctx.fill();
        }

        if (hasData && intensity > 0.4 && depth > 0.6) {
          ctx.font = `${7 + depth * 2}px monospace`;
          ctx.fillStyle = `rgba(255,255,255,${0.4 + depth * 0.4})`;
          ctx.textAlign = 'center';
          ctx.fillText(code, p.x, p.y - dotR - 3);
        }
      });

      const spec = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, 0, cx - R * 0.2, cy - R * 0.2, R * 0.6);
      spec.addColorStop(0, 'rgba(255,255,255,0.07)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(30,100,180,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      rotRef.current += 0.3;
      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [countryMap, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', borderRadius: '50%' }} />;
}

interface Props { data: any }

export default function WorldPage({ data }: Props) {
  const rawMap = data?.countryMap;
  const countryMap: Record<string, number> = (rawMap && Object.keys(rawMap).length > 0) ? rawMap : DEMO_MAP;
  const isDemo = !rawMap || Object.keys(rawMap).length === 0;

  const topCountries = Object.entries(countryMap).sort(([, a], [, b]) => b - a).slice(0, 12);
  const max = topCountries[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace' }}>AVAILABILITY FOOTPRINT GLOBE</div>
        <GlobeCanvas countryMap={countryMap} size={260} />
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', textAlign: 'center', margin: 0, fontFamily: 'Georgia, serif' }}>
          {isDemo ? 'Demo data shown — Spotify no longer exposes market availability for new apps.' : 'Based on available_markets from your top tracks. Not actual listener counts.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          ['Markets', String(Object.keys(countryMap).length)],
          ['Top Country', topCountries[0]?.[0] || '—'],
          ['Coverage', `${Math.round(Object.keys(countryMap).length / 195 * 100)}%`],
        ].map(([l, v]) => (
          <div key={l} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(10,112,96,0.2)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, color: '#0A7060', fontWeight: 'bold', fontFamily: "'Playfair Display', serif" }}>{v}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'monospace', letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>TOP MARKETS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {topCountries.map(([code, count], i) => (
            <motion.div
              key={code}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: `rgba(10,112,96,${0.08 + (count / max) * 0.2})`,
                border: `1px solid rgba(10,112,96,${0.15 + (count / max) * 0.35})`,
              }}
            >
              <span style={{ fontSize: 12, color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>
              <span style={{ fontSize: 10, color: '#0A9080', fontFamily: 'monospace' }}>{count}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}