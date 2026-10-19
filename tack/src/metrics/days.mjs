// Calendar days. A day is the local calendar day of the machine running tack (TZ), the day the
// person at the keyboard lived; { utc: true } switches every metric to UTC days.

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' of an epoch ms, local by default. */
export function dayOf(ms, { utc = false } = {}) {
  const d = new Date(ms);
  return utc
    ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** [start, end) in epoch ms of a 'YYYY-MM-DD' day; a local day may last 23 or 25 hours. */
export function dayBounds(day, { utc = false } = {}) {
  const [y, m, d] = day.split('-').map(Number);
  return utc ? [Date.UTC(y, m - 1, d), Date.UTC(y, m - 1, d + 1)] : [new Date(y, m - 1, d).getTime(), new Date(y, m - 1, d + 1).getTime()];
}

/** Every day from the day of startMs to the day of endMs, inclusive. */
export function daysBetween(startMs, endMs, opts = {}) {
  const out = [];
  let day = dayOf(startMs, opts);
  const last = dayOf(endMs, opts);
  while (day <= last) {
    out.push(day);
    day = dayOf(dayBounds(day, opts)[1], opts);
  }
  return out;
}
