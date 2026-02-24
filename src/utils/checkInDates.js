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
 * Calculate the end-of-quarter Wednesday for a given year and quarter.
 * Lands on the Wednesday closest to the last day of the quarter.
 */
export function getEndOfQuarterWednesday(year, quarter) {
  // Last day of each quarter
  const ends = {
    1: new Date(year, 2, 31),   // Mar 31
    2: new Date(year, 5, 30),   // Jun 30
    3: new Date(year, 8, 30),   // Sep 30
    4: new Date(year, 11, 31),  // Dec 31
  };

  const end = ends[quarter];
  const dayOfWeek = end.getDay();
  let diff = 3 - dayOfWeek;

  if (diff > 3) diff -= 7;
  if (diff < -3) diff += 7;

  end.setDate(end.getDate() + diff);
  return end;
}

/**
 * Get all four mid-quarter check-in dates for a given year.
 */
export function getCheckInDatesForYear(year) {
  return [1, 2, 3, 4].map(q => ({
    quarter: q,
    date: getMidQuarterWednesday(year, q),
    label: `Q${q} Check-in`,
    type: 'halfway',
  }));
}

/**
 * Get all check-in dates (both halfway and full) for a given year.
 * Returns 8 dates sorted chronologically.
 */
export function getAllCheckInDatesForYear(year) {
  const dates = [];
  for (const q of [1, 2, 3, 4]) {
    dates.push({
      quarter: q,
      date: getMidQuarterWednesday(year, q),
      label: `Q${q} Halfway`,
      type: 'halfway',
    });
    dates.push({
      quarter: q,
      date: getEndOfQuarterWednesday(year, q),
      label: `Q${q} Full`,
      type: 'full',
    });
  }
  return dates.sort((a, b) => a.date - b.date);
}

/**
 * Get the next upcoming check-in date from today (includes both halfway and full).
 */
export function getNextCheckIn(year) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = getAllCheckInDatesForYear(year);
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
