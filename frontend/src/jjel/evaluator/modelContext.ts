/**
 * Shared utility for building JjEL evaluation contexts from Jjodel model elements.
 *
 * Handles the key problem: M1 instance attribute values are stored in the L-layer
 * proxy under `$attrName.value`, but JjEL users expect to write just `attrName`.
 *
 * This module extracts those values and exposes them as direct properties in the
 * evaluation context, working for both Console and JjTL executor contexts.
 */

/**
 * Extract M1 instance attribute values from the L-layer proxy and add them
 * as direct properties in the context record.
 *
 * The L-layer proxy exposes attribute values via `$attrName.value`.
 * This function finds all `$`-prefixed keys, reads `.value`, and writes
 * the result under the unprefixed key name.
 *
 * NOTE: Attribute values OVERRIDE existing context entries (e.g., DObject's
 * identity `name` is overridden by the metamodel attribute `name` value,
 * since that's what transformation expressions expect).
 *
 * The declared multiplicity decides the shape, never the number of values: a
 * feature declared multi-valued gives the array of its values (empty when it
 * holds none), a single-valued one its value, or null when it holds none and
 * the name is not already bound. Same rule as `fillInstanceSlots` for the pool
 * handles (P-2026-10-12-0120).
 */
export function extractAttributeValues(proxy: any, context: Record<string, any>): void {
    if (proxy == null || typeof proxy !== 'object') return;

    let keys: (string | symbol)[];
    try {
        keys = Reflect.ownKeys(proxy);
    } catch {
        return;
    }

    // === DEBUG: extractAttributeValues ===
    const dollarKeys = (keys as string[]).filter(k => typeof k === 'string' && k.startsWith('$'));
    // console.log('=== extractAttributeValues ===');
    // console.log('all keys count:', keys.length);
    // console.log('$ keys found:', dollarKeys);
    // === END DEBUG ===

    // Strategy 1: Find $-prefixed properties and extract .value
    for (const key of keys) {
        if (typeof key !== 'string' || !key.startsWith('$')) continue;
        const attrName = key.slice(1);
        if (!attrName) continue; // skip bare '$'
        try {
            const attrProxy = proxy[key];
            // === DEBUG ===
            // console.log(`  extractAttributeValues: ${key} ->`, typeof attrProxy, attrProxy != null ? ('value' in attrProxy ? `has .value = ${attrProxy.value}` : 'NO .value') : 'null/undefined');
            // === END DEBUG ===
            if (attrProxy != null && typeof attrProxy === 'object' && 'value' in attrProxy) {
                const val = readSlot(attrProxy);
                // Only override if the attribute actually has a value set
                if (val !== undefined) {
                    context[attrName] = val;
                } else if (!(attrName in context)) {
                    context[attrName] = null;
                }
            }
        } catch {
            // Skip inaccessible attributes
        }
    }

    // Strategy 2 (fallback): Use features array for any attributes not yet found
    const features = context.features;
    if (Array.isArray(features)) {
        for (const feature of features) {
            if (!feature || !feature.name) continue;
            const fname = feature.name;
            // Skip if we already got a value from Strategy 1
            if (context[fname] !== undefined) continue;
            try {
                const dollarProp = proxy['$' + fname];
                if (dollarProp != null && typeof dollarProp === 'object' && 'value' in dollarProp) {
                    const val = readSlot(dollarProp);
                    if (val !== undefined) {
                        context[fname] = val;
                    } else if (!(fname in context)) {
                        context[fname] = null;
                    }
                }
            } catch {
                // Skip
            }
        }
    }
}

/** Upper bound -1, '*' or above 1, read off the slot's M2 feature (`fillInstanceSlots`'s test). */
function isMultiValued(slot: any): boolean {
    let ub: any;
    try { ub = slot.instanceof?.upperBound; } catch { ub = undefined; }
    return ub === -1 || ub === '*' || (typeof ub === 'number' && ub > 1);
}

/** The slot's value by its declared multiplicity: all values in slot order, or the first. */
function readSlot(slot: any): any {
    if (!isMultiValued(slot)) return slot.value;
    const vv = slot.values;
    return Array.isArray(vv) ? vv : (vv == null ? [] : [vv]);
}
