export default function KPIInput({ kpiType, kpiTarget, kpiUnit, kpiMilestone, kpiStartValue, onChange }) {
  return (
    <div className="kpi-input-group">
      <label className="form-label">KPI Type</label>
      <div className="kpi-type-selector">
        <button
          type="button"
          className={`kpi-option ${kpiType === 'numeric' ? 'active' : ''}`}
          onClick={() => onChange({ kpiType: 'numeric' })}
        >
          <span className="kpi-option-icon">#</span>
          <span>Numeric</span>
          <small>e.g., Save $10K, Run 500 miles</small>
        </button>
        <button
          type="button"
          className={`kpi-option ${kpiType === 'percentage' ? 'active' : ''}`}
          onClick={() => onChange({ kpiType: 'percentage' })}
        >
          <span className="kpi-option-icon">%</span>
          <span>Percentage</span>
          <small>e.g., 100% certification</small>
        </button>
        <button
          type="button"
          className={`kpi-option ${kpiType === 'milestone' ? 'active' : ''}`}
          onClick={() => onChange({ kpiType: 'milestone' })}
        >
          <span className="kpi-option-icon">&bull;</span>
          <span>Milestone</span>
          <small>e.g., Launch website</small>
        </button>
        <button
          type="button"
          className={`kpi-option ${kpiType === 'debt_payoff' ? 'active' : ''}`}
          onClick={() => onChange({ kpiType: 'debt_payoff' })}
        >
          <span className="kpi-option-icon">$</span>
          <span>Debt Payoff</span>
          <small>e.g., Pay down $13K to $5K</small>
        </button>
      </div>

      {kpiType === 'numeric' && (
        <div className="kpi-details">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Target Number</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 10000"
                value={kpiTarget || ''}
                onChange={e => onChange({ kpiTarget: Number(e.target.value) })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Unit</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., dollars, miles, books"
                value={kpiUnit || ''}
                onChange={e => onChange({ kpiUnit: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {kpiType === 'percentage' && (
        <div className="kpi-details">
          <div className="form-field">
            <label className="form-label">Target Percentage</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 100"
              min="0"
              max="100"
              value={kpiTarget || ''}
              onChange={e => onChange({ kpiTarget: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {kpiType === 'milestone' && (
        <div className="kpi-details">
          <div className="form-field">
            <label className="form-label">What does success look like?</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Website launched and live"
              value={kpiMilestone || ''}
              onChange={e => onChange({ kpiMilestone: e.target.value })}
            />
          </div>
        </div>
      )}

      {kpiType === 'debt_payoff' && (
        <div className="kpi-details">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Current Total Debt</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 13000"
                value={kpiStartValue || ''}
                onChange={e => onChange({ kpiStartValue: Number(e.target.value) })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Target Balance</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 5000"
                value={kpiTarget || ''}
                onChange={e => onChange({ kpiTarget: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Unit</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., dollars"
              value={kpiUnit || ''}
              onChange={e => onChange({ kpiUnit: e.target.value })}
            />
          </div>
          {kpiStartValue > 0 && kpiTarget >= 0 && kpiStartValue > kpiTarget && (
            <div className="debt-summary-preview">
              <span>Total to pay off: <strong>{(kpiStartValue - kpiTarget).toLocaleString()} {kpiUnit || ''}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
