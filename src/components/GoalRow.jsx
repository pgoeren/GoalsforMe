import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { THEME_COLORS } from './ThemePicker';

const KPI_LABELS = {
  numeric: 'Numeric',
  percentage: 'Percentage',
  milestone: 'Milestone',
  debt_payoff: 'Debt Payoff',
};

const MILESTONE_STATUS_PCT = { completed: 100, on_track: 75, in_progress: 50, off_track: 25, not_started: 0 };

function getLatestDebtBalance(quarterlyProgress, startValue) {
  for (let i = quarterlyProgress.length - 1; i >= 0; i--) {
    const q = quarterlyProgress[i];
    if (q.fullProgress > 0) return q.fullProgress;
    if (q.halfwayProgress > 0) return q.halfwayProgress;
  }
  return startValue;
}

export function getGoalProgressValue(goal, quarterlyProgress) {
  if (!quarterlyProgress || quarterlyProgress.length === 0) return 0;
  if (goal.kpiType === 'milestone') {
    const completed = quarterlyProgress.filter((q) => q.status === 'completed').length;
    return (completed / quarterlyProgress.length) * 100;
  }
  if (goal.kpiType === 'debt_payoff') {
    const start = goal.kpiStartValue || 0;
    const target = goal.kpiTarget || 0;
    const totalToPayOff = start - target;
    if (totalToPayOff <= 0) return 0;
    const latest = getLatestDebtBalance(quarterlyProgress, start);
    const paidOff = start - latest;
    return Math.min(100, Math.max(0, (paidOff / totalToPayOff) * 100));
  }
  const totalProgress = quarterlyProgress.reduce(
    (sum, q) => sum + (q.halfwayProgress || 0) + (q.fullProgress || 0),
    0
  );
  return goal.kpiTarget > 0 ? (totalProgress / goal.kpiTarget) * 100 : 0;
}

export default function GoalRow({ goal, quarterlyProgress }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const progress = getGoalProgressValue(goal, quarterlyProgress);
  const hasQuarterlyData = quarterlyProgress && quarterlyProgress.length > 0;
  const isDebt = goal.kpiType === 'debt_payoff';
  const themeColor = goal.themeColor || THEME_COLORS[goal.theme] || null;

  const getQuarterProgressValue = (q) => {
    if (!q) return 0;
    if (goal.kpiType === 'milestone') return MILESTONE_STATUS_PCT[q.status] ?? 0;
    if (goal.kpiType === 'debt_payoff') {
      const start = goal.kpiStartValue || 0;
      const target = goal.kpiTarget || 0;
      const totalToPayOff = start - target;
      if (totalToPayOff <= 0) return 0;
      const balance = q.fullProgress || q.halfwayProgress || start;
      return Math.min(100, Math.max(0, ((start - balance) / totalToPayOff) * 100));
    }
    const qTarget = q.kpiTarget || (goal.kpiTarget ? goal.kpiTarget / 4 : 0);
    if (!qTarget) return 0;
    return ((q.halfwayProgress || 0) + (q.fullProgress || 0)) / qTarget * 100;
  };

  return (
    <div className={`goal-row ${open ? 'goal-row-open' : ''}`}>
      <button
        className="goal-row-header"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <svg
          className="goal-row-chevron"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="goal-row-title">{goal.title}</span>
        <div className="goal-row-bar">
          <ProgressBar value={progress} size="small" />
        </div>
      </button>

      {open && (
        <div className="goal-row-body">
          {goal.description && (
            <p className="goal-row-description">{goal.description}</p>
          )}

          <div className="goal-row-meta">
            <span className={`kpi-type ${goal.kpiType}`}>{KPI_LABELS[goal.kpiType]}</span>
            {goal.kpiType === 'numeric' && (
              <span className="kpi-target">Target: {goal.kpiTarget} {goal.kpiUnit}</span>
            )}
            {goal.kpiType === 'percentage' && (
              <span className="kpi-target">Target: {goal.kpiTarget}%</span>
            )}
            {goal.kpiType === 'milestone' && (
              <span className="kpi-target">{goal.kpiMilestone}</span>
            )}
            {isDebt && (
              <span className="kpi-target">
                {(goal.kpiStartValue || 0).toLocaleString()} &rarr; {(goal.kpiTarget || 0).toLocaleString()} {goal.kpiUnit || ''}
              </span>
            )}
          </div>

          {isDebt && hasQuarterlyData && (
            <p className="goal-row-debt">
              Paid off: {((goal.kpiStartValue || 0) - getLatestDebtBalance(quarterlyProgress, goal.kpiStartValue || 0)).toLocaleString()} {goal.kpiUnit || ''}
            </p>
          )}

          {hasQuarterlyData && (
            <div className="goal-row-quarters">
              {[1, 2, 3, 4].map((q) => {
                const qData = quarterlyProgress.find((qp) => qp.quarter === q);
                return (
                  <ProgressBar
                    key={q}
                    value={getQuarterProgressValue(qData)}
                    label={`Q${q}`}
                    size="small"
                  />
                );
              })}
            </div>
          )}

          <button
            className="btn btn-secondary goal-row-link"
            onClick={(e) => { e.stopPropagation(); navigate(`/goal/${goal.id}`); }}
            type="button"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}
