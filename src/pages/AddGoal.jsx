import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalContext';
import { addQuarterlyGoal } from '../firebase/goalService';
import KPIInput from '../components/KPIInput';
import ThemePicker from '../components/ThemePicker';
import { getMidQuarterWednesday } from '../utils/checkInDates';

const STEPS = [
  { num: 1, title: 'Define Your Goal', subtitle: 'What do you want to achieve this year?' },
  { num: 2, title: 'Set Your KPI', subtitle: 'How will you measure success?' },
  { num: 3, title: 'Quarterly Breakdown', subtitle: 'Break it down into quarterly targets' },
];

export default function AddGoal() {
  const navigate = useNavigate();
  const { addYearlyGoal } = useGoals();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    title: '',
    description: '',
    year: currentYear,
    theme: '',
    kpiType: 'numeric',
    kpiTarget: '',
    kpiUnit: '',
    kpiMilestone: '',
    successCriteria: '',
  });

  const [quarters, setQuarters] = useState([
    { quarter: 1, title: '', description: '', kpiTarget: '' },
    { quarter: 2, title: '', description: '', kpiTarget: '' },
    { quarter: 3, title: '', description: '', kpiTarget: '' },
    { quarter: 4, title: '', description: '', kpiTarget: '' },
  ]);

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }));

  const updateQuarter = (idx, updates) => {
    setQuarters(prev => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const canProceed = () => {
    if (step === 1) return form.title.trim() && form.description.trim();
    if (step === 2) {
      if (form.kpiType === 'numeric') return form.kpiTarget && form.kpiUnit;
      if (form.kpiType === 'percentage') return form.kpiTarget;
      if (form.kpiType === 'milestone') return form.kpiMilestone;
    }
    if (step === 3) return quarters.every(q => q.title.trim());
    return false;
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const yearlyGoal = await addYearlyGoal({
        title: form.title,
        description: form.description,
        year: form.year,
        theme: form.theme || null,
        kpiType: form.kpiType,
        kpiTarget: form.kpiType !== 'milestone' ? Number(form.kpiTarget) : null,
        kpiUnit: form.kpiType === 'numeric' ? form.kpiUnit : null,
        kpiMilestone: form.kpiType === 'milestone' ? form.kpiMilestone : null,
        successCriteria: form.successCriteria,
      });

      for (const q of quarters) {
        await addQuarterlyGoal({
          yearlyGoalId: yearlyGoal.id,
          quarter: q.quarter,
          title: q.title,
          description: q.description,
          kpiTarget: q.kpiTarget ? Number(q.kpiTarget) : null,
          checkInDate: getMidQuarterWednesday(form.year, q.quarter).toISOString(),
        });
      }

      navigate(`/goal/${yearlyGoal.id}`);
    } catch (err) {
      alert('Failed to save goal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const autoFillQuarters = () => {
    if (form.kpiType === 'numeric' && form.kpiTarget) {
      const perQ = Math.round(Number(form.kpiTarget) / 4);
      setQuarters(prev =>
        prev.map(q => ({
          ...q,
          title: q.title || `Q${q.quarter}: ${form.title}`,
          kpiTarget: q.kpiTarget || perQ,
        }))
      );
    } else if (form.kpiType === 'percentage' && form.kpiTarget) {
      const perQ = Math.round(Number(form.kpiTarget) / 4);
      setQuarters(prev =>
        prev.map(q => ({
          ...q,
          title: q.title || `Q${q.quarter}: ${form.title}`,
          kpiTarget: q.kpiTarget || perQ * q.quarter,
        }))
      );
    } else {
      setQuarters(prev =>
        prev.map(q => ({
          ...q,
          title: q.title || `Q${q.quarter}: ${form.title}`,
        }))
      );
    }
  };

  return (
    <div className="add-goal">
      <div className="step-indicator">
        {STEPS.map(s => (
          <div
            key={s.num}
            className={`step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}
          >
            <div className="step-circle">{step > s.num ? '\u2713' : s.num}</div>
            <span className="step-title">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="step-content">
        <h2>{STEPS[step - 1].title}</h2>
        <p className="step-subtitle">{STEPS[step - 1].subtitle}</p>

        {step === 1 && (
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Goal Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Build financial stability"
                value={form.title}
                onChange={e => updateForm({ title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Describe what this goal means to you and why it matters..."
                value={form.description}
                onChange={e => updateForm({ description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Year</label>
              <select
                className="form-input"
                value={form.year}
                onChange={e => updateForm({ year: Number(e.target.value) })}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <ThemePicker
              value={form.theme}
              onChange={theme => updateForm({ theme })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="form-section">
            <KPIInput
              kpiType={form.kpiType}
              kpiTarget={form.kpiTarget}
              kpiUnit={form.kpiUnit}
              kpiMilestone={form.kpiMilestone}
              onChange={updateForm}
            />
            <div className="form-field">
              <label className="form-label">What does success look like?</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Describe what achieving this goal looks like at the end of the year..."
                value={form.successCriteria}
                onChange={e => updateForm({ successCriteria: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-section">
            <button
              type="button"
              className="btn btn-outline btn-sm auto-fill-btn"
              onClick={autoFillQuarters}
            >
              Auto-fill from yearly goal
            </button>
            {quarters.map((q, idx) => (
              <div key={q.quarter} className="quarter-input-card">
                <h3>Q{q.quarter} {['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'][idx]}</h3>
                <div className="form-field">
                  <label className="form-label">Quarter Goal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`What will you accomplish in Q${q.quarter}?`}
                    value={q.title}
                    onChange={e => updateQuarter(idx, { title: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Description (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Key actions or milestones..."
                    value={q.description}
                    onChange={e => updateQuarter(idx, { description: e.target.value })}
                  />
                </div>
                {form.kpiType !== 'milestone' && (
                  <div className="form-field">
                    <label className="form-label">
                      Quarter Target {form.kpiType === 'percentage' ? '(%)' : `(${form.kpiUnit || 'units'})`}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Target for this quarter"
                      value={q.kpiTarget}
                      onChange={e => updateQuarter(idx, { kpiTarget: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="step-actions">
        {step > 1 && (
          <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            className="btn btn-primary"
            disabled={!canProceed()}
            onClick={() => setStep(s => s + 1)}
          >
            Next
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={!canProceed() || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : 'Create Goal'}
          </button>
        )}
      </div>
    </div>
  );
}
