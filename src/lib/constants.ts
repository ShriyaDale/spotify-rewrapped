// Vinyl record shelf definitions

export const RECORDS = [
  {
    id: 'dna',
    title: 'MY DNA',
    sub: 'Your Sonic Genome',
    icon: '🧬',
    color: '#7C3F18',
    accent: '#C8762C',
    label: '#F5DEB3',
    spineColor: '#5C2E10',
    rings: ['#5C2E10', '#7C3F18', '#9C5F28', '#BC7F48'],
  },
  {
    id: 'discovery',
    title: 'DISCOVERY',
    sub: 'Uncharted Grooves',
    icon: '🔭',
    color: '#0E1A5C',
    accent: '#2E4AAC',
    label: '#B0C4FF',
    spineColor: '#080E3A',
    rings: ['#080E3A', '#0E1A5C', '#1E2A7C', '#2E4AAC'],
  },
  {
    id: 'world',
    title: 'WORLD MAP',
    sub: 'Your Global Reach',
    icon: '🌍',
    color: '#063830',
    accent: '#0A7060',
    label: '#A0E8D8',
    spineColor: '#042820',
    rings: ['#042820', '#063830', '#0A5848', '#0A7060'],
  },
  {
    id: 'future',
    title: 'NEXT YEAR',
    sub: 'Your Musical Future',
    icon: '🔮',
    color: '#320860',
    accent: '#7030B0',
    label: '#D8B0F0',
    spineColor: '#200440',
    rings: ['#200440', '#320860', '#4A1490', '#7030B0'],
  },
] as const;

export type Record = typeof RECORDS[0];
