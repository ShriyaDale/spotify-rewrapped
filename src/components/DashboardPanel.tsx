'use client';
import { Record } from '@/app/page';
import DNAPage from './pages/DNAPage';
import DiscoveryPage from './pages/DiscoveryPage';
import WorldPage from './pages/WorldPage';
import FuturePage from './pages/FuturePage';
import ConcertRadar from './pages/ConcertRadar';

const PAGES: { [key: string]: React.ComponentType<{ data: any }> } = {
  dna: DNAPage,
  discovery: DiscoveryPage,
  world: WorldPage,
  future: FuturePage,
  concerts: ConcertRadar,
};

interface Props {
  record: Record;
  data: any;
}

export default function DashboardPanel({ record, data }: Props) {
  const Page = PAGES[record.id];
  if (!Page) return null;

  return (
    <div style={{
      borderRadius: 24,
      overflow: 'hidden',
      border: `1px solid ${record.accent}30`,
      boxShadow: `0 0 60px ${record.color}25, 0 24px 80px rgba(0,0,0,0.6)`,
    }}>
      {/* Accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(to right, ${record.color}, ${record.accent}, ${record.label})`,
      }} />

      <div style={{ background: 'rgba(12,7,3,0.97)', backdropFilter: 'blur(20px)' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${record.color}, ${record.spineColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            boxShadow: `0 4px 20px ${record.color}60`,
          }}>
            {record.icon}
          </div>
          <div>
            <h2 style={{
              margin: 0, fontSize: 22, color: '#F0E4D0',
              fontFamily: "'Playfair Display', serif", fontWeight: 'bold',
            }}>
              {record.title}
            </h2>
            <p style={{
              margin: '3px 0 0', fontSize: 12,
              color: 'rgba(240,228,208,0.5)',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
            }}>
              {record.sub}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: '72vh', overflowY: 'auto' }}>
          <Page data={data} />
        </div>
      </div>
    </div>
  );
}