/**
 * formHosts: which `FormSpec` a given host of the form actually sees (R-VP-8, R-VP-12).
 *
 * The same per-class view feeds three hosts: the rail (`PropertiesWithTreeView`), the
 * Data Manager's drawer (`InstanceManagerTab`), and the node form on the canvas (which
 * reads `widgets` on its own and does not pass through here). A host may carry an
 * override under `FormSpec.hosts`, resolved FIELD BY FIELD over the base spec: override
 * → base → type-derived default. Nothing is nominated or duplicated: one base spec, one
 * override per host, and the base is what every host without an override gets.
 *
 * Merge rule, by the shape of the key:
 * - records keyed by feature name (`widgets`, `features`, `labels`) merge per feature,
 *   the override winning where both speak and the base keeping every other entry;
 * - lists (`order`, `hidden`, `basic`) are replaced WHOLE when the override has them,
 *   because a list is a statement about all the fields at once and half of one would
 *   mean nothing;
 * - scalars (`theme`, `labelPlacement`) are replaced when present.
 *
 * `order` sorts inside the section a field's type assigns it, moves none across sections
 * and removes none: the names not listed follow the listed ones in today's order
 * (R-VP-13). `hidden` is explicit, omission never hides (R-FRM-1). `widgets` in the
 * manager's override reaches the drawer form only: the table does not map rung 0 yet
 * (R-VP-9, slice 1b).
 *
 * Pure, and it never returns `hosts`: what comes out is the spec of ONE host, and a
 * consumer that found `hosts` on it could only misapply it.
 */

import type { FormHostOverride, FormSpec } from './irTypes';

/** Where the form is mounted. Only `manager` may carry an override in this slice. */
export type FormHost = 'rail' | 'nodeForm' | 'manager';

/**
 * The `FormSpec` the given host sees. Undefined in, undefined out. A base with no
 * `hosts` and no override for this host comes back as the base MINUS `hosts`, the
 * same object when there is nothing to strip.
 */
export function resolveFormSpec(spec: FormSpec | undefined, host: FormHost): FormSpec | undefined {
    if (!spec) return undefined;
    const { hosts, ...base } = spec;
    const override: FormHostOverride | undefined = host === 'manager' ? hosts?.manager : undefined;
    if (!override) return hosts === undefined ? spec : base;

    const out: FormSpec = { ...base };
    if (override.theme !== undefined) out.theme = override.theme;
    if (override.labelPlacement !== undefined) out.labelPlacement = override.labelPlacement;
    if (override.widgets) out.widgets = { ...(base.widgets ?? {}), ...override.widgets };
    if (override.features) out.features = { ...(base.features ?? {}), ...override.features };
    if (override.labels) out.labels = { ...(base.labels ?? {}), ...override.labels };
    if (override.order) out.order = override.order;
    if (override.hidden) out.hidden = override.hidden;
    if (override.basic) out.basic = override.basic;
    return out;
}

/**
 * The fields reordered by `spec.order` (R-VP-13): the named ones first, in the order
 * given, then every other in its incoming order. A permutation, never a filter, and a
 * name that matches no field is ignored, as is a repeat. Meant to run on the VISIBLE
 * fields BEFORE `buildFormSections`, whose three `filter`s preserve incoming order, so
 * that the ordering lands inside each section without the partition changing.
 * Without `order`, the input, by reference.
 */
export function orderFields<F extends { name: string }>(fields: F[], spec: FormSpec | undefined): F[] {
    const wanted = spec?.order;
    if (!wanted || wanted.length === 0) return fields;
    const byName = new Map(fields.map(f => [f.name, f]));
    const lead: F[] = [];
    const taken = new Set<string>();
    for (const name of wanted) {
        const f = byName.get(name);
        if (!f || taken.has(name)) continue;
        taken.add(name);
        lead.push(f);
    }
    if (lead.length === 0) return fields;
    return [...lead, ...fields.filter(f => !taken.has(f.name))];
}
