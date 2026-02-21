// pages/api/dj.ts  (Pages Router)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    // Call ElevenLabs TTS API
    const ttsRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.7, similarity_boost: 0.8 },
      }),
    });

    const arrayBuffer = await ttsRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate DJ audio' });
  }
}