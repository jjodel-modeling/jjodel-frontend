import type {DGraphElement, Dictionary, GObject, Pointer} from "../joiner";

// Registry of mounted graph-element component instances, keyed by node id.
// Populated only by the classic editor's GraphElementComponent (aliased as its static `map`);
// with classic unmounted it stays empty, so readers must keep optional chaining to stay no-op safe.
export const graphComponentRegistry: Dictionary<Pointer<DGraphElement>, GObject> = {};
