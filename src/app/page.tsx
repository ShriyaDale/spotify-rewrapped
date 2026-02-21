'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RecordShelf from '@/components/RecordShelf';
import TurntableUnit from '@/components/TurntableUnit';
import DashboardPanel from '@/components/DashboardPanel';
import Header from '@/components/Header';

export const RECORDS = [
  {
    id: 'dna',
    title: 'MY DNA',
    sub: 'Your Sonic Genome',
    icon: '🧬',
    color: '#7C3F18',
    accent: '#C8762C',
    label: '#F5DEB3',
    spineColor: '#5C2E10',
    rings: ['#5C2E10', '#7C3F18', '#9C5F28', '#BC7F48'],
  },
  {
    id: 'discovery',
    title: 'DISCOVERY',
    sub: 'Uncharted Grooves',
    icon: '🔭',
    color: '#0E1A5C',
    accent: '#2E4AAC',
    label: '#B0C4FF',
    spineColor: '#080E3A',
    rings: ['#080E3A', '#0E1A5C', '#1E2A7C', '#2E4AAC'],
  },
  {
    id: 'world',
    title: 'WORLD MAP',
    sub: 'Your Global Reach',
    icon: '🌍',
    color: '#063830',
    accent: '#0A7060',
    label: '#A0E8D8',
    spineColor: '#042820',
    rings: ['#042820', '#063830', '#0A5848', '#0A7060'],
  },
  {
    id: 'future',
    title: 'NEXT YEAR',
    sub: 'Your Musical Future',
    icon: '🔮',
    color: '#320860',
    accent: '#7030B0',
    label: '#D8B0F0',
    spineColor: '#200440',
    rings: ['#200440', '#320860', '#4A1490', '#7030B0'],
  },
  {
    id: 'concerts',
    title: 'CONCERT RADAR',
    sub: 'Live Near You',
    icon: '🎤',
    color: '#1A0A3C',
    accent: '#8B5CF6',
    label: '#DDD6FE',
    spineColor: '#0E0520',
    rings: ['#0E0520', '#1A0A3C', '#2D1260', '#8B5CF6'],
  },
];

export type Record = typeof RECORDS[0];

const PLAYER_HEIGHT = 560;
// CDs sit higher — near top third of turntable body
const CAROUSEL_TOP = 130;

export default function Home() {
  const [activeRecord, setActiveRecord] = useState<Record | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isLanding, setIsLanding] = useState(false);
  const [spotifyData, setSpotifyData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  useEffect(() => {
    fetch('/api/data')
      .then((r) => { if (r.ok) { setAuthStatus('ok'); return r.json(); } throw new Error('not auth'); })
      .then((d) => setSpotifyData(d))
      .catch(() => setAuthStatus('idle'));
  }, []);

  const placeRecord = (record: Record) => {
    setShowPanel(false);
    setIsLanding(true);
    setActiveRecord(record);
    setTimeout(() => {
      setIsLanding(false);
      setTimeout(() => setShowPanel(true), 400);
    }, 1200);
  };

  const handleEject = () => {
    setShowPanel(false);
    setTimeout(() => setActiveRecord(null), 500);
  };

  const handleNavSelect = (id: string | null) => {
    if (!id) { handleEject(); return; }
    const rec = RECORDS.find(r => r.id === id);
    if (!rec) return;
    setActiveRecord(rec);
    setIsLanding(false);
    setShowPanel(true);
  };

  const showPlayerArea = !showPanel;
  const navActiveId = showPanel ? (activeRecord?.id ?? null) : null;

  return (
    <div className="min-h-screen" style={{ background: '#0d0b0b' }}>
      <Header authStatus={authStatus} profile={spotifyData?.profile} />

      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 40, paddingBottom: 100,
        paddingLeft: 16, paddingRight: 16,
        gap: 0,
      }}>

        {/* ── Hero ── */}
        <motion.div
          style={{ textAlign: 'center', marginBottom: 28 }}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(40px, 5.5vw, 64px)',
            color: '#ffffff',
            fontWeight: 900, margin: 0,
            letterSpacing: '-1px',
            textShadow: '0 2px 40px rgba(200,118,44,0.5)',
          }}>
            your music,{' '}
            <span style={{ color: '#E8923A', fontStyle: 'italic' }}>but rewrapped</span>
          </h1>

        </motion.div>

        {/* ── Nav pills — above turntable ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: 50 }}
        >
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 999, padding: '7px 12px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            <motion.button
              onClick={() => handleNavSelect(null)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 18px', borderRadius: 999,
                border: `1.5px solid ${!showPanel ? 'rgba(232,146,58,0.9)' : 'transparent'}`,
                background: !showPanel ? 'rgba(232,146,58,0.18)' : 'transparent',
                color: !showPanel ? '#E8923A' : '#ffffff',
                cursor: 'pointer', fontSize: 12, letterSpacing: 2,
                fontFamily: 'monospace', fontWeight: 700, transition: 'all 0.15s',
              }}
            >SHELF</motion.button>

            {RECORDS.map(rec => {
              const isActive = navActiveId === rec.id;
              return (
                <motion.button
                  key={rec.id}
                  onClick={() => handleNavSelect(rec.id)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    border: `1.5px solid ${isActive ? rec.accent : 'transparent'}`,
                    background: isActive ? `${rec.color}40` : 'transparent',
                    color: isActive ? rec.accent : '#ffffff',
                    cursor: 'pointer', fontSize: 12, letterSpacing: 2,
                    fontFamily: 'monospace', fontWeight: 700, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{rec.icon}</span>
                  {rec.title}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Player zone ── */}
        <AnimatePresence>
          {showPlayerArea && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'relative',
                width: '100%',
                height: PLAYER_HEIGHT,
                marginBottom: 16,
              }}
            >
              {/* z-index 1 — Carousel, pinned to exact vertical position */}
              <div style={{
                position: 'absolute',
                top: CAROUSEL_TOP,
                left: 0,
                right: 0,
                zIndex: 1,
              }}>
                <RecordShelf
                  records={RECORDS}
                  onRecordClick={placeRecord}
                  activeId={activeRecord?.id}
                />
              </div>

              {/* z-index 2 — Turntable on top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <TurntableUnit
                  activeRecord={activeRecord}
                  isLanding={isLanding}
                  onDrop={(id) => { const rec = RECORDS.find(r => r.id === id); if (rec) placeRecord(rec); }}
                  isDragOver={dragOver}
                  onDragOver={() => setDragOver(true)}
                  onDragLeave={() => setDragOver(false)}
                  onEject={handleEject}
                />

                {/* Now playing */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="wait">
                    {activeRecord && !isLanding ? (
                      <motion.div key={activeRecord.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, color: '#ffffff', fontFamily: "'Playfair Display', serif", fontWeight: 'bold', marginBottom: 4 }}>
                          {activeRecord.icon} {activeRecord.title}
                        </div>
                        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                          {activeRecord.sub}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 7 }}>
                          {[0, 1, 2, 3, 4].map(i => (
                            <motion.div key={i} style={{ width: 2.5, background: '#1DB954', borderRadius: 2 }}
                              animate={{ height: [3, 16, 3] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.13, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : !activeRecord ? (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p style={{ color: 'rgb(252, 252, 252)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, margin: 0 }}>
                          Click or drag a record on to the turntable to play
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dashboard panel ── */}
        <AnimatePresence mode="wait">
          {showPanel && activeRecord ? (
            <motion.div
              key={activeRecord.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ width: '100%', maxWidth: 920 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <button
                  onClick={handleEject}
                  style={{
                    fontSize: 13, letterSpacing: 2, fontFamily: 'monospace', fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 999, padding: '9px 24px',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                >← BACK TO SHELF</button>
              </div>
              <DashboardPanel record={activeRecord} data={spotifyData} />
            </motion.div>
          ) : !activeRecord && !showPanel ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ textAlign: 'center', maxWidth: 280 }}
            >
              <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.35 }}>🎵</div>
            
            </motion.div>
          ) : null}
        </AnimatePresence>

      </main>
    </div>
  );
}