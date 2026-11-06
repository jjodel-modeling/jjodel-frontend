// lane-run behind the trace-source boundary (../source.mjs): its lane folders are the units, collect.mjs reads them,
// config.mjs holds the id syntax.
import { join } from 'node:path';
import { defineTraceSource } from '../source.mjs';
import { LANE_RUN_IDS } from './config.mjs';
import { collectLanes, defaultLaneRoot, laneIds, readLane } from './collect.mjs';

export const laneRunSource = defineTraceSource({
  name: 'lane-run',
  ids: LANE_RUN_IDS,
  root: defaultLaneRoot,
  units: laneIds,
  read: (root, id, now = Date.now()) => readLane(join(root, id), now),
  live: (lane) => lane.live,
  lastOutcome: (lane) => lane.lastOutcome,
  collect: collectLanes,
});
