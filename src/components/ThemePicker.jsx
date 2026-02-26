import { useState } from 'react';

const PRESET_THEMES = [
  'Health & Fitness',
  'Finance',
  'Career',
  'Education',
  'Relationships',
  'Personal Growth',
  'Creative',
  'Community',
];

export const THEME_COLORS = {
  'Health & Fitness': '#22c55e',
  'Finance':          '#3b82f6',
  'Career':           '#f97316',
  'Education':        '#8b5cf6',
  'Relationships':    '#ec4899',
  'Personal Growth':  '#2B9A7E',
  'Creative':         '#f59e0b',
  'Community':        '#ef4444',
};

const DEFAULT_CUSTOM_COLOR = '#2B9A7E';

export default function ThemePicker({ value, onChange, color, onColorChange }) {
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const isCustom = value && !PRESET_THEMES.includes(value);

  const handlePreset = (theme) => {
    if (value === theme) {
      onChange('');
      if (onColorChange) onColorChange('');
    } else {
      onChange(theme);
      setShowCustom(false);
      setCustom('');
      if (onColorChange) onColorChange(THEME_COLORS[theme]);
    }
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    if (!isCustom && onColorChange && !color) {
      onColorChange(DEFAULT_CUSTOM_COLOR);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = custom.trim();
    if (trimmed) {
      onChange(trimmed);
      setShowCustom(false);
      if (onColorChange && !color) onColorChange(DEFAULT_CUSTOM_COLOR);
    }
  };

  return (
    <div className="form-field">
      <label className="form-label">Theme (optional)</label>
      <div className="theme-chips">
        {PRESET_THEMES.map(theme => (
          <button
            key={theme}
            type="button"
            className={`theme-chip ${value === theme ? 'active' : ''}`}
            onClick={() => handlePreset(theme)}
          >
            {theme}
          </button>
        ))}
        <button
          type="button"
          className={`theme-chip theme-chip-custom ${showCustom || isCustom ? 'active' : ''}`}
          onClick={handleCustomClick}
        >
          {isCustom ? value : 'Custom...'}
        </button>
      </div>
      {showCustom && (
        <div className="theme-custom-row">
          <input
            type="text"
            className="form-input form-input-sm"
            placeholder="Enter custom theme..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
            autoFocus
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCustomSubmit}>
            Set
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { setShowCustom(false); setCustom(''); }}
          >
            Cancel
          </button>
        </div>
      )}
      {onColorChange && isCustom && (
        <div className="theme-color-row">
          <label className="form-label theme-color-label">Badge Color</label>
          <div className="theme-color-controls">
            <input
              type="color"
              className="theme-color-input"
              value={color || DEFAULT_CUSTOM_COLOR}
              onChange={e => onColorChange(e.target.value)}
              title="Choose badge color"
            />
            {color && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onColorChange('')}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
