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
 * Generate a check-in reminder with links for a specific quarter.
 */
export function getCheckInReminderLinks(year, quarter, goalTitle, checkInDate) {
  const title = `GoalsForMe: Q${quarter} Check-in - ${goalTitle}`;
  const description = `Time to review your Q${quarter} ${year} progress for: ${goalTitle}\n\nOpen GoalsForMe to record your check-in.`;

  return {
    google: generateGoogleCalendarLink(title, checkInDate, description),
    outlook: generateOutlookCalendarLink(title, checkInDate, description),
  };
}
