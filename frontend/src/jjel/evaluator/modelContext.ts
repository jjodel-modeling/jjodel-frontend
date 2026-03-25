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
    console.log('=== extractAttributeValues ===');
    console.log('all keys count:', keys.length);
    console.log('$ keys found:', dollarKeys);
    // === END DEBUG ===

    // Strategy 1: Find $-prefixed properties and extract .value
    for (const key of keys) {
        if (typeof key !== 'string' || !key.startsWith('$')) continue;
        const attrName = key.slice(1);
        if (!attrName) continue; // skip bare '$'
        try {
            const attrProxy = proxy[key];
            // === DEBUG ===
            console.log(`  extractAttributeValues: ${key} ->`, typeof attrProxy, attrProxy != null ? ('value' in attrProxy ? `has .value = ${attrProxy.value}` : 'NO .value') : 'null/undefined');
            // === END DEBUG ===
            if (attrProxy != null && typeof attrProxy === 'object' && 'value' in attrProxy) {
                const val = attrProxy.value;
                // Only override if the attribute actually has a value set
                if (val !== undefined) {
                    context[attrName] = val;
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
                    const val = dollarProp.value;
                    if (val !== undefined) {
                        context[fname] = val;
                    }
                }
            } catch {
                // Skip
            }
        }
    }
}
