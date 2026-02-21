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

type LlmResponse = {
  summary: string;
  predictions: LlmPrediction[];
};

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0.05, Math.min(0.95, value));
}

function coerceResponse(value: any): LlmResponse | null {
  if (!value || typeof value !== 'object') return null;
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const predictions = Array.isArray(value.predictions) ? value.predictions : [];
  const cleaned = predictions
    .map((p: any) => ({
      icon: typeof p.icon === 'string' && p.icon.trim() ? p.icon.trim() : '✨',
      text: typeof p.text === 'string' ? p.text.trim() : '',
      confidence: clampConfidence(Number(p.confidence ?? 0.6)),
    }))
    .filter((p: any) => p.text.length > 0)
    .slice(0, 4);

  if (!summary && cleaned.length === 0) return null;
  return { summary, predictions: cleaned };
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ enabled: false });
  }

  let payload: FuturePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const system =
    'You are a music analyst predicting a listener\'s next-year taste. ' +
    'Return only valid JSON with keys: summary (string) and predictions (array of 3-4 items). ' +
    'Each prediction must include icon (single emoji), text (1 sentence), confidence (0 to 1). ' +
    'No markdown, no extra text.';

  const user = {
    profileName: payload.profileName,
    mood: payload.mood,
    drift: payload.drift,
    genres: payload.genres,
    topArtists: payload.topArtists,
    topTracks: payload.topTracks,
  };

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${system}\n\nUSER_DATA:\n${JSON.stringify(user)}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 350,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: 'gemini_failed', detail: errorText }, { status: 502 });
  }

  const data = await response.json();
  const content = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((part: any) => part?.text ?? '')
    .join('');
  const parsed = coerceResponse(extractJson(String(content)) ?? null);

  if (!parsed) {
    return NextResponse.json({ enabled: true, summary: '', predictions: [] });
  }

  return NextResponse.json({ enabled: true, ...parsed });
}
