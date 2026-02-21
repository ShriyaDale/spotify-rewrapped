// lib/analytics.ts

export function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function bucketTempo(bpm: number): string {
  if (bpm < 70) return 'Slow';
  if (bpm < 100) return 'Moderate';
  if (bpm < 130) return 'Upbeat';
  if (bpm < 160) return 'Fast';
  return 'Very Fast';
}

export function computeGenreMix(topArtists: any[]): { name: string; pct: number }[] {
  const counts: Record<string, number> = {};
  topArtists.forEach((a) => {
    (a.genres || []).forEach((g: string) => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }));
}

export function computeAudioAverages(features: any[]) {
  const valid = features.filter(Boolean);
  if (!valid.length) return { valence: 0.5, energy: 0.5, danceability: 0.5, acousticness: 0.3, tempo: 120, speechiness: 0.1 };
  const sum = (key: string) => valid.reduce((s, f) => s + (f[key] || 0), 0) / valid.length;
  return {
    valence: sum('valence'),
    energy: sum('energy'),
    danceability: sum('danceability'),
    acousticness: sum('acousticness'),
    tempo: sum('tempo'),
    speechiness: sum('speechiness'),
  };
}

export function computeDNAIndices(averages: ReturnType<typeof computeAudioAverages>) {
  return {
    groove: averages.danceability,
    brightness: averages.valence,
    heat: averages.energy,
    pace: normalize(averages.tempo, 60, 180),
  };
}

export function computeIntensity(artistName: string, topArtistRank: number, recentlyPlayed: any[]): number {
  const total = recentlyPlayed.length || 1;
  const appearances = recentlyPlayed.filter((item) =>
    item.track?.artists?.some((a: any) => a.name === artistName)
  ).length;
  const rankScore = 1 - normalize(topArtistRank - 1, 0, 19);
  const recentScore = appearances / total;
  return Math.min(1, 0.5 * rankScore + 0.5 * recentScore);
}

export function computeDrift(shortStats: any, longStats: any) {
  return {
    tempoDrift: (shortStats.tempo || 120) - (longStats.tempo || 120),
    valenceDrift: (shortStats.valence || 0.5) - (longStats.valence || 0.5),
    danceabilityDrift: (shortStats.danceability || 0.5) - (longStats.danceability || 0.5),
    energyDrift: (shortStats.energy || 0.5) - (longStats.energy || 0.5),
  };
}

export function buildCountryAvailability(topTracks: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  topTracks.forEach((track) => {
    (track.available_markets || []).forEach((code: string) => {
      counts[code] = (counts[code] || 0) + 1;
    });
  });
  return counts;
}

export function generatePredictions(drift: ReturnType<typeof computeDrift>, shortGenres: string[], longGenres: string[]) {
  const preds = [];
  if (Math.abs(drift.tempoDrift) > 5) {
    preds.push({
      icon: drift.tempoDrift > 0 ? '⚡' : '🌙',
      text: `You'll trend toward ${drift.tempoDrift > 0 ? 'faster' : 'slower'} tracks (${drift.tempoDrift > 0 ? '+' : ''}${Math.round(drift.tempoDrift)} BPM projected)`,
      confidence: Math.min(0.95, 0.5 + Math.abs(drift.tempoDrift) / 60),
    });
  }
  if (Math.abs(drift.valenceDrift) > 0.05) {
    preds.push({
      icon: drift.valenceDrift > 0 ? '😊' : '🌧️',
      text: `Your mood profile may become ${drift.valenceDrift > 0 ? 'more upbeat' : 'more introspective'} (valence ${drift.valenceDrift > 0 ? '+' : ''}${drift.valenceDrift.toFixed(2)})`,
      confidence: Math.min(0.9, 0.5 + Math.abs(drift.valenceDrift) * 3),
    });
  }
  if (Math.abs(drift.danceabilityDrift) > 0.05) {
    preds.push({
      icon: drift.danceabilityDrift > 0 ? '💃' : '🧘',
      text: `Danceability ${drift.danceabilityDrift > 0 ? 'rising' : 'decreasing'} — you may ${drift.danceabilityDrift > 0 ? 'gravitate to club-ready sounds' : 'go deeper into headphone music'}`,
      confidence: Math.min(0.85, 0.5 + Math.abs(drift.danceabilityDrift) * 3),
    });
  }
  const risingGenres = shortGenres.filter((g) => !longGenres.includes(g)).slice(0, 2);
  if (risingGenres.length) {
    preds.push({
      icon: '🎸',
      text: `${risingGenres.join(' & ')} are rising fast in your taste profile`,
      confidence: 0.72,
    });
  }
  if (preds.length < 2) {
    preds.push({ icon: '🔮', text: 'Your taste is remarkably consistent — a true creature of habit', confidence: 0.8 });
  }
  return preds;
}
