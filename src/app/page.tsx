'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RecordShelf from '@/components/RecordShelf';
import TurntableUnit from '@/components/TurntableUnit';
import DashboardPanel from '@/components/DashboardPanel';
import Header from '@/components/Header';
import { RECORDS, type Record } from '@/lib/constants';

export default function Home() {
  const [activeRecord, setActiveRecord] = useState<Record | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isLanding, setIsLanding] = useState(false); // record landing on player
  const [spotifyData, setSpotifyData] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/data')
      .then((r) => {
        if (r.ok) { setAuthStatus('ok'); return r.json(); }
        throw new Error('not auth');
      })
      .then((d) => setSpotifyData(d))
      .catch(() => setAuthStatus('idle'));
  }, []);

  const handleRecordClick = (record: Record) => {
    placeRecord(record);
  };

  const handleRecordDrop = (id: string) => {
    const rec = RECORDS.find((r) => r.id === id);
    if (rec) placeRecord(rec);
  };

  const placeRecord = (record: Record) => {
    setShowPanel(false);
    setIsLanding(true);
    setActiveRecord(record);
    // after landing animation, show panel
    setTimeout(() => {
      setIsLanding(false);
      setTimeout(() => setShowPanel(true), 400);
    }, 1200);
  };

  const handleEject = () => {
    setShowPanel(false);
    setTimeout(() => setActiveRecord(null), 500);
  };

  const showPlayerArea = !showPanel;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header authStatus={authStatus} profile={spotifyData?.profile} />

      <main className="flex flex-col items-center pt-8 pb-20 gap-10 px-4">
        {/* Hero */}
        <motion.div
          className="text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(32px, 5vw, 56px)',
              color: 'white',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-1px',
              textShadow: '0 2px 40px rgba(200,118,44,0.3)',
            }}
          >
            Your Year in Vinyl
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginTop: 8, fontSize: 16 }}>
            Click a record to play it — or drag it onto the turntable
          </p>
        </motion.div>

        <AnimatePresence>
          {showPlayerArea && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                display: 'flex',
                gap: 36,
                alignItems: 'flex-start',
                width: '100%',
                maxWidth: 1200,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 300, maxWidth: 620, transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                <RecordShelf records={RECORDS} onRecordClick={handleRecordClick} activeId={activeRecord?.id} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56 }}>
                <TurntableUnit
                  activeRecord={activeRecord}
                  isLanding={isLanding}
                  onDrop={handleRecordDrop}
                  isDragOver={dragOver}
                  onDragOver={() => setDragOver(true)}
                  onDragLeave={() => setDragOver(false)}
                  onEject={handleEject}
                />

                {/* Now playing */}
                <AnimatePresence>
                  {activeRecord && !isLanding && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ textAlign: 'center', marginTop: -36 }}
                    >
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 4, fontFamily: 'monospace' }}>
                        NOW PLAYING
                      </div>
                      <div style={{ fontSize: 18, color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 'bold', marginTop: 4 }}>
                        {activeRecord.icon} {activeRecord.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 6 }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            style={{ width: 2, background: '#1DB954', borderRadius: 1 }}
                            animate={{ height: [3, 14, 3] }}
                            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.13, ease: 'easeInOut' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard panel */}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <button
                  onClick={handleEject}
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.5,
                    fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '7px 16px',
                    cursor: 'pointer',
                  }}
                >
                  ← BACK TO SHELF
                </button>
              </div>
              <DashboardPanel record={activeRecord} data={spotifyData} />
            </motion.div>
          ) : !activeRecord ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
                maxWidth: 920,
              }}
            >
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', maxWidth: 260 }}>
                <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.4 }}>🎵</div>
                <p style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
                  Select a record from your collection to see your listening analytics
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Auth note */}
        <AnimatePresence>
          {authStatus === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              style={{
                maxWidth: 480,
                textAlign: 'center',
                padding: '16px 24px',
                borderRadius: 14,
                border: '1px solid rgba(200,118,44,0.2)',
                background: 'rgba(200,118,44,0.05)',
              }}
            >
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.8, margin: 0, fontFamily: 'Georgia, serif' }}>
                Showing demo data. Connect Spotify for your real listening stats.
                <br />
                <span style={{ color: 'rgba(205,133,63,0.4)', fontSize: 10, fontFamily: 'monospace' }}>
                  See README.md for setup instructions.
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
