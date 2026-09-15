// Local-only UI preferences - there's no backend endpoint for these, so they live in
// localStorage and only affect this browser. Kept deliberately small: only settings
// that actually change real behavior belong here (see Settings.jsx).
const KEY = 'campusync_prefs';
const DEFAULTS = { liveToasts: true };

export const getPrefs = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
};

export const setPref = (key, value) => {
  const next = { ...getPrefs(), [key]: value };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};
