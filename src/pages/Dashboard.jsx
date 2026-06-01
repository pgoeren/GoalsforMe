import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalContext';
import GoalRow from '../components/GoalRow';
import ProgressBar from '../components/ProgressBar';
import SeasonTimeline from '../components/SeasonTimeline';
import { getQuarterlyGoals, subscribeToQuarterlyGoals } from '../firebase/goalService';
import { getNextCheckIn, formatDate, getCurrentQuarter, getEndOfQuarterWednesday } from '../utils/checkInDates';

export default function Dashboard() {
  const { yearlyGoals, loading } = useGoals();
  const [quarterlyData, setQuarterlyData] = useState({});
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const nextCheckIn = getNextCheckIn(currentYear);
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    unsubscribesRef.current.forEach((fn) => fn());
    unsubscribesRef.current = [];

    if (yearlyGoals.length === 0) return;

    for (const goal of yearlyGoals) {
      const unsub = subscribeToQuarterlyGoals(
        goal.id,
        (goals) => setQuarterlyData((prev) => ({ ...prev, [goal.id]: goals })),
        () => {
          getQuarterlyGoals(goal.id).then((goals) =>
            setQuarterlyData((prev) => ({ ...prev, [goal.id]: goals }))
          );
        }
      );
      if (unsub) {
        unsubscribesRef.current.push(unsub);
      } else {
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

  const getGoalProgress = (goal) => {
    const qp = quarterlyData[goal.id];
    if (!qp || qp.length === 0) return 0;
    if (goal.kpiType === 'milestone') {
      return (qp.filter((q) => q.status === 'completed').length / qp.length) * 100;
    }
    if (goal.kpiType === 'debt_payoff') {
      const start = goal.kpiStartValue || 0;
      const target = goal.kpiTarget || 0;
      const total = start - target;
      if (total <= 0) return 0;
      let latest = start;
      for (let i = qp.length - 1; i >= 0; i--) {
        if (qp[i].fullProgress > 0) { latest = qp[i].fullProgress; break; }
        if (qp[i].halfwayProgress > 0) { latest = qp[i].halfwayProgress; break; }
      }
      return Math.min(100, Math.max(0, ((start - latest) / total) * 100));
    }
    const sum = qp.reduce((s, q) => s + (q.halfwayProgress || 0) + (q.fullProgress || 0), 0);
    return goal.kpiTarget > 0 ? (sum / goal.kpiTarget) * 100 : 0;
  };

  const getGroupedGoals = () => {
    const groups = {};
    for (const goal of yearlyGoals) {
      const key = goal.theme || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(goal);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  };

  const overallProgress = yearlyGoals.length > 0
    ? yearlyGoals.reduce((sum, g) => sum + getGoalProgress(g), 0) / yearlyGoals.length
    : 0;

  if (loading) {
    return <div className="loading-spinner">Loading your goals...</div>;
  }

  return (
    <div className="dashboard">

      {/* ── Hero stats ── */}
      <div className="overview-hero-stats" style={{ marginBottom: 12 }}>
        <div className="hero-stat hero-stat--goals">
          <div className="hero-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span className="hero-stat-value">{yearlyGoals.length}</span>
          <span className="hero-stat-label">Goals</span>
          <span className="hero-stat-sub">this year</span>
        </div>
        <div className="hero-stat hero-stat--quarter">
          <div className="hero-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" opacity="0.4"/>
            </svg>
          </div>
          <span className="hero-stat-value">Q{currentQuarter}</span>
          <span className="hero-stat-label">Current</span>
          <span className="hero-stat-sub">{formatCountdown(daysToQuarterEnd)} left</span>
        </div>
        <div className="hero-stat hero-stat--year">
          <div className="hero-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="hero-stat-value">{currentYear}</span>
          <span className="hero-stat-label">Year</span>
          <span className="hero-stat-sub">{formatCountdown(daysToYearEnd)} left</span>
        </div>
      </div>

      {/* ── At a Glance ── */}
      {yearlyGoals.length > 0 && (
        <div className="glance-grid">
          {yearlyGoals.map((goal) => {
            const pct = Math.round(getGoalProgress(goal));
            let fillClass = 'glance-fill-low';
            if (pct >= 75) fillClass = 'glance-fill-high';
            else if (pct >= 40) fillClass = 'glance-fill-mid';
            return (
              <button
                key={goal.id}
                className="glance-card"
                onClick={() => navigate(`/goal/${goal.id}`)}
              >
                <span className="glance-card-title">{goal.title}</span>
                <div className="glance-card-footer">
                  <div className="glance-card-track">
                    <div className={`glance-card-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="glance-card-pct">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Next check-in ── */}
      {nextCheckIn && (
        <div className="overview-checkin">
          <div className="checkin-badge">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <polyline points="9 16 11 18 15 14"/>
            </svg>
          </div>
          <div className="checkin-info">
            <span className="checkin-label">Next Check-in</span>
            <span className="checkin-date">{nextCheckIn.label} &mdash; {formatDate(nextCheckIn.date)}</span>
          </div>
          {daysToCheckIn !== null && (
            <div className="checkin-countdown">
              <span className="checkin-days-value">{formatCountdown(daysToCheckIn)}</span>
              <span className="checkin-days-label">away</span>
            </div>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="dash-section">
        <p className="dash-section-label">Timeline</p>
        <SeasonTimeline year={currentYear} />
      </div>

      {/* ── Goals ── */}
      {yearlyGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 64 64" width="64" height="64" fill="none">
              <circle cx="20" cy="32" r="8" fill="#6366F1" opacity="0.2"/>
              <circle cx="44" cy="32" r="8" fill="#818CF8" opacity="0.2"/>
              <circle cx="32" cy="18" r="8" fill="#A5B4FC" opacity="0.2"/>
              <circle cx="32" cy="46" r="8" fill="#6366F1" opacity="0.15"/>
            </svg>
          </div>
          <h2>No goals yet</h2>
          <p>Start by creating your first yearly goal. You'll define what success looks like and break it down into quarterly milestones.</p>
          <button className="btn btn-primary" onClick={() => navigate('/add')}>
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="dash-section">
          <div className="dash-section-header">
            <p className="dash-section-label">Goals</p>
            <button className="dash-add-btn" onClick={() => navigate('/add')}>+ Add</button>
          </div>
          <div className="themed-groups">
            {getGroupedGoals().map(([theme, goals]) => {
              const themeAvg = goals.reduce((sum, g) => sum + getGoalProgress(g), 0) / goals.length;
              return (
                <div key={theme} className="theme-section">
                  <div className="theme-section-header">
                    <h2 className="theme-section-title">{theme}</h2>
                    <span className="theme-section-count">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="theme-section-progress">
                    <ProgressBar value={themeAvg} label="Overall" />
                  </div>
                  <div className="goal-rows-list">
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
        </div>
      )}
    </div>
  );
}
