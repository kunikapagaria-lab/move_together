// The app's users are in India, so all day-boundary logic (which day a task
// completion belongs to, streak calculation, the midnight reset check) is
// anchored to IST rather than whatever timezone the server process happens to
// run in. Node's local Date getters (getFullYear/getMonth/getDate) reflect the
// SERVER's system timezone - on most hosts (including Render) that's UTC, which
// runs up to 5.5 hours behind IST. Using them directly meant "today" could
// still be yesterday from a user's own clock for hours after their local
// midnight had already passed.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const toISTDateStr = (utcMs: number): string => {
  const d = new Date(utcMs + IST_OFFSET_MS);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
};

export const getTodayStr = (): string => toISTDateStr(Date.now());

// daysAgo=1 gives yesterday's IST date string, etc.
export const getDateStrDaysAgo = (daysAgo: number): string => toISTDateStr(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

// Converts any timestamp (e.g. a challenge's startDate) to the IST calendar
// date string it falls on, for comparing against date strings like the above.
export const toISTDateStrFrom = (date: Date | string): string => toISTDateStr(new Date(date).getTime());
