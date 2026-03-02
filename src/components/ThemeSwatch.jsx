import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gfm_accentColor';

const SWATCHES = [
  { name: 'Indigo',  primary: '#4F46E5', light: '#818CF8', dark: '#3730A3', tint: '#EEF2FF', bg: '#F4F3FF', darkPrimary: '#818CF8', darkLight: '#A5B4FC', darkDark: '#6366F1', darkTint: '#243356', darkBg: '#0F1129' },
  { name: 'Teal',    primary: '#0D9488', light: '#2DD4BF', dark: '#115E59', tint: '#CCFBF1', bg: '#F0F8F7', darkPrimary: '#2DD4BF', darkLight: '#5EEAD4', darkDark: '#14B8A6', darkTint: '#1A3D36', darkBg: '#0A1715' },
  { name: 'Rose',    primary: '#E11D48', light: '#FB7185', dark: '#9F1239', tint: '#FFE4E6', bg: '#FEF5F6', darkPrimary: '#FB7185', darkLight: '#FDA4AF', darkDark: '#F43F5E', darkTint: '#3D1F28', darkBg: '#1A0D10' },
  { name: 'Amber',   primary: '#D97706', light: '#F59E0B', dark: '#92400E', tint: '#FEF3C7', bg: '#FFFBF0', darkPrimary: '#F59E0B', darkLight: '#FBBF24', darkDark: '#D97706', darkTint: '#3D3520', darkBg: '#1A1305' },
  { name: 'Violet',  primary: '#7C3AED', light: '#A78BFA', dark: '#5B21B6', tint: '#EDE9FE', bg: '#F8F5FF', darkPrimary: '#A78BFA', darkLight: '#C4B5FD', darkDark: '#8B5CF6', darkTint: '#2E2640', darkBg: '#120D1E' },
  { name: 'Sky',     primary: '#0284C7', light: '#38BDF8', dark: '#075985', tint: '#E0F2FE', bg: '#F0F7FF', darkPrimary: '#38BDF8', darkLight: '#7DD3FC', darkDark: '#0EA5E9', darkTint: '#1E2E3D', darkBg: '#0A1520' },
  { name: 'Emerald', primary: '#059669', light: '#34D399', dark: '#065F46', tint: '#D1FAE5', bg: '#F0FAF6', darkPrimary: '#34D399', darkLight: '#6EE7B7', darkDark: '#10B981', darkTint: '#1E3D2E', darkBg: '#0A1814' },
  { name: 'Orange',  primary: '#EA580C', light: '#FB923C', dark: '#9A3412', tint: '#FFEDD5', bg: '#FFF8F4', darkPrimary: '#FB923C', darkLight: '#FDBA74', darkDark: '#F97316', darkTint: '#3D2A1E', darkBg: '#1A1008' },
];

const THEME_PROPS = ['--color-primary', '--color-primary-light', '--color-primary-dark', '--tint-indigo', '--gradient-banner', '--gradient-track', '--color-bg'];

function applyAccent(swatchName) {
  const swatch = SWATCHES.find((s) => s.name === swatchName);
  if (!swatch) {
    THEME_PROPS.forEach((p) => document.documentElement.style.removeProperty(p));
    document.documentElement.removeAttribute('data-accent');
    return;
  }

  document.documentElement.setAttribute('data-accent', swatchName);

  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';

  root.style.setProperty('--color-primary', isDark ? swatch.darkPrimary : swatch.primary);
  root.style.setProperty('--color-primary-light', isDark ? swatch.darkLight : swatch.light);
  root.style.setProperty('--color-primary-dark', isDark ? swatch.darkDark : swatch.dark);
  root.style.setProperty('--tint-indigo', isDark ? swatch.darkTint : swatch.tint);
  root.style.setProperty('--gradient-banner', isDark ? swatch.darkDark : swatch.primary);
  root.style.setProperty('--gradient-track', swatch.primary);
  root.style.setProperty('--color-bg', isDark ? swatch.darkBg : swatch.bg);
}

// Apply on first load
const savedAccent = localStorage.getItem(STORAGE_KEY);
if (savedAccent) applyAccent(savedAccent);

// Re-apply when dark mode changes so the dark/light variant is correct
const observer = new MutationObserver(() => {
  const accent = localStorage.getItem(STORAGE_KEY);
  if (accent) applyAccent(accent);
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

export default function ThemeSwatch() {
  const [selected, setSelected] = useState(() => localStorage.getItem(STORAGE_KEY) || 'Indigo');

  useEffect(() => {
    applyAccent(selected);
    localStorage.setItem(STORAGE_KEY, selected);
  }, [selected]);

  return (
    <div className="theme-swatch-picker">
      {SWATCHES.map((s) => (
        <button
          key={s.name}
          className={`swatch-dot ${selected === s.name ? 'active' : ''}`}
          style={{ '--swatch-color': s.primary }}
          onClick={() => setSelected(s.name)}
          title={s.name}
          aria-label={`${s.name} theme`}
        >
          {selected === s.name && (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
