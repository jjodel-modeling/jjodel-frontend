/**
 * formHosts: the host override resolved and the `order` permutation, both EXECUTED.
 *
 * `resolveFormSpec` is the single point where a host's override folds into the base
 * spec (IRForm.tsx, where the spec enters the form), so each rule of the merge is a
 * case here: the rail ignores the override, the records merge per feature, the lists
 * replace whole, and nothing that comes out carries `hosts`.
 */
import { describe, it, expect } from 'vitest';
import { orderFields, resolveFormSpec } from '../formHosts';
import type { FormSpec } from '../irTypes';

const BASE: FormSpec = {
    theme: 'plain',
    widgets: { entryAction: 'textarea', timeout: 'number' },
    features: { outgoing: 'list' },
    labels: { entryAction: 'On entry' },
    order: ['name', 'kind'],
    hidden: ['depth'],
    basic: ['name'],
};

describe('resolveFormSpec (R-VP-12)', () => {
    it('undefined in, undefined out; a spec without `hosts` comes back by reference for every host', () => {
        expect(resolveFormSpec(undefined, 'manager')).toBeUndefined();
        for (const host of ['rail', 'nodeForm', 'manager'] as const) {
            expect(resolveFormSpec(BASE, host)).toBe(BASE);
        }
    });

    it('with `hosts` but no override for the host: the base WITHOUT `hosts`, otherwise equal', () => {
        const spec: FormSpec = { ...BASE, hosts: {} };
        const out = resolveFormSpec(spec, 'manager')!;
        expect(out).toEqual(BASE);
        expect(out).not.toHaveProperty('hosts');
    });

    it('the rail and the node form ignore a `manager` override, and still lose `hosts`', () => {
        const spec: FormSpec = { ...BASE, hosts: { manager: { hidden: ['name'], theme: 'card' } } };
        expect(resolveFormSpec(spec, 'rail')).toEqual(BASE);
        expect(resolveFormSpec(spec, 'nodeForm')).toEqual(BASE);
    });

    it('records merge per feature: the override wins where both speak, the base keeps the rest', () => {
        const spec: FormSpec = {
            ...BASE,
            hosts: { manager: { widgets: { timeout: 'text', kind: 'select' }, labels: { kind: 'Kind of state' } } },
        };
        const out = resolveFormSpec(spec, 'manager')!;
        expect(out.widgets).toEqual({ entryAction: 'textarea', timeout: 'text', kind: 'select' });
        expect(out.labels).toEqual({ entryAction: 'On entry', kind: 'Kind of state' });
        expect(out.features).toEqual(BASE.features);      // untouched record stays the base's
        expect(out).not.toHaveProperty('hosts');
    });

    it('lists replace whole, scalars replace when present, and an absent key keeps the base', () => {
        const spec: FormSpec = {
            ...BASE,
            hosts: { manager: { hidden: ['timeout'], order: ['kind'], theme: 'card' } },
        };
        const out = resolveFormSpec(spec, 'manager')!;
        expect(out.hidden).toEqual(['timeout']);         // not ['depth', 'timeout']
        expect(out.order).toEqual(['kind']);
        expect(out.theme).toBe('card');
        expect(out.basic).toEqual(['name']);              // absent in the override: base
        expect(out.labelPlacement).toBeUndefined();
    });

    it('an override with a record on a base that has none: the override alone', () => {
        const spec: FormSpec = { hosts: { manager: { widgets: { kind: 'text' } } } };
        expect(resolveFormSpec(spec, 'manager')).toEqual({ widgets: { kind: 'text' } });
    });

    it('does not mutate the base spec', () => {
        const spec: FormSpec = { ...BASE, hosts: { manager: { widgets: { kind: 'text' }, hidden: ['x'] } } };
        const frozen = JSON.stringify(spec);
        resolveFormSpec(spec, 'manager');
        expect(JSON.stringify(spec)).toBe(frozen);
    });
});

describe('orderFields (R-VP-13)', () => {
    const fields = [{ name: 'name' }, { name: 'kind' }, { name: 'timeout' }, { name: 'outgoing' }];
    const names = (fs: { name: string }[]) => fs.map(f => f.name);

    it('without `order` returns the input by reference', () => {
        expect(orderFields(fields, undefined)).toBe(fields);
        expect(orderFields(fields, {})).toBe(fields);
        expect(orderFields(fields, { order: [] })).toBe(fields);
    });

    it('a partial `order` leads, the rest follows in incoming order: a permutation, not a filter', () => {
        const out = orderFields(fields, { order: ['timeout', 'kind'] });
        expect(names(out)).toEqual(['timeout', 'kind', 'name', 'outgoing']);
        expect(out).toHaveLength(fields.length);
    });

    it('ignores unknown names and repeats; only unknown names leaves the input untouched', () => {
        expect(names(orderFields(fields, { order: ['ghost', 'outgoing', 'outgoing'] })))
            .toEqual(['outgoing', 'name', 'kind', 'timeout']);
        expect(orderFields(fields, { order: ['ghost'] })).toBe(fields);
    });
});
