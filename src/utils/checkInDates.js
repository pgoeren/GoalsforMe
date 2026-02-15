/**
 * Calculate the mid-quarter Wednesday for a given year and quarter.
 * Check-in days land on the Wednesday closest to the midpoint of each quarter.
 */
export function getMidQuarterWednesday(year, quarter) {
  // Midpoint of each quarter (approximate)
  const midpoints = {
    1: new Date(year, 1, 14),  // Feb 14
    2: new Date(year, 4, 15),  // May 15
    3: new Date(year, 7, 15),  // Aug 15
    4: new Date(year, 10, 14), // Nov 14
  };

  const mid = midpoints[quarter];
  const dayOfWeek = mid.getDay(); // 0=Sun, 3=Wed
  let diff = 3 - dayOfWeek;

  // Pick the nearest Wednesday (within -3 to +3 days)
  if (diff > 3) diff -= 7;
  if (diff < -3) diff += 7;

  mid.setDate(mid.getDate() + diff);
  return mid;
}

/**
 * Get all four check-in dates for a given year.
 */
export function getCheckInDatesForYear(year) {
  return [1, 2, 3, 4].map(q => ({
    quarter: q,
    date: getMidQuarterWednesday(year, q),
    label: `Q${q} Check-in`,
  }));
}

/**
 * Get the next upcoming check-in date from today.
 */
export function getNextCheckIn(year) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = getCheckInDatesForYear(year);
  return dates.find(d => d.date >= today) || dates[0];
}

/**
 * Format a date as a readable string.
 */
export function formatDate(date) {
  if (typeof date === 'string') date = new Date(date);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get the current quarter (1-4).
 */
export function getCurrentQuarter() {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}
