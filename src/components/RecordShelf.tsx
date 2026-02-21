'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Record } from '@/app/page';

interface Props {
  records: Record[];
  onRecordClick: (record: Record) => void;
  activeId?: string;
}

function CDDisc({ record, isActive, onClick, size = 130 }: {
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
        transform: hovered ? 'translateY(-8px) scale(1.06)' : isActive ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.2s ease',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Active glow ring */}
        {isActive && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: `2.5px solid ${record.accent}`,
            boxShadow: `0 0 24px ${record.accent}90`,
          }} />
        )}

        <svg width={size} height={size} viewBox="0 0 100 100" style={{
          display: 'block',
          filter: hovered
            ? `drop-shadow(0 8px 24px ${record.accent}90) brightness(1.2)`
            : isActive
            ? `drop-shadow(0 6px 18px ${record.accent}80) brightness(1.12)`
            : `drop-shadow(0 4px 16px rgba(0,0,0,0.8))`,
          transition: 'filter 0.2s',
        }}>
          <defs>
            <radialGradient id={`disc-${record.id}`} cx="42%" cy="38%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="40%" stopColor="#2e2e2e" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            <radialGradient id={`label-${record.id}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor={record.label} />
              <stop offset="60%" stopColor={record.accent} />
              <stop offset="100%" stopColor={record.color} />
            </radialGradient>
            <linearGradient id={`sheen-${record.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={record.label} stopOpacity="0.5" />
              <stop offset="40%" stopColor={record.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={record.label} stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Rim */}
          <circle cx="50" cy="50" r="49" fill="#252525" />
          {/* Disc */}
          <circle cx="50" cy="50" r="47" fill={`url(#disc-${record.id})`} />
          {/* Groove rings */}
          {[42, 36, 30, 24].map((r, i) => (
            <circle key={i} cx="50" cy="50" r={r} fill="none"
              stroke={i % 2 === 0 ? `${record.accent}55` : 'rgba(255,255,255,0.09)'}
              strokeWidth={i % 2 === 0 ? 1.6 : 0.8}
            />
          ))}
          {/* Sheen */}
          <circle cx="50" cy="50" r="47" fill={`url(#sheen-${record.id})`} />
          {/* Highlight */}
          <ellipse cx="32" cy="26" rx="14" ry="8" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" />
          {/* Label */}
          <circle cx="50" cy="50" r="19" fill={`url(#label-${record.id})`} />
          {record.rings.slice(0, 2).map((c, i) => (
            <circle key={i} cx="50" cy="50" r={17 - i * 4} fill="none" stroke={c} strokeWidth="0.8" opacity="0.65" />
          ))}
          <text x="50" y="55" textAnchor="middle" fontSize="16">{record.icon}</text>
          {/* Spindle */}
          <circle cx="50" cy="50" r="4" fill="#111" />
          <circle cx="50" cy="50" r="2" fill="#222" />
        </svg>
      </div>

      <div style={{
        fontSize: 12, letterSpacing: 2.5,
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
  // Triple the records so the loop feels seamless
  const looped = [...records, ...records, ...records];
  const itemWidth = 160; // CD width + gap
  const totalWidth = records.length * itemWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{
        fontSize: 11, color: '#ffffff',
        letterSpacing: 4, fontFamily: 'monospace', fontWeight: 700,
      }}>
        YOUR COLLECTION — CLICK OR DRAG TO TURNTABLE
      </div>

      {/* Carousel viewport — clips left/right edges, reveals center */}
      <div style={{
        width: '100%',
        maxWidth: 760,
        overflow: 'hidden',
        position: 'relative',
        padding: '20px 0 16px',
        // Fade edges so CDs "disappear" behind the turntable sides
        maskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
      }}>
        <style>{`
          @keyframes carousel-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-${totalWidth}px); }
          }
          .carousel-track {
            display: flex;
            gap: 30px;
            align-items: flex-end;
            width: max-content;
            animation: carousel-scroll ${records.length * 4}s linear infinite;
          }
          .carousel-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="carousel-track">
          {looped.map((rec, i) => (
            <CDDisc
              key={`${rec.id}-${i}`}
              record={rec}
              isActive={activeId === rec.id}
              onClick={() => onRecordClick(rec)}
              size={130}
            />
          ))}
        </div>
      </div>
    </div>
  );
}