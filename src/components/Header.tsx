'use client';
import { motion } from 'framer-motion';

interface Props {
  authStatus: 'idle' | 'loading' | 'ok' | 'err';
  profile?: { name: string; image?: string };
}

export default function Header({ authStatus, profile }: Props) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: 'rgba(14,8,4,0.85)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #9C5F28, #3D1A08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 0 16px rgba(200,118,44,0.35)',
          }}
        >
          💿
        </div>
        <div>
          <div
            style={{
              color: 'white',
              fontSize: 15,
              fontWeight: 'bold',
              letterSpacing: 2,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            BETTER WRAPPED
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 9,
              letterSpacing: 4,
              fontFamily: 'monospace',
            }}
          >
            VINYL EDITION
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {profile?.image && (
          <img
            src={profile.image}
            alt={profile.name}
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        )}
        {profile?.name && (
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'Georgia, serif' }}>
            {profile.name}
          </span>
        )}

        {authStatus === 'ok' ? (
          <a
            href="/api/auth/logout"
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace',
              letterSpacing: 1,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '4px 12px',
            }}
          >
            LOGOUT
          </a>
        ) : (
          <motion.a
            href="/api/auth/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 20,
              background: '#1DB954',
              color: 'white',
              fontSize: 12,
              fontFamily: 'sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: 0.5,
              textDecoration: 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Connect Spotify
          </motion.a>
        )}
      </div>
    </header>
  );
}
