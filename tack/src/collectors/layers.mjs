// What a scan runs after the transcripts, repository identity and git history: the session-unit link
// (layer 2), the lane-run folders (optional, when the folder exists) and the self-assessment logs (layer 3).
import { linkUnits } from './units.mjs';
import { collectLanes, defaultLaneRoot } from './lane-run/collect.mjs';
import { collectLogs } from './log/collect.mjs';
import { importsRoot } from '../importers/jjodel-log.mjs';

export function collectLayers(db, { lanes = defaultLaneRoot(), imports = importsRoot(), now = Date.now() } = {}) {
  const units = linkUnits(db);
  const lane = collectLanes(db, lanes, now);
  const logs = collectLogs(db, { imports });
  return { units, lanes: lane, logs };
}
