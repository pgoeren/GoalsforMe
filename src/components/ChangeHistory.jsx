import { useState, useEffect } from 'react';
import { getChangeLog, getAllChanges } from '../firebase/goalService';
import { formatDate } from '../utils/checkInDates';

const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  kpiType: 'KPI Type',
  kpiTarget: 'KPI Target',
  kpiUnit: 'KPI Unit',
  kpiMilestone: 'Milestone',
  successCriteria: 'Success Criteria',
  status: 'Status',
  kpiProgress: 'Progress',
  checkInNotes: 'Check-in Notes',
  checkInCompleted: 'Check-in Status',
};

export default function ChangeHistory({ entityId }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = entityId ? await getChangeLog(entityId) : await getAllChanges();
      setChanges(data);
      setLoading(false);
    }
    load();
  }, [entityId]);

  if (loading) return <div className="loading-spinner">Loading history...</div>;
  if (changes.length === 0) return <p className="empty-text">No changes recorded yet.</p>;

  return (
    <div className="change-history">
      {changes.map(entry => (
        <div key={entry.id} className="change-entry">
          <div className="change-meta">
            <span className="change-entity">{entry.entityTitle}</span>
            <span className="change-date">{formatDate(entry.changedAt)}</span>
          </div>
          <ul className="change-list">
            {entry.changes.map((c, i) => (
              <li key={i} className="change-item">
                <span className="change-field">{FIELD_LABELS[c.field] || c.field}</span>
                <span className="change-old">{formatValue(c.oldValue)}</span>
                <span className="change-arrow">&rarr;</span>
                <span className="change-new">{formatValue(c.newValue)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatValue(val) {
  if (val === null || val === undefined) return '(empty)';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}
