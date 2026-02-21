// 'use client';
// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';

// interface Props { data: any }

// export default function DiscoveryPage({ data }: Props) {
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   // ElevenLabs / DJ states
//   const [djPrompt, setDjPrompt] = useState('');
//   const [djAudioUrl, setDjAudioUrl] = useState<string | null>(null);
//   const [talkLoading, setTalkLoading] = useState(false);
//   const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

//   const topTracks = data?.topTracks || [];
//   const defaultRecs = [
//     { name: 'Hot Chip', type: 'artist' }, { name: 'Four Tet', type: 'artist' },
//     { name: 'Caribou', type: 'artist' }, { name: 'Nicolas Jaar', type: 'artist' },
//     { name: 'Floating Points', type: 'artist' }, { name: 'Jon Hopkins', type: 'artist' },
//     { name: 'Burial', type: 'artist' }, { name: 'Objekt', type: 'artist' },
//   ];

//   // --- Search functions ---
//   const handleSearch = async () => {
//     if (!query.trim()) return;
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
//       if (res.ok) {
//         const d = await res.json();
//         setResults(d.tracks?.items || []);
//       }
//     } catch {
//       setResults([]);
//     }
//     setLoading(false);
//   };

//   // --- Speech recognition setup ---
//   useEffect(() => {
//     const SpeechRecognition =
//       (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

//     if (SpeechRecognition) {
//       const recog = new SpeechRecognition();
//       recog.continuous = false;
//       recog.interimResults = false;
//       recog.lang = 'en-US';

//       recog.onresult = (event: SpeechRecognitionEvent) => {
//         const transcript = event.results[0][0].transcript;
//         setDjPrompt(transcript);
//         talkToDJ(transcript); // automatically send transcript to DJ
//       };

//       recog.onerror = (event: any) => {
//         console.error('Speech recognition error', event);
//         setTalkLoading(false);
//       };

//       recog.onend = () => {
//         setTalkLoading(false); // stop loading when recognition ends
//       };

//       setRecognition(recog);
//     } else {
//       console.warn('SpeechRecognition not supported in this browser');
//     }
//   }, []);

//   // --- Talk to DJ ---
//   const talkToDJ = async (message?: string) => {
//     const prompt = message || djPrompt;
//     if (!prompt.trim()) return;

//     setTalkLoading(true);
//     setDjAudioUrl(null);

//     try {
//       const res = await fetch('/api/dj', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text: prompt }),
//       });

//       if (!res.ok) throw new Error('Failed to talk to DJ');

//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);
//       setDjAudioUrl(url);

//       const audio = new Audio(url);
//       audio.play();
//     } catch (err) {
//       console.error(err);
//       alert('Failed to talk to DJ');
//       setTalkLoading(false);
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = 'en-US';
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onresult = (event: any) => {
//       const transcript = event.results[0][0].transcript; // <-- type 'any' solves TS error
//       console.log('You said:', transcript);
//       setDjMessage(transcript);
//       sendMessageToDJ(transcript);
//     };

// recognition.onerror = (event: any) => {
//   console.error('Speech recognition error', event.error);
//   alert('Failed to record your voice: ' + event.error);
// };

// recognition.start();

//   };

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//       {/* Search */}
//       <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
//         <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>SEARCH CATALOG</div>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//             placeholder="Search tracks, artists, albums..."
//             style={{
//               flex: 1,
//               background: 'rgba(255,255,255,0.04)',
//               border: '1px solid rgba(255,255,255,0.1)',
//               borderRadius: 10,
//               padding: '10px 14px',
//               color: 'white',
//               fontSize: 12,
//               outline: 'none',
//               fontFamily: 'Georgia, serif',
//             }}
//           />
//           <button
//             onClick={handleSearch}
//             style={{
//               padding: '0 16px', borderRadius: 10, border: 'none',
//               background: 'rgba(46,74,172,0.5)', color: 'white',
//               fontSize: 13, cursor: 'pointer',
//             }}
//           >
//             🔍
//           </button>
//         </div>
//         {loading && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: 'monospace' }}>Searching…</div>}
//         {results.length > 0 && (
//           <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
//             {results.slice(0, 5).map((r: any) => (
//               <a
//                 key={r.id}
//                 href={r.external_urls?.spotify || '#'}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   display: 'flex', alignItems: 'center', gap: 10,
//                   padding: '8px 10px', borderRadius: 8,
//                   background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
//                   textDecoration: 'none',
//                 }}
//               >
//                 {r.album?.images?.[2] && <img src={r.album.images[2].url} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
//                 <div>
//                   <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif' }}>{r.name}</div>
//                   <a
//                     href={r.artists?.[0]?.external_urls?.spotify || `https://open.spotify.com/search/artist%3A${encodeURIComponent(r.artists?.[0]?.name || '')}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     onClick={(e) => e.stopPropagation()}
//                     style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer' }}
//                     onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
//                     onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
//                   >
//                     {r.artists?.[0]?.name}
//                   </a>
//                 </div>
//                 {r.preview_url && (
//                   <button
//                     onClick={(e) => { e.preventDefault(); new Audio(r.preview_url).play(); }}
//                     style={{ marginLeft: 'auto', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
//                   >▶️</button>
//                 )}
//               </a>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Your Top Tracks */}
//       {topTracks.length > 0 && (
//         <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
//           <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>YOUR TOP TRACKS</div>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//             {topTracks.slice(0, 5).map((t: any, i: number) => (
//               <motion.div key={t.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
//                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
//                 <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 16 }}>{i + 1}</span>
//                 {t.image && <img src={t.image} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
//                 <div style={{ flex: 1, minWidth: 0 }}>
//                   <div style={{ fontSize: 12, color: 'white', fontFamily: 'Georgia, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
//                   <a href={t.artistUrl || `https://open.spotify.com/search/artist%3A${encodeURIComponent(t.artist || '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{t.artist}</a>
//                 </div>
//                 <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1DB954', textDecoration: 'none' }}>↗</a>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Recommendations */}
//       <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
//         <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>RECOMMENDED · BASED ON YOUR DNA</div>
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
//           {defaultRecs.map((r, i) => (
//             <a key={r.name} href={`https://open.spotify.com/search/artist%3A${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
//               <motion.div
//                 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
//                 style={{
//                   display: 'flex', alignItems: 'center', gap: 8,
//                   padding: '8px 10px', borderRadius: 10,
//                   background: 'rgba(255,255,255,0.03)',
//                   border: '1px solid rgba(46,74,172,0.18)',
//                   cursor: 'pointer',
//                 }}
//                 whileHover={{ borderColor: 'rgba(46,74,172,0.4)', background: 'rgba(46,74,172,0.06)' }}
//               >
//                 <div style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: `hsl(${i * 40 + 200}, 50%, 20%)` }}>🎵</div>
//                 <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif' }}>{r.name}</span>
//               </motion.div>
//             </a>
//           ))}
//         </div>
//       </div>

//       {/* DJ Talk Section */}
//       <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
//         <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>TALK TO YOUR DJ</div>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <button
//             onClick={() => {
//               if (recognition) {
//                 setTalkLoading(true);
//                 recognition.start();
//               }
//             }}
//             disabled={talkLoading}
//             style={{
//               padding: '0 16px', borderRadius: 10, border: 'none',
//               background: 'rgba(46,74,172,0.5)', color: 'white',
//               fontSize: 13, cursor: 'pointer',
//             }}
//           >
//             {talkLoading ? '🎧 Listening...' : '🎤 Talk'}
//           </button>
//           {djAudioUrl && <audio controls src={djAudioUrl} style={{ marginLeft: 10, flex: 1 }} autoPlay />}
//         </div>
//       </div>
//     </div>
//   );
// }



//---------------------------------------

'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props { data: any }

export default function DiscoveryPage({ data }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // DJ / ElevenLabs
  const [djPrompt, setDjPrompt] = useState('');
  const [djAudioUrl, setDjAudioUrl] = useState<string | null>(null);
  const [talkLoading, setTalkLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const topTracks = data?.topTracks || [];
  const defaultRecs = [
    { name: 'Hot Chip', type: 'artist' }, { name: 'Four Tet', type: 'artist' },
    { name: 'Caribou', type: 'artist' }, { name: 'Nicolas Jaar', type: 'artist' },
    { name: 'Floating Points', type: 'artist' }, { name: 'Jon Hopkins', type: 'artist' },
    { name: 'Burial', type: 'artist' }, { name: 'Objekt', type: 'artist' },
  ];

  // --- Search ---
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const d = await res.json();
        setResults(d.tracks?.items || []);
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  // --- Speech recognition setup ---
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDjPrompt(transcript);
      talkToDJ(transcript); // automatically send transcript to DJ
    };

    recog.onerror = (event: any) => {
      console.error('Speech recognition error', event.error || event);
      alert('Voice recognition failed: ' + (event.error || 'unknown'));
      setTalkLoading(false);
    };

    recog.onend = () => setTalkLoading(false);

    setRecognition(recog);
  }, []);

  // --- Talk to DJ ---
  const talkToDJ = async (message?: string) => {
    const prompt = message || djPrompt;
    if (!prompt.trim()) return;

    setTalkLoading(true);
    setDjAudioUrl(null);

    try {
      const res = await fetch('/api/dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });

      if (!res.ok) throw new Error('Failed to talk to DJ');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDjAudioUrl(url);

      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error(err);
      alert('Failed to talk to DJ');
      setTalkLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            onClick={handleSearch}
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
                {r.album?.images?.[2] && <img src={r.album.images[2].url} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
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

      {/* <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>TALK TO YOUR DJ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              if (recognition) {
                setTalkLoading(true);
                setDjPrompt('');
                recognition.start();
              }
            }}
            disabled={talkLoading}
            style={{
              padding: '0 16px', borderRadius: 10, border: 'none',
              background: 'rgba(46,74,172,0.5)', color: 'white',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            {talkLoading ? '🎧 Listening...' : '🎤 Talk'}
          </button>

          <button
            onClick={() => {
              if (recognition) {
                recognition.stop(); // stop recording
                setTalkLoading(false); // stop the button loading
                if (djPrompt.trim()) {
                  talkToDJ(djPrompt); // send transcript to DJ
                }
              }
            }}
            disabled={!talkLoading} // only enabled while talking
            style={{
              padding: '0 16px', borderRadius: 10, border: 'none',
              background: 'rgba(200,50,50,0.7)', color: 'white',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            ✋ Stop
          </button>

          {djAudioUrl && <audio controls src={djAudioUrl} style={{ marginLeft: 10, flex: 1 }} autoPlay />}
        </div>
      </div> */}

    <div style={{ 
        background: 'rgba(255,255,255,0.025)', 
        border: '1px solid rgba(255,255,255,0.07)', 
        borderRadius: 14, 
        padding: 16,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 12
      }}
      
>
  <div style={{ 
      fontSize: 9, 
      color: 'rgba(255,255,255,0.3)', 
      letterSpacing: 3, 
      fontFamily: 'monospace', 
      marginBottom: 8 
    }}
  >
  </div>
  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>TALK TO DJ</div>
  <div style={{ display: 'flex', gap: 12 }}>
    <button
      onClick={() => {
        if (recognition) {
          setTalkLoading(true);
          setDjPrompt('');
          recognition.start();
        }
      }}
      disabled={talkLoading}
      style={{
        padding: '0 16px', borderRadius: 10, border: 'none',
        background: 'rgba(46,74,172,0.5)', color: 'white',
        fontSize: 13, cursor: 'pointer',
      }}
    >
      {talkLoading ? '🎧 Listening...' : '🎤 Talk'}
    </button>

    <button
      onClick={() => {
        if (recognition) {
          recognition.stop();
          setTalkLoading(false);
          if (djPrompt.trim()) {
            talkToDJ(djPrompt);
          }
        }
      }}
      disabled={!talkLoading}
      style={{
        padding: '0 16px', borderRadius: 10, border: 'none',
        background: 'rgba(200,50,50,0.7)', color: 'white',
        fontSize: 13, cursor: 'pointer',
      }}
    >
      ✋ Stop
    </button>
  </div>

  {djAudioUrl && <audio controls src={djAudioUrl} style={{ marginTop: 12, width: '100%' }} autoPlay />}
</div>

    </div>
  );
}
