// Deterministic fallback avatar (colored initial) for entities with no uploaded
// image, e.g. a company logo on an opportunity card - same name always gets the
// same color so it stays recognizable across renders.
const PALETTE = [
  { bg: 'bg-forest-100', text: 'text-forest-700' },
  { bg: 'bg-brass-100', text: 'text-brass-800' },
  { bg: 'bg-info-bg', text: 'text-info' },
  { bg: 'bg-success-bg', text: 'text-success' },
  { bg: 'bg-warning-bg', text: 'text-warning' },
  { bg: 'bg-slate-200', text: 'text-slate-700' },
];

export const avatarStyle = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

export const initialFor = (name = '') => name.trim().charAt(0).toUpperCase() || '?';
