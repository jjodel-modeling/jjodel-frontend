/**
 * objectSlots — raw reads of an M1 object's slots, for the event role (step 1).
 *
 * The roles hold POINTERS to features (R-SIM-2), so a slot is found by the
 * feature it instantiates, not by name: among the object's `features` (DValue
 * ids), the one whose `instanceof` is the feature id. Measured on the live
 * editor (discovery_2026-09-23_sim_step1_events.md §3.4, P-2026-09-23-1850): an
 * inherited attribute's slot carries the id of the DAttribute declared on the
 * superclass, so an event role set on a superclass feature reaches every
 * subclass instance.
 *
 * Raw `idlookup` only, no L proxy: the readers run under the test bench, and a
 * single-valued reference never set reads back `[null]` on the proxy
 * (model/CLAUDE.md §9.3); here `null` and `undefined` entries are dropped. The
 * slice 0 readers of the panel (`outgoingTransitions`, `transitionTargetId`)
 * still go through the proxy by name; the asymmetry is declared, not refactored.
 */

/** The values of the object's slot for `featureId`, without null entries; `[]` when absent. */
export function objectSlotValues(lookup: Record<string, any>, objectId: string, featureId: string): unknown[] {
    const features = lookup[objectId]?.features;
    if (!Array.isArray(features)) return [];
    for (const valueId of features) {
        const slot = lookup[valueId];
        if (slot?.instanceof !== featureId) continue;
        return Array.isArray(slot.values) ? slot.values.filter((v: unknown) => v !== null && v !== undefined) : [];
    }
    return [];
}

/**
 * The objects held by a reference slot: every id, in slot order; `[]` when
 * unset. A multi-valued trigger accepts any of them (P-2026-09-23-1850).
 */
export function objectReferences(lookup: Record<string, any>, objectId: string, referenceId: string): string[] {
    return objectSlotValues(lookup, objectId, referenceId).filter((v): v is string => typeof v === 'string' && v !== '');
}

/** A slot value as label text: a non-blank string or a number or boolean; '' otherwise. */
function asText(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/** A short form of an id for display, suffix of four as VersionFixer's auto-names. */
function shortId(id: string): string {
    return id.length > 8 ? `…${id.slice(-4)}` : id;
}

/**
 * The label of an element in the event list: the value of the identifier
 * feature (`simEventIdentifier`) when set; else the value of the element's
 * `name` feature when it has one, found by the name of the declaring feature
 * since no role points to it; else a shortened id.
 */
export function objectLabel(lookup: Record<string, any>, objectId: string, identifierFeatureId?: string): string {
    if (identifierFeatureId) {
        const text = asText(objectSlotValues(lookup, objectId, identifierFeatureId)[0]);
        if (text) return text;
    }
    const features = lookup[objectId]?.features;
    if (Array.isArray(features)) {
        for (const valueId of features) {
            const slot = lookup[valueId];
            if (lookup[slot?.instanceof]?.name !== 'name') continue;
            const text = asText(objectSlotValues(lookup, objectId, slot.instanceof)[0]);
            if (text) return text;
            break;
        }
    }
    return shortId(objectId);
}
