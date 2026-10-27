// The trace source this Tack reads (source.mjs). The core asks here, never an adapter by its path: lane-run is the
// only adapter today, and another one is chosen here, not in the callers.
import { laneRunSource } from './lane-run/source.mjs';

export const traceSource = laneRunSource;
