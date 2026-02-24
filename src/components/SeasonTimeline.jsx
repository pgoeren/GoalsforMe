import { getCheckInDatesForYear, getCurrentQuarter } from '../utils/checkInDates';

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
}

function daysRemaining(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
}

function formatShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SeasonTimeline({ year }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIns = getCheckInDatesForYear(year);
  const currentQ = getCurrentQuarter();
  const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
  const totalDays = isLeap ? 366 : 365;
  const todayPct = (dayOfYear(today) / totalDays) * 100;

  // Build the key events list: quarter starts + check-ins
  const quarterStarts = [
    { pct: 0, label: 'Jan 1' },
    { pct: (dayOfYear(new Date(year, 3, 1)) / totalDays) * 100, label: 'Apr 1' },
    { pct: (dayOfYear(new Date(year, 6, 1)) / totalDays) * 100, label: 'Jul 1' },
    { pct: (dayOfYear(new Date(year, 9, 1)) / totalDays) * 100, label: 'Oct 1' },
    { pct: 100, label: 'Dec 31' },
  ];

  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];

  return (
    <div className="stl">
      <div className="stl-head">
        <span className="stl-title">{year} Season Progress</span>
        <span className="stl-quarter">Q{currentQ} &middot; {seasons[currentQ - 1]}</span>
      </div>

      {/* The track */}
      <div className="stl-track-wrap">
        <div className="stl-track">
          {/* Filled progress */}
          <div className="stl-fill" style={{ width: `${todayPct}%` }} />

          {/* Quarter boundary ticks */}
          {quarterStarts.map((qs, i) => (
            <div key={i} className="stl-tick" style={{ left: `${qs.pct}%` }} />
          ))}

          {/* Check-in diamonds */}
          {checkIns.map((ci) => {
            const pct = (dayOfYear(ci.date) / totalDays) * 100;
            const days = daysRemaining(ci.date);
            const isPast = days < 0;
            const isNext = !isPast && checkIns.filter(c => daysRemaining(c.date) >= 0)[0]?.quarter === ci.quarter;
            return (
              <div
                key={ci.quarter}
                className={`stl-checkin ${isPast ? 'past' : ''} ${isNext ? 'next' : ''}`}
                style={{ left: `${pct}%` }}
              >
                <div className="stl-diamond" />
              </div>
            );
          })}

          {/* Today needle */}
          <div className="stl-needle" style={{ left: `${todayPct}%` }}>
            <div className="stl-needle-line" />
            <div className="stl-needle-head" />
          </div>
        </div>

        {/* Quarter labels row */}
        <div className="stl-quarters">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
            <div key={q} className={`stl-qlabel ${i + 1 === currentQ ? 'active' : ''}`}>
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* Check-in list below */}
      <div className="stl-checkins">
        {checkIns.map((ci) => {
          const days = daysRemaining(ci.date);
          const isPast = days < 0;
          const isNext = !isPast && checkIns.filter(c => daysRemaining(c.date) >= 0)[0]?.quarter === ci.quarter;
          return (
            <div key={ci.quarter} className={`stl-ci-row ${isPast ? 'past' : ''} ${isNext ? 'next' : ''}`}>
              <span className="stl-ci-diamond-sm">{isPast ? '✓' : '◆'}</span>
              <span className="stl-ci-label">{ci.label}</span>
              <span className="stl-ci-date">{formatShort(ci.date)}</span>
              <span className="stl-ci-badge">
                {isPast ? 'Done' : days === 0 ? 'Today!' : `${days}d`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
