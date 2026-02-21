'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Record } from '@/app/page';
import Vinyl from './Vinyl';

interface Props {
  activeRecord: Record | null;
  isLanding: boolean;
  onDrop: (id: string) => void;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onEject: () => void;
}

function Tonearm({ engaged }: { engaged: boolean }) {
  return (
    <div style={{ position: 'absolute', top: 20, right: 52, zIndex: 10 }}>
      <motion.div
        animate={{ rotate: engaged ? 24 : 0 }}
        transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ transformOrigin: '15px 15px', position: 'relative', width: 170, height: 170 }}
      >
        {/* Pivot base */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 30, height: 30, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #e0e0e0, #606060)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.3)',
          zIndex: 5,
        }} />
        <div style={{
          position: 'absolute', top: 9, right: 9,
          width: 12, height: 12, borderRadius: '50%',
          background: '#999', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }} />
        {/* Main arm */}
        <div style={{
          position: 'absolute', top: 13, right: 28,
          width: 145, height: 7, borderRadius: 4,
          background: 'linear-gradient(to bottom, #eee 0%, #b0b0b0 50%, #d0d0d0 100%)',
          transform: 'rotate(-22deg)', transformOrigin: 'right center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.55)',
        }} />
        {/* Headshell */}
        <div style={{
          position: 'absolute', top: 0, left: 8,
          width: 30, height: 12, borderRadius: 4,
          background: 'linear-gradient(to bottom, #d8d8d8, #989898)',
          transform: 'rotate(-22deg)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.45)',
        }} />
        {/* Cantilever */}
        <div style={{
          position: 'absolute', top: 10, left: 19,
          width: 3, height: 18, borderRadius: 2,
          background: 'linear-gradient(to bottom, #bbb, #666)',
          transform: 'rotate(-22deg)',
        }} />
        {/* Stylus */}
        <div style={{
          position: 'absolute', top: 26, left: 18,
          width: 5, height: 5, borderRadius: '50%',
          background: '#222', border: '1px solid #666',
        }} />
      </motion.div>
    </div>
  );
}

export default function TurntableUnit({ activeRecord, isLanding, onDrop, isDragOver, onDragOver, onDragLeave, onEject }: Props) {
  const isSpinning = !!activeRecord && !isLanding;

  return (
    <div style={{ position: 'relative', width: 420, height: 440 }}>
      {/* Turntable body — lighter wood, amber border glow so it stands out */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 20,
        background: 'linear-gradient(145deg, #3A2010 0%, #261408 45%, #2E1A0C 100%)',
        border: '2px solid rgba(200,118,44,0.55)',
        boxShadow: [
          '0 0 0 1px rgba(200,118,44,0.2)',
          '0 0 40px rgba(200,118,44,0.18)',
          '0 0 0 10px #0d0b0b',
          '0 0 0 18px rgba(13,11,11,0.6)',
          '0 0 0 28px rgba(13,11,11,0.15)',
          '0 24px 80px rgba(0,0,0,0.85)',
          'inset 0 1px 0 rgba(255,255,255,0.06)',
        ].join(', '),
      }}>
        {/* Wood grain */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, opacity: 0.2,
          backgroundImage: 'repeating-linear-gradient(15deg, transparent 0, transparent 5px, rgba(0,0,0,0.22) 5px, rgba(0,0,0,0.22) 6px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, opacity: 0.08,
          backgroundImage: 'repeating-linear-gradient(75deg, transparent 0, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 9px)',
        }} />

        {/* Platter recess */}
        <div style={{
          position: 'absolute',
          width: 318, height: 318,
          top: '50%', left: '50%',
          transform: 'translate(-51%, -56%)',
          borderRadius: '50%',
          background: '#080808',
          boxShadow: 'inset 0 8px 32px rgba(0,0,0,0.95), 0 2px 0 rgba(255,255,255,0.03)',
          border: '6px solid #1a1008',
        }} />

        {/* Felt mat */}
        <div style={{
          position: 'absolute',
          width: 298, height: 298,
          top: '50%', left: '50%',
          transform: 'translate(-51%, -56%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #1e1e1e 0%, #131313 60%, #0a0a0a 100%)',
          border: '2px solid #2a2a2a',
        }} />

        {/* Drop zone */}
        <div
          style={{
            position: 'absolute',
            width: 290, height: 290,
            top: '50%', left: '50%',
            transform: 'translate(-51%, -56%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
          onDragLeave={onDragLeave}
          onDrop={(e) => { e.preventDefault(); onDragLeave(); const id = e.dataTransfer.getData('rid'); if (id) onDrop(id); }}
        >
          <AnimatePresence mode="wait">
            {!activeRecord ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: `3px dashed ${isDragOver ? 'rgba(200,118,44,0.6)' : 'rgba(255,255,255,0.12)'}`,
                  background: isDragOver ? 'rgba(200,118,44,0.07)' : 'transparent',
                  transition: 'all 0.3s', cursor: 'copy',
                }}
              >
                <div style={{ fontSize: 40, opacity: isDragOver ? 0.95 : 0.3, transition: 'opacity 0.3s' }}>💿</div>
                <div style={{
                  fontSize: 10, fontFamily: 'monospace', letterSpacing: 3, marginTop: 10, fontWeight: 700,
                  color: isDragOver ? 'rgba(200,118,44,0.95)' : 'rgba(255,255,255,0.35)',
                  transition: 'color 0.3s',
                }}>
                  {isDragOver ? 'RELEASE TO PLAY' : 'DROP RECORD'}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeRecord.id}
                initial={{ scale: 1.5, y: -120, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, y: 60, opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Vinyl record={activeRecord} size={278} spin={isSpinning} glow={isSpinning} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spindle */}
        <div style={{
          position: 'absolute',
          width: 12, height: 12, borderRadius: '50%',
          top: 'calc(50% - 10px)', left: 'calc(50% - 1px)',
          transform: 'translate(-51%, -56%) translate(-50%, -50%)',
          background: 'linear-gradient(to bottom, #d0d0d0, #787878)',
          boxShadow: '0 0 4px rgba(0,0,0,0.8)',
          zIndex: 20,
        }} />

        <Tonearm engaged={isSpinning} />

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 18, left: 20, display: 'flex', gap: 6 }}>
          {['⏮', isSpinning ? '⏸' : '▶︎', '⏭'].map((s) => (
            <div key={s} style={{
              fontSize: 10, color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 4, padding: '3px 8px',
              fontFamily: 'monospace',
            }}>{s}</div>
          ))}
        </div>

        {/* Power LED */}
        <div style={{ position: 'absolute', top: 18, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            style={{ width: 8, height: 8, borderRadius: '50%', background: isSpinning ? '#00ff88' : '#2a2a2a' }}
            animate={isSpinning ? { boxShadow: ['0 0 4px #00ff88', '0 0 12px #00ff88', '0 0 4px #00ff88'] } : { boxShadow: 'none' }}
            transition={isSpinning ? { repeat: Infinity, duration: 2 } : {}}
          />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>
            {isSpinning ? 'PLAYING' : isLanding ? 'LOADING' : 'STANDBY'}
          </span>
        </div>

        {/* Brand */}
        <div style={{ position: 'absolute', bottom: 18, right: 18, fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: 3 }}>
          RE·WRAPPED
        </div>
      </div>

      {/* Eject */}
      <AnimatePresence>
        {activeRecord && !isLanding && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={onEject}
            style={{
              position: 'absolute', bottom: -52, left: '50%', transform: 'translateX(-50%)',
              padding: '8px 26px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12, cursor: 'pointer', letterSpacing: 2, fontWeight: 700,
              fontFamily: 'monospace', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
          >⏏ EJECT</motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}