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

export default function ThemePicker({ value, onChange, color, onColorChange }) {
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (theme) => {
    onChange(value === theme ? '' : theme);
    setShowCustom(false);
    setCustom('');
  };

  const handleCustomSubmit = () => {
    const trimmed = custom.trim();
    if (trimmed) {
      onChange(trimmed);
      setShowCustom(false);
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
          className={`theme-chip theme-chip-custom ${showCustom || (value && !PRESET_THEMES.includes(value)) ? 'active' : ''}`}
          onClick={() => setShowCustom(true)}
        >
          {value && !PRESET_THEMES.includes(value) ? value : 'Custom...'}
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
      {onColorChange && (
        <div className="theme-color-row">
          <label className="form-label theme-color-label">Badge Color</label>
          <div className="theme-color-controls">
            <input
              type="color"
              className="theme-color-input"
              value={color || '#2B9A7E'}
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
