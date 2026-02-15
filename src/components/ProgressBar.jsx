export default function ProgressBar({ value, max = 100, label, size = 'default' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  let colorClass = 'progress-low';
  if (pct >= 75) colorClass = 'progress-high';
  else if (pct >= 40) colorClass = 'progress-mid';

  return (
    <div className={`progress-bar-wrapper ${size}`}>
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-track">
        <div
          className={`progress-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="progress-text">{pct}%</span>
    </div>
  );
}
