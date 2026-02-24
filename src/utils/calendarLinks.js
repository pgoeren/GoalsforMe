/**
 * Generate a Google Calendar link for a check-in reminder.
 */
export function generateGoogleCalendarLink(title, date, description = '') {
  const startDate = formatCalendarDate(date, 9, 0);  // 9:00 AM
  const endDate = formatCalendarDate(date, 10, 0);   // 10:00 AM

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details: description,
    recur: '', // one-time event
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook Calendar link for a check-in reminder.
 */
export function generateOutlookCalendarLink(title, date, description = '') {
  const d = new Date(date);
  const start = d.toISOString();
  const end = new Date(d.getTime() + 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start,
    enddt: end,
    body: description,
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

function formatCalendarDate(date, hours, minutes) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate an iCal (.ics) file content for a check-in event.
 */
function formatICSDate(date, hours, minutes) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICSContent(title, date, description = '') {
  const dtStart = formatICSDate(date, 9, 0);
  const dtEnd = formatICSDate(date, 10, 0);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@goalsforme`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GoalsForMe//CheckIns//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `UID:${uid}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadICSFile(title, date, description = '') {
  const ics = generateICSContent(title, date, description);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a check-in reminder with links for a specific quarter.
 */
export function getCheckInReminderLinks(year, quarter, goalTitle, checkInDate, type = 'halfway') {
  const typeLabel = type === 'full' ? 'Full Review' : 'Check-in';
  const title = `GoalsForMe: Q${quarter} ${typeLabel} - ${goalTitle}`;
  const description = `Time to review your Q${quarter} ${year} progress for: ${goalTitle}\n\nOpen GoalsForMe to record your check-in.`;

  return {
    google: generateGoogleCalendarLink(title, checkInDate, description),
    outlook: generateOutlookCalendarLink(title, checkInDate, description),
    icsTitle: title,
    icsDescription: description,
  };
}
