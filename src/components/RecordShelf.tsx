'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Record } from '@/lib/constants';

interface Props {
  records: Record[];
  onRecordClick: (record: Record) => void;
  activeId?: string;
}

function SpineRecord({
  record,
  index,
  isActive,
  onClick,
}: {
  record: Record;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('rid', record.id)}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: isActive ? -20 : 0, opacity: 1 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -14, transition: { duration: 0.18, ease: 'easeOut' } }}
      style={{
        position: 'relative',
        width: 58,
        height: 300,
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Main sleeve / spine */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 58,
          height: 300,
          borderRadius: 6,
          zIndex: 1,
          background: `linear-gradient(160deg, ${record.color} 0%, ${record.spineColor} 60%, #0a0604 100%)`,
          border: `1px solid ${record.accent}50`,
          boxShadow: `
            3px 0 0 ${record.rings[1]},
            6px 0 0 ${record.rings[2]},
            9px 0 0 ${record.rings[3]},
            3px 6px 30px rgba(0,0,0,0.75),
            inset 2px 0 0 rgba(255,255,255,0.08)
          `,
          overflow: 'hidden',
        }}
      >
        {/* Texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.1,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 5px)',
        }} />

        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: record.accent, opacity: 0.9,
          borderRadius: '6px 6px 0 0',
        }} />

        {/* Vertical title */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          whiteSpace: 'nowrap',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 13,
          fontWeight: 300,
          letterSpacing: '0.5em',
          color: 'white',
          textShadow: `0 0 12px ${record.accent}, 0 1px 4px rgba(0,0,0,0.8)`,
        }}>
          {record.title}
        </div>

        {/* Bottom catalog dot */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%',
          transform: 'translateX(-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: record.accent,
          opacity: 0.6,
          boxShadow: `0 0 6px ${record.accent}`,
        }} />

        {/* Left accent stripe */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
          background: `linear-gradient(to bottom, ${record.accent}, ${record.color})`,
          opacity: 0.8, borderRadius: '6px 0 0 6px',
        }} />

        {/* Hover glow */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(160deg, ${record.accent}25 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{
            position: 'absolute', bottom: -8, left: 0, right: 0,
            height: 3, borderRadius: 2,
            background: record.accent,
            boxShadow: `0 0 10px ${record.accent}`,
          }}
        />
      )}
    </motion.div>
  );
}

export default function RecordShelf({ records, onRecordClick, activeId }: Props) {
  return (
    <div style={{ width: '100%', maxWidth: 580, padding: '0 16px' }}>
      {/* Label */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 4,
          fontFamily: 'monospace',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          Your Collection — Click or Drag to Turntable
        </span>
      </div>

      {/* Shelf container */}
      <div style={{
        position: 'relative',
        borderRadius: 12,
        padding: '20px 20px 0 20px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.5)',
      }}>
        {/* Back wall */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12, zIndex: 0,
          background: 'linear-gradient(to bottom, #1E0E08 0%, #150A04 100%)',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 60px)',
        }} />

        {/* Records row */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'nowrap',
          paddingBottom: 4,
        }}>
          {records.map((rec, i) => (
            <SpineRecord
              key={rec.id}
              record={rec}
              index={i}
              isActive={activeId === rec.id}
              onClick={() => onRecordClick(rec)}
            />
          ))}
        </div>

        {/* Shelf board */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: 20, marginTop: 12,
          background: 'linear-gradient(to bottom, #7B5030 0%, #5A3418 40%, #3A1E08 100%)',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
        }} />
        <div style={{
          height: 8,
          background: 'linear-gradient(to bottom, #2C1208, #1A0A04)',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
        }} />
      </div>
    </div>
  );
}