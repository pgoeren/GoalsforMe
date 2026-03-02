import { useState } from 'react';
import { getAllCheckInDatesForYear } from '../utils/checkInDates';

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

function daysRemaining(targetDate) {
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUTC = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.round((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));
}

function formatShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DAY_LABELS = ['M', 'T', 'W', 'Th', 'F', 'S', 'S'];

export default function SeasonTimeline({ year }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIns = getAllCheckInDatesForYear(year);
  const [open, setOpen] = useState(false);

  // Next upcoming check-in from today (for the collapsible list)
  const nextCheckIn = checkIns.find(ci => daysRemaining(ci.date) >= 0);

  // Monday of the current calendar week
  const weekStart = new Date(today);
  const dow = today.getDay(); // 0=Sun … 6=Sat
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

  // Build 3 week arrays
  const weeks = Array.from({ length: 3 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + wi * 7 + di);
      const checkIn = checkIns.find(ci => {
        const d = new Date(ci.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      }) || null;
      return { date, dayLabel: DAY_LABELS[di], dayNum: date.getDate(), isToday: date.getTime() === today.getTime(), checkIn };
    })
  );

  // Header for each week: countdown to the nearest upcoming check-in from that week's Monday
  function getWeekHeader(weekDays) {
    const weekFirst = weekDays[0].date;
    const weekLast  = weekDays[6].date;
    const ci = checkIns.find(c => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      return d >= weekFirst;
    });
    if (!ci) return '';
    const ciDate = new Date(ci.date);
    ciDate.setHours(0, 0, 0, 0);
    const label = ci.label.replace('Halfway', 'Half');
    if (ciDate <= weekLast) return `This week — ${label}`;
    const weeksAway = Math.ceil(Math.round((ciDate - weekFirst) / 86400000) / 7);
    return `${weeksAway}w to ${label}`;
  }

  return (
    <div className="week-timeline">

      {/* 3-week strip */}
      <div className="week-strip">
        {weeks.map((weekDays, wi) => {
          const annotations = weekDays.filter(d => d.checkIn).map(d => d.checkIn);
          return (
            <div key={wi} className="week-block">
              <div className="week-block-header">{getWeekHeader(weekDays)}</div>
              <div className="week-days">
                {weekDays.map((day, di) => (
                  <div key={di} className={`day-cell${day.isToday ? ' today' : ''}`}>
                    <span className="day-label">{day.dayLabel}</span>
                    <div className="day-marker">
                      {day.checkIn
                        ? <span className={`day-checkin-dot ${day.checkIn.type}`} />
                        : <span className="day-dot" />}
                    </div>
                    <span className="day-num">{day.dayNum}</span>
                  </div>
                ))}
              </div>
              {annotations.length > 0 && (
                <div className="week-annotations">
                  {annotations.map((ci, i) => (
                    <span key={i} className={`week-annotation ${ci.type}`}>
                      {ci.type === 'halfway' ? '◆' : '●'} {ci.label} · {formatShort(ci.date)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle for full check-in list */}
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
