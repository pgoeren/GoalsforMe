import { useState } from 'react';
import { getAllCheckInDatesForYear, getCurrentQuarter } from '../utils/checkInDates';

function formatICSDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function buildICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GoalsForMe//CheckIns//EN',
  ];
  for (const ev of events) {
    const dtStart = formatICSDate(ev.date);
    const next = new Date(ev.date);
    next.setDate(next.getDate() + 1);
    const dtEnd = formatICSDate(next);
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ev.label} - Goal Review`,
      `DESCRIPTION:Time to review your quarterly goals and track progress.`,
      `UID:goalsforme-${ev.quarter}-${ev.type}-${ev.date.getFullYear()}@goalsforme`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadICS(events, filename) {
  const ics = buildICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  const checkIns = getAllCheckInDatesForYear(year);
  const currentQ = getCurrentQuarter();
  const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
  const totalDays = isLeap ? 366 : 365;
  const todayPct = (dayOfYear(today) / totalDays) * 100;

  const quarterStarts = [
    { pct: 0, label: 'Jan 1' },
    { pct: (dayOfYear(new Date(year, 3, 1)) / totalDays) * 100, label: 'Apr 1' },
    { pct: (dayOfYear(new Date(year, 6, 1)) / totalDays) * 100, label: 'Jul 1' },
    { pct: (dayOfYear(new Date(year, 9, 1)) / totalDays) * 100, label: 'Oct 1' },
    { pct: 100, label: 'Dec 31' },
  ];

  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];

  const [open, setOpen] = useState(false);

  // Find the next upcoming check-in
  const nextCheckIn = checkIns.find(ci => daysRemaining(ci.date) >= 0);

  return (
    <div className={`stl ${open ? 'stl-open' : ''}`}>
      <div className="stl-head">
        <span className="stl-title">{year} Season Progress</span>
        <span className="stl-quarter">Q{currentQ} &middot; {seasons[currentQ - 1]}</span>
      </div>

      {/* Track — always visible */}
      <div className="stl-track-wrap">
        <div className="stl-track">
          <div className="stl-fill" style={{ width: `${todayPct}%` }} />

          {quarterStarts.map((qs, i) => (
            <div key={i} className="stl-tick" style={{ left: `${qs.pct}%` }} />
          ))}

          {checkIns.map((ci) => {
            const pct = (dayOfYear(ci.date) / totalDays) * 100;
            const days = daysRemaining(ci.date);
            const isPast = days < 0;
            const isNext = nextCheckIn && ci.quarter === nextCheckIn.quarter && ci.type === nextCheckIn.type;
            return (
              <div
                key={`${ci.quarter}-${ci.type}`}
                className={`stl-checkin ${isPast ? 'past' : ''} ${isNext ? 'next' : ''} stl-checkin-${ci.type}`}
                style={{ left: `${pct}%` }}
              >
                <div className={ci.type === 'full' ? 'stl-circle' : 'stl-diamond'} />
              </div>
            );
          })}

          <div className="stl-needle" style={{ left: `${todayPct}%` }}>
            <div className="stl-needle-line" />
            <div className="stl-needle-head" />
          </div>
        </div>

        <div className="stl-quarters">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
            <div key={q} className={`stl-qlabel ${i + 1 === currentQ ? 'active' : ''}`}>
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* Toggle for check-in details */}
      <button className="stl-toggle" onClick={() => setOpen(o => !o)} type="button">
        <span>{open ? 'Hide' : 'Show'} Check-in Dates</span>
        <span className={`stl-chevron ${open ? 'stl-chevron-open' : ''}`}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {/* Collapsible check-in list + iCal */}
      {open && (
        <div className="stl-checkins">
          {checkIns.map((ci) => {
            const days = daysRemaining(ci.date);
            const isPast = days < 0;
            const isNext = nextCheckIn && ci.quarter === nextCheckIn.quarter && ci.type === nextCheckIn.type;
            const icon = ci.type === 'full' ? '●' : '◆';
            return (
              <div key={`${ci.quarter}-${ci.type}`} className={`stl-ci-row ${isPast ? 'past' : ''} ${isNext ? 'next' : ''}`}>
                <span className={`stl-ci-diamond-sm stl-ci-icon-${ci.type}`}>{isPast ? '✓' : icon}</span>
                <span className="stl-ci-label">{ci.label}</span>
                <span className="stl-ci-date">{formatShort(ci.date)}</span>
                <span className="stl-ci-badge">
                  {isPast ? 'Done' : days === 0 ? 'Today!' : `${days}d`}
                </span>
                {!isPast && (
                  <button
                    className="stl-ci-cal"
                    onClick={() => downloadICS([ci], `checkin-q${ci.quarter}-${ci.type}.ics`)}
                    title={`iCal — ${ci.label}`}
                  >
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                      <path d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25A1.75 1.75 0 0118 5.75v10.5A1.75 1.75 0 0116.25 18H3.75A1.75 1.75 0 012 16.25V5.75A1.75 1.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-2 5.5v8.75c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V7.5H3.75zm2.5 2h2.5v2.5h-2.5v-2.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="stl-cal-all"
            onClick={() => downloadICS(
              checkIns.filter(ci => daysRemaining(ci.date) >= 0),
              `goalsforme-checkins-${year}.ics`
            )}
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25A1.75 1.75 0 0118 5.75v10.5A1.75 1.75 0 0116.25 18H3.75A1.75 1.75 0 012 16.25V5.75A1.75 1.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-2 5.5v8.75c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V7.5H3.75zm2.5 2h2.5v2.5h-2.5v-2.5z"/>
            </svg>
            iCal — Add All Check-ins
          </button>
        </div>
      )}
    </div>
  );
}
