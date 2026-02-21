'use client';
import { Record } from '@/app/page';
import DNAPage from './pages/DNAPage';
import DiscoveryPage from './pages/DiscoveryPage';
import WorldPage from './pages/WorldPage';
import FuturePage from './pages/FuturePage';

const PAGES: Record<string, React.ComponentType<{ data: any }>> = {
  dna: DNAPage,
  // mood: MoodPage,
  // intensity: IntensityPage,
  discovery: DiscoveryPage,
  world: WorldPage,
  future: FuturePage,
};

interface Props {
  record: Record;
  data: any;
}

export default function DashboardPanel({ record, data }: Props) {
  const Page = PAGES[record.id];
  if (!Page) return null;

  return (
    <div
      style={{
        borderRadius: 24,
        padding: 2,
        background: `linear-gradient(135deg, ${record.color}45 0%, ${record.accent}18 100%)`,
        border: `1px solid ${record.accent}28`,
        boxShadow: `0 0 50px ${record.color}20, 0 20px 60px rgba(0,0,0,0.5)`,
      }}
    >
      <div
        style={{
          borderRadius: 22,
          padding: 24,
          background: 'rgba(14,8,4,0.95)',
          backdropFilter: 'blur(20px)',
          maxHeight: '72vh',
          overflowY: 'auto',
        }}
      >
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ fontSize: 34 }}>{record.icon}</span>
          <div>
            <h2 style={{
              margin: 0, fontSize: 22, color: 'white',
              fontFamily: "'Playfair Display', serif", fontWeight: 'bold',
            }}>
              {record.title}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {record.sub}
            </p>
          </div>
        </div>

        <Page data={data} />
      </div>
    </div>
  );
}
