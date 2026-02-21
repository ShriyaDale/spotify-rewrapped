'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { data: any }

export default function DiscoveryPage({ data }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [djListening, setDjListening] = useState(false);
  const [djMessage, setDjMessage] = useState('Hype DJ ready — say: play 1, search for Drake, next, previous, pause, resume');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const topTracks = data?.topTracks || [];
  const defaultRecs = [
    { name: 'Hot Chip', type: 'artist' }, { name: 'Four Tet', type: 'artist' },
    { name: 'Caribou', type: 'artist' }, { name: 'Nicolas Jaar', type: 'artist' },
    { name: 'Floating Points', type: 'artist' }, { name: 'Jon Hopkins', type: 'artist' },
    { name: 'Burial', type: 'artist' }, { name: 'Objekt', type: 'artist' },
  ];

  const hasSpeechRecognition = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const playableTopTracks = useMemo(
    () => topTracks.slice(0, 10).map((t: any) => ({
      ...t,
      preview: t?.preview ?? null,
      spotifyUrl: t?.spotifyUrl ?? null,
      artist: t?.artist ?? 'Unknown Artist',
      name: t?.name ?? 'Unknown Track',
    })),
    [topTracks]
  );

  const pickNaturalVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices?.length) return null;

    const preferredNames = [
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Samantha',
    ];

    for (const name of preferredNames) {
      const voice = voices.find((v) => v.name === name);
      if (voice) return voice;
    }

    return voices.find((v) => /en-US|en_US|en-GB/i.test(v.lang)) ?? voices[0];
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickNaturalVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = 1.02;
    utterance.pitch = 1.12;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const getPermissionState = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    if (typeof window === 'undefined' || !navigator?.permissions?.query) return 'unknown';
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const playTrackByIndex = (index: number) => {
    if (playableTopTracks.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, playableTopTracks.length - 1));
    const track = playableTopTracks[safeIndex];
    setCurrentTrackIndex(safeIndex);

    if (track.preview) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = track.preview;
      audioRef.current.play().catch(() => {
        setDjMessage('Playback was blocked by browser. Click a play button first.');
      });
      const msg = `Yo! Now spinning ${track.name} by ${track.artist}. Let's go!`;
      setDjMessage(msg);
      speak(msg);
      return;
    }

    if (track.spotifyUrl) {
      const msg = `playing ${track.name}, opening Spotify right now.`;
      setDjMessage(msg);
      speak(msg);
      window.open(track.spotifyUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setDjMessage(`No playable source found for ${track.name}.`);
  };

  const pausePlayback = () => {
    if (audioRef.current) audioRef.current.pause();
    setDjMessage('Paused — hit me with resume when you are ready.');
    speak('Track paused. Say resume when you are ready.');
  };

  const resumePlayback = () => {
    if (audioRef.current?.src) {
      audioRef.current.play().catch(() => {
        setDjMessage('Could not resume. Try play command again.');
      });
      setDjMessage('Back in action — resumed!');
      speak('We are back. Playback resumed.');
      return;
    }
    playTrackByIndex(currentTrackIndex);
  };

  const executeVoiceCommand = (raw: string) => {
    const command = raw.toLowerCase().trim();
    if (!command) return;

    const searchMatch = command.match(/^(search for|search|find|look up)\s+(.+)$/i);
    if (searchMatch?.[2]) {
      const searchTerm = searchMatch[2].trim();
      if (searchTerm) {
        setQuery(searchTerm);
        handleSearch(searchTerm);
        const msg = `Searching Spotify for ${searchTerm}.`;
        setDjMessage(msg);
        speak(msg);
        return;
      }
    }

    if (command.includes('next')) {
      playTrackByIndex(currentTrackIndex + 1);
      return;
    }

    if (command.includes('previous') || command.includes('back')) {
      playTrackByIndex(currentTrackIndex - 1);
      return;
    }

    if (command.includes('pause') || command.includes('stop')) {
      pausePlayback();
      return;
    }

    if (command.includes('resume') || command.includes('continue')) {
      resumePlayback();
      return;
    }

    const numberMatch = command.match(/play\s+(number\s+)?(\d+)/);
    if (numberMatch) {
      const idx = Number(numberMatch[2]) - 1;
      playTrackByIndex(idx);
      return;
    }

    if (command.startsWith('play ')) {
      const queryName = command.replace('play ', '').trim();
      const matchIndex = playableTopTracks.findIndex((t: any) => t.name.toLowerCase().includes(queryName));
      if (matchIndex >= 0) {
        playTrackByIndex(matchIndex);
        return;
      }
      setDjMessage(`I couldn't find "${queryName}" in your top tracks — try another one.`);
      speak(`I could not find ${queryName}. Try another track from your top list.`);
      return;
    }

    if (command.includes('what') && command.includes('playing')) {
      const current = playableTopTracks[currentTrackIndex];
      if (current) {
        const msg = `Currently queued: ${current.name} by ${current.artist}`;
        setDjMessage(msg);
        speak(msg);
      }
      return;
    }

    setDjMessage('I did not catch that. Say: search for Drake, play 1, next, previous, pause, or resume.');
  };

  const toggleDjListening = () => {
    if (!hasSpeechRecognition) {
      setDjMessage('Voice DJ needs Chrome/Edge/Safari with Web Speech support.');
      return;
    }

    if (djListening) {
      recognitionRef.current?.stop?.();
      setDjListening(false);
      return;
    }

    const startListening = async () => {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setDjMessage('Mic needs HTTPS (or localhost). Open this app on a secure URL to use voice DJ.');
        return;
      }

      const permissionState = await getPermissionState();
      if (permissionState === 'denied') {
        setDjMessage('Microphone permission is blocked. Enable mic access in site settings, then reload.');
        return;
      }

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setDjMessage('Speech engine unavailable in this browser. Try Chrome or Edge.');
        return;
      }
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setDjListening(true);
        setDjMessage('Mic is live. Say: search for <artist>, play 1, next, previous, pause, or resume.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[event.results.length - 1]?.[0]?.transcript ?? '';
        setVoiceTranscript(transcript);
        executeVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        const errorCode = event?.error;
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          setDjMessage('Mic access denied. Enable microphone permission in browser settings and reload.');
        } else if (errorCode === 'audio-capture') {
          setDjMessage('No microphone detected. Connect a mic and try again.');
        } else if (errorCode === 'network') {
          setDjMessage('Voice service network issue. Check internet and retry.');
        } else {
          setDjMessage('Voice command error. Check microphone permissions and try again.');
        }
        setDjListening(false);
      };

      recognition.onend = () => {
        setDjListening(false);
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
        speak('Yo! Hype DJ is live. Tell me what to spin.');
      } catch {
        setDjListening(false);
        setDjMessage('Could not start voice capture. Check mic permission and close other tabs using the mic.');
      }
    };

    startListening();
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const warmVoices = () => {
        window.speechSynthesis.getVoices();
      };
      warmVoices();
      window.speechSynthesis.onvoiceschanged = warmVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop?.();
      stopAudio();
    };
  }, []);

  const handleSearch = async (customQuery?: string) => {
    const searchTerm = (customQuery ?? query).trim();
    if (!searchTerm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const d = await res.json();
        setResults(d.tracks?.items || []);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Voice DJ */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(29,185,84,0.25)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>DISCOVERY DJ MODE</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={toggleDjListening}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(29,185,84,0.55)',
              background: djListening ? 'rgba(29,185,84,0.25)' : 'rgba(29,185,84,0.12)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: 1.2,
              fontFamily: 'monospace',
            }}
          >
            {djListening ? '🎙 STOP LISTENING' : '🎙 START VOICE DJ'}
          </button>
          <button
            onClick={() => playTrackByIndex(currentTrackIndex + 1)}
            style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: 11 }}
          >
            NEXT
          </button>
          <button
            onClick={pausePlayback}
            style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: 11 }}
          >
            PAUSE
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif' }}>
          {djMessage}
        </div>
        {voiceTranscript && (
          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            Heard: "{voiceTranscript}"
          </div>
        )}
        {!hasSpeechRecognition && (
          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,120,120,0.8)', fontFamily: 'monospace' }}>
            Your browser does not support Web Speech API. Use the play buttons below.
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>SEARCH CATALOG</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search tracks, artists, albums..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              color: 'white',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'Georgia, serif',
            }}
          />
          <button
            onClick={() => handleSearch()}
            style={{
              padding: '0 16px', borderRadius: 10, border: 'none',
              background: 'rgba(46,74,172,0.5)', color: 'white',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            🔍
          </button>
        </div>
        {loading && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: 'monospace' }}>Searching…</div>}
        {results.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.slice(0, 5).map((r: any) => (
              <a
                key={r.id}
                href={r.external_urls?.spotify || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                }}
              >
                {r.album?.images?.[2] && (
                  <img src={r.album.images[2].url} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />
                )}
                <div>
                  <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif' }}>{r.name}</div>
                  <a
                    href={r.artists?.[0]?.external_urls?.spotify || `https://open.spotify.com/search/artist%3A${encodeURIComponent(r.artists?.[0]?.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                  >
                    {r.artists?.[0]?.name}
                  </a>
                </div>
                {r.preview_url && (
                  <button
                    onClick={(e) => { e.preventDefault(); new Audio(r.preview_url).play(); }}
                    style={{ marginLeft: 'auto', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                  >▶️</button>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Your Top Tracks */}
      {topTracks.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>YOUR TOP TRACKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topTracks.slice(0, 5).map((t: any, i: number) => (
              <motion.div key={t.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 16 }}>{i + 1}</span>
                {t.image && <img src={t.image} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <a href={t.artistUrl || `https://open.spotify.com/search/artist%3A${encodeURIComponent(t.artist || '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{t.artist}</a>
                </div>
                <button
                  onClick={() => playTrackByIndex(i)}
                  style={{ fontSize: 11, color: '#1DB954', background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.35)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}
                >
                  ▶
                </button>
                <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1DB954', textDecoration: 'none' }}>↗</a>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>RECOMMENDED · BASED ON YOUR DNA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {defaultRecs.map((r, i) => (
            <a key={r.name} href={`https://open.spotify.com/search/artist%3A${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(46,74,172,0.18)',
                  cursor: 'pointer',
                }}
                whileHover={{ borderColor: 'rgba(46,74,172,0.4)', background: 'rgba(46,74,172,0.06)' }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: `hsl(${i * 40 + 200}, 50%, 20%)` }}>🎵</div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif' }}>{r.name}</span>
              </motion.div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
