'use client';
import MoodIntensityPage from './MoodIntensityPage';
import MoodPage from './MoodPage';
import IntensityPage from './IntensityPage';

interface Props { data: any }

export default function DNAPage({ data }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, fontFamily: 'monospace' }}>DNA · MOOD INTENSITY</div>
      <MoodIntensityPage data={data} />

      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, fontFamily: 'monospace', marginTop: 4 }}>DNA · MOOD PROFILE</div>
      <MoodPage data={data} />

      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, fontFamily: 'monospace', marginTop: 4 }}>DNA · FAN INTENSITY</div>
      <IntensityPage data={data} />
    </div>
  );
}