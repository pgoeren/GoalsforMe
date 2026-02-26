import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalContext';
import {
  getQuarterlyGoals,
  subscribeToQuarterlyGoals,
  updateQuarterlyGoal,
} from '../firebase/goalService';
import ProgressBar from '../components/ProgressBar';
import CheckInReminder from '../components/CheckInReminder';
import ChangeHistory from '../components/ChangeHistory';
import ThemePicker, { THEME_COLORS } from '../components/ThemePicker';
import { getAllCheckInDatesForYear, getCurrentQuarter } from '../utils/checkInDates';


export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { yearlyGoals, updateYearlyGoal, deleteYearlyGoal } = useGoals();
  const [quarterly, setQuarterly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quarters');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const pendingUpdatesRef = useRef(new Set());

  const goal = yearlyGoals.find(g => g.id === id);

  // Real-time subscription for quarterly goals — syncs across devices
  useEffect(() => {
    if (!goal) return;
    setLoading(true);

    const unsubscribe = subscribeToQuarterlyGoals(
      id,
      (goals) => {
        // Don't overwrite fields that have pending optimistic updates
        if (pendingUpdatesRef.current.size > 0) {
          setQuarterly(prev => {
            const prevMap = new Map(prev.map(q => [q.id, q]));
            return goals.map(g => {
              if (pendingUpdatesRef.current.has(g.id)) {
                // Keep the optimistic version for in-flight updates
                return prevMap.get(g.id) || g;
              }
              return g;
            });
          });
        } else {
          setQuarterly(goals);
        }
        setLoading(false);
      },
      () => {
        // Firestore unavailable — fall back to one-time fetch
        getQuarterlyGoals(id).then(goals => {
          setQuarterly(goals);
          setLoading(false);
        });
      }
    );

    if (!unsubscribe) {
      // Firestore not available, one-time fetch
      getQuarterlyGoals(id).then(goals => {
        setQuarterly(goals);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id, goal?.id]);

  if (!goal) {
    return (
      <div className="empty-state">
        <h2>Goal not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  const checkInDates = getAllCheckInDatesForYear(goal.year);
  const currentQ = getCurrentQuarter();

  const getOverallProgress = () => {
    if (quarterly.length === 0) return 0;
    if (goal.kpiType === 'milestone') {
      const completed = quarterly.filter(q => q.status === 'completed').length;
      return (completed / quarterly.length) * 100;
    }
    const total = quarterly.reduce(
      (sum, q) => sum + (q.halfwayProgress || 0) + (q.fullProgress || 0),
      0
    );
    return goal.kpiTarget > 0 ? Math.min(100, (total / goal.kpiTarget) * 100) : 0;
  };

  const handleQuarterUpdate = async (qId, updates) => {
    // Optimistic update — show the change instantly so inputs don't revert
    const previous = quarterly;
    pendingUpdatesRef.current.add(qId);
    setQuarterly(prev =>
      prev.map(q => (q.id === qId ? { ...q, ...updates } : q))
    );
    try {
      await updateQuarterlyGoal(qId, updates);
    } catch {
      setQuarterly(previous);
    } finally {
      pendingUpdatesRef.current.delete(qId);
    }
  };

  const startEdit = () => {
    setEditForm({
      title: goal.title,
      description: goal.description,
      successCriteria: goal.successCriteria || '',
      theme: goal.theme || '',
      themeColor: goal.themeColor || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateYearlyGoal(id, editForm);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this goal and all quarterly goals? This cannot be undone.')) {
      await deleteYearlyGoal(id);
      navigate('/');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="goal-detail">
      <button className="btn-back" onClick={() => navigate('/')}>
        &larr; Back
      </button>

      <div className="goal-detail-header">
        {editing ? (
          <div className="edit-form">
            <input
              className="form-input"
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="form-input form-textarea"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <textarea
              className="form-input form-textarea"
              placeholder="Success criteria..."
              value={editForm.successCriteria}
              onChange={e => setEditForm(f => ({ ...f, successCriteria: e.target.value }))}
              rows={2}
            />
            <ThemePicker
              value={editForm.theme}
              onChange={theme => setEditForm(f => ({ ...f, theme }))}
              color={editForm.themeColor}
              onColorChange={themeColor => setEditForm(f => ({ ...f, themeColor }))}
            />
            <div className="edit-actions">
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="goal-title-row">
              <h1>{goal.title}</h1>
              <span className="goal-year-badge">{goal.year}</span>
              {goal.theme && (
                <span
                  className="goal-theme-badge"
                  style={{ backgroundColor: goal.themeColor || THEME_COLORS[goal.theme] || undefined, color: (goal.themeColor || THEME_COLORS[goal.theme]) ? '#fff' : undefined }}
                >
                  {goal.theme}
                </span>
              )}
            </div>
            <p className="goal-description">{goal.description}</p>
            {goal.successCriteria && (
              <p className="success-criteria">
                <strong>Success looks like:</strong> {goal.successCriteria}
              </p>
            )}
            <div className="goal-detail-actions">
              <button className="btn btn-outline btn-sm" onClick={startEdit}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          </>
        )}
      </div>

      <ProgressBar value={getOverallProgress()} label="Overall Progress" size="large" />

      <div className="detail-tabs">
        <button
          className={`tab ${activeTab === 'quarters' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarters')}
        >
          Quarters
        </button>
        <button
          className={`tab ${activeTab === 'checkins' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkins')}
        >
          Check-ins
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'quarters' && (
        <div className="quarters-list">
          {quarterly.map(q => (
            <div key={q.id} className={`quarter-card ${q.quarter === currentQ ? 'current' : ''}`}>
              <div className="quarter-card-header">
                <h3>
                  Q{q.quarter}
                  {q.quarter === currentQ && <span className="current-badge">Current</span>}
                </h3>
              </div>
              <p className="quarter-title">{q.title}</p>
              {q.description && <p className="quarter-desc">{q.description}</p>}

              {goal.kpiType !== 'milestone' && (
                <div className="quarter-inputs-row">
                  <div className="quarter-checkin-input">
                    <label className="form-label">Halfway Check-in</label>
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      value={q.halfwayProgress || 0}
                      onChange={e =>
                        handleQuarterUpdate(q.id, { halfwayProgress: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="quarter-checkin-input">
                    <label className="form-label">Full Check-in</label>
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      value={q.fullProgress || 0}
                      onChange={e =>
                        handleQuarterUpdate(q.id, { fullProgress: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="quarter-checkin-total">
                    <label className="form-label">Q{q.quarter} Total</label>
                    <span className="checkin-total-value">
                      {(q.halfwayProgress || 0) + (q.fullProgress || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'checkins' && (
        <div className="checkins-list">
          <p className="checkin-info">
            Set a calendar reminder so you don't miss your strategic check-in days.
          </p>
          {checkInDates.map((ci) => (
            <CheckInReminder
              key={`${ci.quarter}-${ci.type}`}
              year={goal.year}
              quarter={ci.quarter}
              goalTitle={goal.title}
              checkInDate={ci.date}
              type={ci.type}
            />
          ))}
        </div>
      )}

      {activeTab === 'history' && <ChangeHistory entityId={id} />}
    </div>
  );
}
