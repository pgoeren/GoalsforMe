import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';

const KPI_LABELS = {
  numeric: 'Numeric Target',
  percentage: 'Percentage',
  milestone: 'Milestone',
};

export default function GoalCard({ goal, quarterlyProgress }) {
  const navigate = useNavigate();

  const getProgressValue = () => {
    if (!quarterlyProgress || quarterlyProgress.length === 0) return 0;
    if (goal.kpiType === 'milestone') {
      const completed = quarterlyProgress.filter(q => q.status === 'completed').length;
      return (completed / quarterlyProgress.length) * 100;
    }
    const totalProgress = quarterlyProgress.reduce(
      (sum, q) => sum + (q.halfwayProgress || 0) + (q.fullProgress || 0),
      0
    );
    return goal.kpiTarget > 0 ? (totalProgress / goal.kpiTarget) * 100 : 0;
  };

  return (
    <div className="goal-card" onClick={() => navigate(`/goal/${goal.id}`)}>
      <div className="goal-card-header">
        <h3>{goal.title}</h3>
        <span className="goal-year">{goal.year}</span>
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
      </div>

      <ProgressBar value={getProgressValue()} label="Overall Progress" />
    </div>
  );
}
