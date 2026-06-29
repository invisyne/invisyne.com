// Central animation + color config. Brand tokens stay the source of truth:
// colors are read from CSS custom properties, never hard-coded here.

export const TIMING = { fast: 0.6, base: 0.9, slow: 1.2, stagger: 0.08 };

export const EASE = {
  cinematic: 'cubic-bezier(0.16,1,0.3,1)',
  power: 'power3.out',
  in: 'power2.in',
};

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let _cache = null;
export function colors() {
  if (_cache) return _cache;
  _cache = {
    primary:   cssVar('--brand-primary')    || '#2549FF',
    secondary: cssVar('--brand-secondary')  || '#BF4DF3',
    grey950:   cssVar('--brand-grey-950')   || '#191A20',
    grey600:   cssVar('--brand-grey-600')   || '#746B7D',
    bg:        cssVar('--bg')               || '#eef0f5',
    teal:      cssVar('--brand-tertiary-1') || '#2BBDB6',
    orange:    cssVar('--brand-tertiary-2') || '#F78337',
  };
  return _cache;
}
