import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalContext';
import GoalRow, { getGoalProgressValue } from '../components/GoalRow';
import ProgressBar from '../components/ProgressBar';
import Collapsible from '../components/Collapsible';
import SeasonTimeline from '../components/SeasonTimeline';
import { THEME_COLORS } from '../components/ThemePicker';
import { getQuarterlyGoals, subscribeToQuarterlyGoals } from '../firebase/goalService';
import { getNextCheckIn, formatDate, getCurrentQuarter, getEndOfQuarterWednesday } from '../utils/checkInDates';

export default function Dashboard() {
  const { yearlyGoals, loading } = useGoals();
  const [quarterlyData, setQuarterlyData] = useState({});
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const nextCheckIn = getNextCheckIn(currentYear);
  const unsubscribesRef = useRef([]);

  // Real-time subscriptions for quarterly goals of each yearly goal
  useEffect(() => {
    // Clean up previous subscriptions
    unsubscribesRef.current.forEach((fn) => fn());
    unsubscribesRef.current = [];

    if (yearlyGoals.length === 0) return;

    for (const goal of yearlyGoals) {
      const unsub = subscribeToQuarterlyGoals(
        goal.id,
        (goals) => setQuarterlyData((prev) => ({ ...prev, [goal.id]: goals })),
        () => {
          // Fallback: one-time fetch
          getQuarterlyGoals(goal.id).then((goals) =>
            setQuarterlyData((prev) => ({ ...prev, [goal.id]: goals }))
          );
        }
      );

      if (unsub) {
        unsubscribesRef.current.push(unsub);
      } else {
        // Firestore not available — one-time fetch
        getQuarterlyGoals(goal.id).then((goals) =>
          setQuarterlyData((prev) => ({ ...prev, [goal.id]: goals }))
        );
      }
    }

    return () => {
      unsubscribesRef.current.forEach((fn) => fn());
      unsubscribesRef.current = [];
    };
  }, [yearlyGoals]);

  // Countdown calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntil = (target) => {
    const t = new Date(target);
    t.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((t - today) / (1000 * 60 * 60 * 24)));
  };

  const currentQuarter = getCurrentQuarter();
  const quarterEnd = getEndOfQuarterWednesday(currentYear, currentQuarter);
  const yearEnd = new Date(currentYear, 11, 31);

  const daysToCheckIn = nextCheckIn ? daysUntil(nextCheckIn.date) : null;
  const daysToQuarterEnd = daysUntil(quarterEnd);
  const daysToYearEnd = daysUntil(yearEnd);

  const formatCountdown = (days) => {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    if (weeks === 0) return `${days}d`;
    if (rem === 0) return `${weeks}w`;
    return `${weeks}w ${rem}d`;
  };

  const getGoalProgress = (goal) => getGoalProgressValue(goal, quarterlyData[goal.id]);

  const getGroupedGoals = () => {
    const groups = {};
    for (const goal of yearlyGoals) {
      const key = goal.theme || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(goal);
    }
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
    return sorted;
  };

  const getThemeProgress = (goals) => {
    if (!goals.length) return 0;
    const total = goals.reduce((sum, g) => sum + getGoalProgress(g), 0);
    return total / goals.length;
  };

  if (loading) {
    return <div className="loading-spinner">Loading your goals...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Goals</h1>
        <button className="btn btn-primary" onClick={() => navigate('/add')}>
          + New Goal
        </button>
      </div>

      {nextCheckIn && (
        <Collapsible id="checkin" title="Next Check-in">
          <div className="next-checkin-banner">
            <div className="banner-content">
              <span className="banner-label">Next Check-in</span>
              <span className="banner-date">
                {nextCheckIn.label} &mdash; {formatDate(nextCheckIn.date)}
              </span>
            </div>
          </div>
        </Collapsible>
      )}

      <Collapsible id="countdown" title="Countdown">
        <div className="countdown-strip">
          {daysToCheckIn !== null && (
            <div className="countdown-item">
              <span className="countdown-value">{formatCountdown(daysToCheckIn)}</span>
              <span className="countdown-label">to check-in</span>
            </div>
          )}
          <div className="countdown-item">
            <span className="countdown-value">{formatCountdown(daysToQuarterEnd)}</span>
            <span className="countdown-label">left in Q{currentQuarter}</span>
          </div>
          <div className="countdown-item">
            <span className="countdown-value">{formatCountdown(daysToYearEnd)}</span>
            <span className="countdown-label">left in {currentYear}</span>
          </div>
        </div>
      </Collapsible>

      {yearlyGoals.length > 0 && (
        <Collapsible id="glance" title="At a Glance">
          <div className="goals-glance">
            {yearlyGoals.map((goal) => (
              <div
                key={goal.id}
                className="glance-row"
                onClick={() => navigate(`/goal/${goal.id}`)}
              >
                <span className="glance-name">{goal.title}</span>
                <ProgressBar value={getGoalProgressValue(goal, quarterlyData[goal.id])} size="small" />
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      <Collapsible id="timeline" title="Timeline">
        <SeasonTimeline year={currentYear} />
      </Collapsible>

      {yearlyGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 64 64" width="64" height="64" fill="none">
              <circle cx="20" cy="32" r="8" fill="#4F46E5" opacity="0.2" />
              <circle cx="44" cy="32" r="8" fill="#818CF8" opacity="0.2" />
              <circle cx="32" cy="18" r="8" fill="#A5B4FC" opacity="0.2" />
              <circle cx="32" cy="46" r="8" fill="#4F46E5" opacity="0.15" />
            </svg>
          </div>
          <h2>No goals yet</h2>
          <p>Start by creating your first yearly goal. You'll define what success looks like and break it down into quarterly milestones.</p>
          <button className="btn btn-primary" onClick={() => navigate('/add')}>
            Create Your First Goal
          </button>
        </div>
      ) : (
        <Collapsible id="goals" title="Goals">
          <div className="goals-summary">
            <div className="summary-stat">
              <span className="stat-value">{yearlyGoals.length}</span>
              <span className="stat-label">Goals</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">Q{getCurrentQuarter()}</span>
              <span className="stat-label">Current</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{currentYear}</span>
              <span className="stat-label">Year</span>
            </div>
          </div>

          <div className="themed-groups">
            {getGroupedGoals().map(([theme, goals]) => {
              const themeColor = goals[0]?.themeColor || THEME_COLORS[theme] || null;
              const themeProgress = getThemeProgress(goals);
              return (
                <div key={theme} className="theme-group">
                  <div className="theme-group-header">
                    {themeColor && (
                      <span
                        className="theme-group-dot"
                        style={{ backgroundColor: themeColor }}
                      />
                    )}
                    <span className="theme-group-name">{theme}</span>
                    <div className="theme-group-bar">
                      <ProgressBar value={themeProgress} size="small" />
                    </div>
                  </div>
                  <div className="goal-rows">
                    {goals.map((goal) => (
                      <GoalRow
                        key={goal.id}
                        goal={goal}
                        quarterlyProgress={quarterlyData[goal.id]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
