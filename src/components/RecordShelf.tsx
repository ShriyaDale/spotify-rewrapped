'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Record } from '@/app/page';

interface Props {
  records: Record[];
  onRecordClick: (record: Record) => void;
  activeId?: string;
}

function CDDisc({ record, index, isActive, onClick }: {
  record: Record; index: number; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('rid', record.id)}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: isActive ? -14 : 0, opacity: 1 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -10, transition: { duration: 0.15 } }}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}
    >
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        {/* Active glow ring */}
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              border: `2.5px solid ${record.accent}`,
              boxShadow: `0 0 20px ${record.accent}80`,
            }}
          />
        )}

        <svg width={100} height={100} viewBox="0 0 100 100" style={{
          display: 'block',
          filter: hovered
            ? `drop-shadow(0 6px 20px ${record.accent}90) brightness(1.15)`
            : isActive
            ? `drop-shadow(0 4px 16px ${record.accent}70) brightness(1.1)`
            : `drop-shadow(0 4px 14px rgba(0,0,0,0.8)) brightness(1.0)`,
          transition: 'filter 0.2s',
        }}>
          <defs>
            {/* Base disc — noticeably lighter than black */}
            <radialGradient id={`disc-${record.id}`} cx="42%" cy="38%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="40%" stopColor="#2e2e2e" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            {/* Label gradient using the record's own colors — bright */}
            <radialGradient id={`label-${record.id}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor={record.label} />
              <stop offset="60%" stopColor={record.accent} />
              <stop offset="100%" stopColor={record.color} />
            </radialGradient>
            {/* Iridescent sheen — more visible */}
            <linearGradient id={`sheen-${record.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={record.label} stopOpacity="0.45" />
              <stop offset="40%" stopColor={record.accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={record.label} stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Outer rim — slightly lighter than disc */}
          <circle cx="50" cy="50" r="49" fill="#252525" />
          {/* Main disc surface */}
          <circle cx="50" cy="50" r="47" fill={`url(#disc-${record.id})`} />

          {/* Groove rings — more visible */}
          {[42, 36, 30, 24].map((r, i) => (
            <circle key={i} cx="50" cy="50" r={r}
              fill="none"
              stroke={i % 2 === 0 ? `${record.accent}50` : 'rgba(255,255,255,0.08)'}
              strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
            />
          ))}

          {/* Color sheen overlay */}
          <circle cx="50" cy="50" r="47" fill={`url(#sheen-${record.id})`} />

          {/* Surface highlight arc */}
          <ellipse cx="32" cy="26" rx="14" ry="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

          {/* Label — bright, using accent colors */}
          <circle cx="50" cy="50" r="19" fill={`url(#label-${record.id})`} />
          {record.rings.slice(0, 2).map((c, i) => (
            <circle key={i} cx="50" cy="50" r={17 - i * 4}
              fill="none" stroke={c} strokeWidth="0.8" opacity="0.6"
            />
          ))}

          {/* Icon — larger and centered */}
          <text x="50" y="55" textAnchor="middle" fontSize="14">{record.icon}</text>

          {/* Spindle */}
          <circle cx="50" cy="50" r="4" fill="#111" />
          <circle cx="50" cy="50" r="2" fill="#222" />
        </svg>
      </div>

      {/* Title — pure white, larger */}
      <div style={{
        fontSize: 11, letterSpacing: 2.5,
        fontFamily: 'monospace', fontWeight: 700,
        color: isActive ? record.accent : '#ffffff',
        transition: 'color 0.2s',
        textAlign: 'center',
      }}>{record.title}</div>
    </motion.div>
  );
}

export default function RecordShelf({ records, onRecordClick, activeId }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      {/* CD tray — slightly lighter background so discs contrast */}
      <div style={{
        display: 'flex', gap: 22, alignItems: 'flex-end', justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '24px 36px 20px',
        background: 'linear-gradient(to bottom, #2a1a10, #1a1008)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {records.map((rec, i) => (
          <CDDisc
            key={rec.id}
            record={rec}
            index={i}
            isActive={activeId === rec.id}
            onClick={() => onRecordClick(rec)}
          />
        ))}
      </div>
    </div>
  );
}