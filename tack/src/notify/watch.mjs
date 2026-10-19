// The watcher: what runs the notifier, in the board server or standalone (`tack notify --watch`). Every tick
// (20 s) the holder of the store's lease scans the transcripts, reads the lane folders, stores the minute's
// load sample and evaluates the rules; every 30 minutes it also re-reads repository identity, git history and
// the unpushed counts. A process without the lease only renews its attempt: one notifier per store.
import { scan } from '../collectors/claude-code/collect.mjs';
import { identify } from '../collectors/git/identity.mjs';
import { collectGit, collectUnpushed } from '../collectors/git/collect.mjs';
import { collectLanes, defaultLaneRoot } from '../collectors/lane-run/collect.mjs';
import { settingsResolver, userSettingsPath } from '../settings/settings.mjs';
import { storeMinute } from '../host/load.mjs';
import { notifyTick, releaseLease, takeLease } from './notifier.mjs';

export const TICK_MS = 20_000;
export const FULL_MS = 30 * 60e3;

/** Whether the environment turns the notifier off (TACK_NOTIFY=off). */
export const notifyDisabled = () => process.env.TACK_NOTIFY === 'off';

export function startWatcher({ db, root, laneRoot = defaultLaneRoot(), sampler = null, transports, boardUrl, baseRepo = null,
  user = userSettingsPath(), tickMs = TICK_MS, fullMs = FULL_MS, now = Date.now, pid = process.pid, log = () => {}, collect = true } = {}) {
  let lastFull = 0;
  let busy = false;
  let leader = false;
  async function tick() {
    if (busy) return null;
    busy = true;
    try {
      const t = now();
      leader = takeLease(db, pid, t);
      if (!leader) return { leader };
      const settingsFor = settingsResolver(db, { user });
      if (collect) {
        scan(db, root);
        if (t - lastFull >= fullMs) { identify(db); collectGit(db); collectUnpushed(db); lastFull = t; }
        collectLanes(db, laneRoot, t, { limitMs: (repo) => settingsFor(repo).value('limits.laneMinutes') * 60e3 });
      }
      const load = sampler?.latest() ?? null;
      if (load) storeMinute(db, load);
      const st = await notifyTick(db, { now: t, settingsFor, transports, load, baseRepo, boardUrl, log });
      if (st.delivered || st.failed || st.digested) log(`notify: delivered ${st.delivered}, failed ${st.failed}, digested ${st.digested}`);
      return { leader, ...st };
    } catch (err) {
      log(`notify: tick failed: ${err.stack ?? err}`);
      return { leader, error: String(err.message ?? err) };
    } finally {
      busy = false;
    }
  }
  const timer = setInterval(tick, tickMs);
  timer.unref?.();
  // A leader also stores the minute's sample between ticks, so a minute is never skipped for a slow tick.
  if (sampler) sampler.onSample = (x) => { if (leader) { try { storeMinute(db, x); } catch { /* busy store: next sample */ } } };
  return {
    tick,
    isLeader: () => leader,
    stop() { clearInterval(timer); if (sampler) sampler.onSample = null; try { releaseLease(db, pid); } catch { /* store closed */ } },
  };
}
