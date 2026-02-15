import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { getCurrentQuarter } from '../utils/checkInDates';

const KPI_LABELS = {
  numeric: 'Numeric Target',
  percentage: 'Percentage',
  milestone: 'Milestone',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  off_track: 'Off Track',
};

export default function GoalCard({ goal, quarterlyProgress }) {
  const navigate = useNavigate();
  const currentQ = getCurrentQuarter();

  const getProgressValue = () => {
    if (!quarterlyProgress || quarterlyProgress.length === 0) return 0;
    if (goal.kpiType === 'milestone') {
      const completed = quarterlyProgress.filter(q => q.status === 'completed').length;
      return (completed / quarterlyProgress.length) * 100;
    }
    const totalProgress = quarterlyProgress.reduce((sum, q) => sum + (q.kpiProgress || 0), 0);
    return goal.kpiTarget > 0 ? (totalProgress / goal.kpiTarget) * 100 : 0;
  };

  const currentQuarterGoal = quarterlyProgress?.find(q => q.quarter === currentQ);

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

      {currentQuarterGoal && (
        <div className="current-quarter-status">
          <span className="quarter-label">Q{currentQ}</span>
          <span className={`status-badge ${currentQuarterGoal.status}`}>
            {STATUS_LABELS[currentQuarterGoal.status]}
          </span>
        </div>
      )}
    </div>
  );
}
