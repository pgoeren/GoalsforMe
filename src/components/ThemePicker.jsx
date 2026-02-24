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

export default function ThemePicker({ value, onChange }) {
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
    </div>
  );
}
