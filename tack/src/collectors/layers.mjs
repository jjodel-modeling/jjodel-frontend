// What a scan runs after the transcripts, repository identity and git history: the session-unit link
// (layer 2), the lane-run folders (optional, when the folder exists) and the self-assessment logs (layer 3).
import { linkUnits } from './units.mjs';
import { traceSource } from './active.mjs';
import { collectLogs } from './log/collect.mjs';
import { importsRoot } from '../importers/jjodel-log.mjs';
import { settingsResolver } from '../settings/settings.mjs';

/** The lane time limit of a repository: limits.laneMinutes of its tack.json, 90 minutes by default. */
export function laneLimit(db, { user } = {}) {
  const settingsFor = settingsResolver(db, user ? { user } : {});
  return (repo) => settingsFor(repo).value('limits.laneMinutes') * 60e3;
}

export function collectLayers(db, { lanes = traceSource.root(), imports = importsRoot(), now = Date.now(), limitMs = laneLimit(db) } = {}) {
  const units = linkUnits(db);
  const lane = traceSource.collect(db, lanes, now, { limitMs });
  const logs = collectLogs(db, { imports });
  return { units, lanes: lane, logs };
}
