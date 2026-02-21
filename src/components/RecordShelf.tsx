'use client';
import { useState } from 'react';
import { Record } from '@/app/page';

interface Props {
  records: Record[];
  onRecordClick: (record: Record) => void;
  activeId?: string;
}

function CDDisc({ record, isActive, onClick, size = 150 }: {
  record: Record; isActive: boolean; onClick: () => void; size?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('rid', record.id)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        transform: hovered ? 'translateY(-10px) scale(1.07)' : isActive ? 'translateY(-7px)' : 'translateY(0)',
        transition: 'transform 0.22s ease',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {isActive && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: `2.5px solid ${record.accent}`,
            boxShadow: `0 0 28px ${record.accent}90`,
          }} />
        )}

        <svg width={size} height={size} viewBox="0 0 100 100" style={{
          display: 'block',
          filter: hovered
            ? `drop-shadow(0 10px 28px ${record.accent}95) brightness(1.22)`
            : isActive
            ? `drop-shadow(0 6px 20px ${record.accent}80) brightness(1.12)`
            : `drop-shadow(0 4px 18px rgba(0,0,0,0.85))`,
          transition: 'filter 0.22s',
        }}>
          <defs>
            <radialGradient id={`disc-${record.id}`} cx="42%" cy="38%">
              <stop offset="0%" stopColor="#505050" />
              <stop offset="40%" stopColor="#323232" />
              <stop offset="100%" stopColor="#1c1c1c" />
            </radialGradient>
            <radialGradient id={`label-${record.id}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor={record.label} />
              <stop offset="55%" stopColor={record.accent} />
              <stop offset="100%" stopColor={record.color} />
            </radialGradient>
            <linearGradient id={`sheen-${record.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={record.label} stopOpacity="0.55" />
              <stop offset="45%" stopColor={record.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={record.label} stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="49" fill="#282828" />
          <circle cx="50" cy="50" r="47" fill={`url(#disc-${record.id})`} />
          {[42, 36, 30, 24, 18].map((r, i) => (
            <circle key={i} cx="50" cy="50" r={r} fill="none"
              stroke={i % 2 === 0 ? `${record.accent}55` : 'rgba(255,255,255,0.08)'}
              strokeWidth={i % 2 === 0 ? 1.6 : 0.7}
            />
          ))}
          <circle cx="50" cy="50" r="47" fill={`url(#sheen-${record.id})`} />
          <ellipse cx="32" cy="26" rx="14" ry="8" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="20" fill={`url(#label-${record.id})`} />
          {record.rings.slice(0, 2).map((c, i) => (
            <circle key={i} cx="50" cy="50" r={18 - i * 4.5} fill="none" stroke={c} strokeWidth="0.9" opacity="0.65" />
          ))}
          <text x="50" y="56" textAnchor="middle" fontSize="17">{record.icon}</text>
          <circle cx="50" cy="50" r="4.5" fill="#111" />
          <circle cx="50" cy="50" r="2.2" fill="#222" />
        </svg>
      </div>

      <div style={{
        fontSize: 11, letterSpacing: 2.5,
        fontFamily: 'monospace', fontWeight: 700,
        color: isActive ? record.accent : '#ffffff',
        transition: 'color 0.2s',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>{record.title}</div>
    </div>
  );
}

export default function RecordShelf({ records, onRecordClick, activeId }: Props) {
  const looped = [...records, ...records, ...records, ...records];
  const itemWidth = 190;
  const totalWidth = records.length * itemWidth;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <style>{`
        @keyframes carousel-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${totalWidth}px); }
        }
        .carousel-track {
          display: flex;
          gap: 40px;
          align-items: center;
          width: max-content;
          animation: carousel-scroll ${records.length * 5}s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Carousel — fades at 40/60 so CDs vanish well before reaching turntable edges */}
      <div style={{
        width: '100vw',
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent 0%, black 45%, black 60%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 45%, black 60%, transparent 100%)',
        paddingTop: 4,
        paddingBottom: 4,
      }}>
        <div className="carousel-track">
          {looped.map((rec, i) => (
            <CDDisc
              key={`${rec.id}-${i}`}
              record={rec}
              isActive={activeId === rec.id}
              onClick={() => onRecordClick(rec)}
              size={150}
            />
          ))}
        </div>
      </div>
    </div>
  );
}