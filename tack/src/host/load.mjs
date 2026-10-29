// The host load meter. One sampler per process reads os.loadavg() every 5 seconds into a ring of 60
// samples (5 minutes) that the board serves at GET /api/load; the process holding the store's notify lease
// also stores one sample per minute in host_load (INSERT OR IGNORE on the minute), so a board and
// `tack notify --watch` on the same store never store twice. No memory metric.
import { cpus, loadavg as osLoadavg } from 'node:os';

export const RING = 60;
export const SAMPLE_MS = 5000;

export const HOST_COLUMN_SOURCES = {
  host_load: {
    minute_ms: 'sample time floored to the minute', load1: 'os.loadavg()[0]', load5: 'os.loadavg()[1]', load15: 'os.loadavg()[2]',
    cores: 'os.cpus().length', running_lanes: 'lanes rows with live = 1 (count)',
  },
};

/** A sampler: sample() pushes one reading and drops the oldest beyond size; start() samples on an unref'd timer. */
export function createSampler({ loadavg = osLoadavg, cores = () => cpus().length, running = () => 0, now = Date.now, size = RING } = {}) {
  const ring = [];
  let timer = null;
  const s = {
    sample() {
      const [load1, load5, load15] = loadavg();
      const x = { t: now(), load1, load5, load15, cores: cores(), running: running() };
      ring.push(x);
      if (ring.length > size) ring.splice(0, ring.length - size);
      s.onSample?.(x);
      return x;
    },
    samples: () => ring.slice(),
    latest: () => ring.at(-1) ?? null,
    start(ms = SAMPLE_MS) {
      if (timer) return s;
      s.sample();
      timer = setInterval(() => { try { s.sample(); } catch { /* a failed reading is skipped */ } }, ms);
      timer.unref?.();
      return s;
    },
    stop() { clearInterval(timer); timer = null; },
    onSample: null,
  };
  return s;
}

/** Stores a sample as the one of its minute; 1 when it was the first of that minute, 0 otherwise. */
export function storeMinute(db, x) {
  const minute = Math.floor(x.t / 60e3) * 60e3;
  return db.prepare('INSERT OR IGNORE INTO host_load (minute_ms, load1, load5, load15, cores, running_lanes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(minute, x.load1, x.load5, x.load15, x.cores, x.running).changes;
}

export const runningLanes = (db) => db.prepare('SELECT COUNT(*) AS n FROM lanes WHERE live = 1').get().n;

/** Lane starts and ends inside (from, to]: [{ t, kind: 'start' | 'end' }], in time order. */
export function laneTicks(db, from, to) {
  const rows = db.prepare(`SELECT started_ms AS t, 'start' AS kind FROM lanes WHERE started_ms > ? AND started_ms <= ?
    UNION ALL SELECT end_ms AS t, 'end' AS kind FROM lanes WHERE end_ms > ? AND end_ms <= ? ORDER BY t`).all(from, to, from, to);
  return rows.map((r) => ({ t: r.t, kind: r.kind }));
}
