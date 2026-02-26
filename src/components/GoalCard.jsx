import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { THEME_COLORS } from './ThemePicker';

const KPI_LABELS = {
  numeric: 'Numeric Target',
  percentage: 'Percentage',
  milestone: 'Milestone',
  debt_payoff: 'Debt Payoff',
};

const MILESTONE_STATUS_PCT = { completed: 100, on_track: 75, in_progress: 50, off_track: 25, not_started: 0 };

// For debt_payoff, get the latest balance the user entered across all quarters
function getLatestDebtBalance(quarterlyProgress, startValue) {
  for (let i = quarterlyProgress.length - 1; i >= 0; i--) {
    const q = quarterlyProgress[i];
    if (q.fullProgress > 0) return q.fullProgress;
    if (q.halfwayProgress > 0) return q.halfwayProgress;
  }
  return startValue;
}

export default function GoalCard({ goal, quarterlyProgress }) {
  const navigate = useNavigate();

  const getProgressValue = () => {
    if (!quarterlyProgress || quarterlyProgress.length === 0) return 0;
    if (goal.kpiType === 'milestone') {
      const completed = quarterlyProgress.filter(q => q.status === 'completed').length;
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
  };

  const getQuarterProgressValue = (q) => {
    if (!q) return 0;
    if (goal.kpiType === 'milestone') {
      return MILESTONE_STATUS_PCT[q.status] ?? 0;
    }
    if (goal.kpiType === 'debt_payoff') {
      const start = goal.kpiStartValue || 0;
      const target = goal.kpiTarget || 0;
      const totalToPayOff = start - target;
      if (totalToPayOff <= 0) return 0;
      const balance = q.fullProgress || q.halfwayProgress || start;
      const paidOff = start - balance;
      return Math.min(100, Math.max(0, (paidOff / totalToPayOff) * 100));
    }
    const qTarget = q.kpiTarget || (goal.kpiTarget ? goal.kpiTarget / 4 : 0);
    if (!qTarget) return 0;
    return ((q.halfwayProgress || 0) + (q.fullProgress || 0)) / qTarget * 100;
  };

  const hasQuarterlyData = quarterlyProgress && quarterlyProgress.length > 0;
  const isDebt = goal.kpiType === 'debt_payoff';

  return (
    <div className="goal-card" onClick={() => navigate(`/goal/${goal.id}`)}>
      <div className="goal-card-header">
        <h3>{goal.title}</h3>
        <div className="goal-card-badges">
          {goal.theme && (
            <span
              className="goal-theme-badge"
              style={{ backgroundColor: goal.themeColor || THEME_COLORS[goal.theme] || undefined, color: (goal.themeColor || THEME_COLORS[goal.theme]) ? '#fff' : undefined }}
            >
              {goal.theme}
            </span>
          )}
          <span className="goal-year">{goal.year}</span>
        </div>
      </div>

      <p className="goal-description">{goal.description}</p>

      <div className="goal-kpi-badge">
        <span className={`kpi-type ${goal.kpiType}`}>{KPI_LABELS[goal.kpiType]}</span>
        {goal.kpiType === 'numeric' && (
          <span className="kpi-target">
            Target: {goal.kpiTarget} {goal.kpiUnit}
          </span>
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
        <div className="debt-card-summary">
          <span className="debt-paid-off">
            Paid off: {((goal.kpiStartValue || 0) - getLatestDebtBalance(quarterlyProgress, goal.kpiStartValue || 0)).toLocaleString()} {goal.kpiUnit || ''}
          </span>
        </div>
      )}

      <ProgressBar value={getProgressValue()} label="Overall Progress" />

      {hasQuarterlyData && (
        <div className="quarterly-progress-section">
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
    </div>
  );
}
