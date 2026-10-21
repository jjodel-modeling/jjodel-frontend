// The trace-source boundary (docs/design-monitor-vs-spec.md §2.4, §7 S1). A trace source is the adapter of one tool's
// traces: it may know the tool's file layout and its own id syntax; the core reaches it through these members only.
//
//   name                          the adapter's name
//   ids                           its id syntax: unit (a whole unit id, anchored), unitForm (the same in words),
//                                 ref (a unit or conversation id a ticket was found in, anchored at the start), refForm
//   root()                        where its traces live by default
//   units(root)                   the unit ids found under root, sorted
//   read(root, id, now)           what one unit says, in memory; nothing is written
//   live(unit)                    true while the unit's process runs (unit: what read returned)
//   lastOutcome(unit)             the outcome word of its last turn, 'unparsed' or 'none'
//   collect(db, root, now, opts)  reads every unit under root into the store; returns the counts of the scan
//
// The active source is chosen in active.mjs.

export const TRACE_SOURCE_MEMBERS = {
  name: 'string', ids: 'object', root: 'function', units: 'function', read: 'function', live: 'function',
  lastOutcome: 'function', collect: 'function',
};

/** The adapter, frozen, after checking it carries every member of the boundary; throws a TypeError naming the first missing one. */
export function defineTraceSource(source) {
  for (const [k, type] of Object.entries(TRACE_SOURCE_MEMBERS)) {
    if (typeof source[k] !== type || source[k] === null) throw new TypeError(`trace source ${source.name ?? '?'}: ${k} must be a ${type}`);
  }
  for (const k of ['unit', 'ref']) {
    if (!(source.ids[k] instanceof RegExp)) throw new TypeError(`trace source ${source.name}: ids.${k} must be a RegExp`);
  }
  for (const k of ['unitForm', 'refForm']) {
    if (typeof source.ids[k] !== 'string') throw new TypeError(`trace source ${source.name}: ids.${k} must be a string`);
  }
  return Object.freeze({ ...source, ids: Object.freeze({ ...source.ids }) });
}
