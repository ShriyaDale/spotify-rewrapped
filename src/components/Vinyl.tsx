'use client';
import { motion } from 'framer-motion';
import { Record } from '@/app/page';

interface Props {
  record: Record;
  size?: number;
  spin?: boolean;
  glow?: boolean;
  className?: string;
}

export default function Vinyl({ record, size = 200, spin = false, glow = false }: Props) {
  const grooves = Array.from({ length: 16 }, (_, i) => 96 - i * 5.2);

  return (
    <motion.div
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
      animate={spin ? { rotate: 360 } : { rotate: 0 }}
      transition={spin ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0.5 }}
    >
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: -24,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${record.accent}35 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`vinyl-rg-${record.id}`} cx="42%" cy="38%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="55%" stopColor="#0f0f0f" />
            <stop offset="100%" stopColor="#060606" />
          </radialGradient>
          <radialGradient id={`label-rg-${record.id}`} cx="50%" cy="42%">
            <stop offset="0%" stopColor={record.label} />
            <stop offset="80%" stopColor={record.color} />
            <stop offset="100%" stopColor={record.spineColor} />
          </radialGradient>
        </defs>

        {/* Outer rim */}
        <circle cx="100" cy="100" r="99" fill="#050505" />
        <circle cx="100" cy="100" r="97" fill={`url(#vinyl-rg-${record.id})`} />

        {/* Grooves */}
        {grooves.map((r, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={i % 3 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.4)'}
            strokeWidth={i % 3 === 0 ? 0.9 : 0.4}
          />
        ))}

        {/* Highlight sheen */}
        <ellipse cx="70" cy="62" rx="30" ry="17" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <ellipse cx="66" cy="60" rx="14" ry="8" fill="rgba(255,255,255,0.025)" />

        {/* Label */}
        <circle cx="100" cy="100" r="30" fill={`url(#label-rg-${record.id})`} />
        {record.rings.map((c, i) => (
          <circle key={i} cx="100" cy="100" r={28 - i * 3} fill="none" stroke={c} strokeWidth="0.7" opacity="0.5" />
        ))}

        <text x="100" y="93" textAnchor="middle" fontSize="7.5" fontFamily="Georgia, serif" fill={record.color} fontWeight="bold" letterSpacing="0.8">
          {record.title.length > 8 ? record.title.slice(0, 8) : record.title}
        </text>
        <text x="100" y="106" textAnchor="middle" fontSize="13">
          {record.icon}
        </text>
        <text x="100" y="118" textAnchor="middle" fontSize="4" fontFamily="Georgia, serif" fill={record.color} opacity="0.55" letterSpacing="1.2">
          BETTER WRAPPED™
        </text>

        {/* Spindle */}
        <circle cx="100" cy="100" r="4" fill="#050505" />
        <circle cx="100" cy="100" r="2.2" fill="#181818" />
        <circle cx="100" cy="100" r="1" fill="#050505" />
      </svg>
    </motion.div>
  );
}
