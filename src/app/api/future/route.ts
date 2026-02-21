import { NextRequest, NextResponse } from 'next/server';

type FuturePayload = {
  profileName: string | null;
  mood: {
    valence?: number;
    energy?: number;
    danceability?: number;
    acousticness?: number;
    variety?: number;
    avgPop?: number;
  } | null;
  drift: {
    tempoDrift?: number;
    valenceDrift?: number;
    danceabilityDrift?: number;
    energyDrift?: number;
  } | null;
  genres: string[];
  topArtists: string[];
  topTracks: { name: string; artist?: string }[];
};

type LlmPrediction = { icon: string; text: string; confidence: number };
type LlmRecommendation = { icon: string; song: string; artist: string };

type LlmResponse = {
  summary: string;
  predictions: LlmPrediction[];
  recommendations: LlmRecommendation[];
};

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0.05, Math.min(0.95, value));
}

function coerceResponse(value: any): LlmResponse | null {
  if (!value || typeof value !== 'object') return null;
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const predictions = Array.isArray(value.predictions) ? value.predictions : [];
  const recommendations = Array.isArray(value.recommendations) ? value.recommendations : [];
  
  const cleanedPredictions = predictions
    .map((p: any) => ({
      icon: typeof p.icon === 'string' && p.icon.trim() ? p.icon.trim() : '✨',
      text: typeof p.text === 'string' ? p.text.trim() : '',
      confidence: clampConfidence(Number(p.confidence ?? 0.6)),
    }))
    .filter((p: any) => p.text.length > 0)
    .slice(0, 4);

  const cleanedRecommendations = recommendations
    .map((r: any) => ({
      icon: typeof r.icon === 'string' && r.icon.trim() ? r.icon.trim() : '🎵',
      song: typeof r.song === 'string' ? r.song.trim() : '',
      artist: typeof r.artist === 'string' ? r.artist.trim() : '',
    }))
    .filter((r: any) => r.song.length > 0 && r.artist.length > 0)
    .slice(0, 5);

  if (!summary && cleanedPredictions.length === 0 && cleanedRecommendations.length === 0) return null;
  return { 
    summary, 
    predictions: cleanedPredictions, 
    recommendations: cleanedRecommendations 
  };
}

function extractJson(content: string) {
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  const slice = content.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}



export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[Future API] GROQ_API_KEY not set');
    return NextResponse.json({ error: 'api_key_missing' }, { status: 500 });
  }

  let payload: FuturePayload;
  try {
    payload = await request.json();
  } catch (err) {
    console.error('[Future API] Failed to parse request:', err);
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const system =
    'You are a music analyst predicting a listener\'s next-year taste. ' +
    'Return only valid JSON with keys: summary (string), predictions (array of 3-4 insight objects), and recommendations (array of 3-5 song/artist recommendations). ' +
    'Each prediction must include icon (single emoji), text (1 sentence), confidence (0 to 1). ' +
    'Each recommendation must include icon (single emoji), song (string), artist (string). ' +
    'Base recommendations on their current top artists/genres and taste drift. ' +
    'No markdown, no extra text.';

  const user = {
    profileName: payload.profileName,
    mood: payload.mood,
    drift: payload.drift,
    genres: payload.genres,
    topArtists: payload.topArtists,
    topTracks: payload.topTracks,
  };

  const model = process.env.GROQ_MODEL ?? 'mixtral-8x7b-32768';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: system,
          },
          {
            role: 'user',
            content: `USER_DATA:\n${JSON.stringify(user)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Future API] Groq API error:', response.status, errorText);
      return NextResponse.json({
        error: 'groq_failed',
        status: response.status,
        detail: errorText,
      }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const parsed = coerceResponse(extractJson(String(content)) ?? null);

    if (!parsed) {
      console.warn('[Future API] No valid response from Groq');
      return NextResponse.json({ enabled: true, summary: '', predictions: [], recommendations: [] });
    }

    return NextResponse.json({ enabled: true, ...parsed });
  } catch (err) {
    console.error('[Future API] Request failed:', err);
    return NextResponse.json({
      error: 'request_failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
