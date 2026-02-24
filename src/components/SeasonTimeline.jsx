import { getCheckInDatesForYear, getCurrentQuarter } from '../utils/checkInDates';

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];

function daysRemaining(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SeasonTimeline({ year }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIns = getCheckInDatesForYear(year);
  const currentQuarter = getCurrentQuarter();
  const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const todayPosition = (dayOfYear(today) / totalDays) * 100;

  // Quarter boundaries (approximate start of each quarter as %)
  const quarterBounds = [0, 25, 50, 75, 100];

  return (
    <div className="season-timeline">
      <div className="timeline-header">
        <span className="timeline-title">Year at a Glance</span>
        <span className="timeline-year">{year}</span>
      </div>

      <div className="timeline-track-container">
        {/* Quarter background segments */}
        <div className="timeline-track">
          {QUARTER_LABELS.map((label, i) => (
            <div
              key={label}
              className={`timeline-quarter ${i + 1 === currentQuarter ? 'current' : ''}`}
              style={{ left: `${quarterBounds[i]}%`, width: '25%' }}
            />
          ))}

          {/* Quarter divider lines */}
          {[25, 50, 75].map(pos => (
            <div key={pos} className="timeline-divider" style={{ left: `${pos}%` }} />
          ))}

          {/* Check-in markers */}
          {checkIns.map((ci, i) => {
            const pos = (dayOfYear(ci.date) / totalDays) * 100;
            const days = daysRemaining(ci.date);
            const isPast = days < 0;
            const isNext = !isPast && (i === 0 || daysRemaining(checkIns[i - 1].date) < 0);

            return (
              <div
                key={ci.quarter}
                className={`timeline-checkin ${isPast ? 'past' : ''} ${isNext ? 'next' : ''}`}
                style={{ left: `${pos}%` }}
              >
                <div className="checkin-pin" />
                <div className="checkin-tooltip">
                  <strong>{ci.label}</strong>
                  <span>{formatShortDate(ci.date)}</span>
                  {!isPast && <span className="checkin-days">{days === 0 ? 'Today!' : `${days}d away`}</span>}
                  {isPast && <span className="checkin-days past-text">Done</span>}
                </div>
              </div>
            );
          })}

          {/* Today marker */}
          <div className="timeline-today" style={{ left: `${todayPosition}%` }}>
            <div className="today-line" />
            <div className="today-dot" />
            <span className="today-label">Today</span>
          </div>

          {/* Progress fill */}
          <div className="timeline-progress" style={{ width: `${todayPosition}%` }} />
        </div>

        {/* Quarter labels below */}
        <div className="timeline-labels">
          {QUARTER_LABELS.map((label, i) => (
            <div key={label} className={`timeline-label ${i + 1 === currentQuarter ? 'current' : ''}`}>
              <span className="label-quarter">{label}</span>
              <span className="label-season">{QUARTER_SEASONS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
