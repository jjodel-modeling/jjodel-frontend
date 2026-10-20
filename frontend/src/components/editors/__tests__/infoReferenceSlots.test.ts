/**
 * InfoReferenceSlots (P-2026-10-20-1830): the body of the «References» section of Info.references.
 *
 * Executes the component through react-dom/server with fake LValues whose `validTargetsJSX` is a
 * counting getter. On a large model one read of that getter scans every object of the model
 * (~0.5 s on 407 objects, discovery_2026-10-20_large_model_click_profile.md §4.3), so the number
 * of reads is the cost.
 *
 * Not covered here, because Info.tsx does not import in this bench (monaco through the joiner
 * barrel): that the body is not evaluated while the section is closed. That is measured with the
 * probe's call counter on the real app (scripts/probe/large-model-click-profile.ts).
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoReferenceSlots, type InfoReferenceSlot } from '../InfoReferenceSlots';

const h = React.createElement;

/** A fake LValue: `reads` counts the evaluations of `validTargetsJSX`. */
function fakeLv(tag: string) {
    const lv = {
        reads: 0,
        get validTargetsJSX() {
            lv.reads++;
            return [
                h('optgroup', { key: 'free', label: 'Free     Objects' },
                    h('option', { key: tag + 'a', value: tag + '_a', title: 'm.' + tag + '_a' }, tag + '_a'),
                    h('option', { key: tag + 'b', value: tag + '_b', title: 'm.' + tag + '_b' }, tag + '_b')),
            ];
        },
    };
    return lv;
}
type FakeLv = ReturnType<typeof fakeLv>;

/** Every row kind: a multivalued slot with two targets (+ add row), a single optional slot with
 *  one target, an empty single slot, a required single slot, a full multivalued slot (no add). */
function fixture() {
    const lvs = { multi: fakeLv('m'), single: fakeLv('s'), empty: fakeLv('e'), req: fakeLv('r'), full: fakeLv('f') };
    const slots: InfoReferenceSlot<FakeLv>[] = [
        { key: 'k1', name: 'performers', lv: lvs.multi, upper: -1, lower: 0, multi: true,
          targets: [{ rawIndex: 0, id: 'm_a', name: 'm_a', cls: 'Role' }, { rawIndex: 2, id: 'm_b', name: 'm_b', cls: 'Role' }] },
        { key: 'k2', name: 'lane', lv: lvs.single, upper: 1, lower: 0, multi: false,
          targets: [{ rawIndex: 0, id: 's_b', name: 's_b', cls: 'Lane' }] },
        { key: 'k3', name: 'owner', lv: lvs.empty, upper: 1, lower: 0, multi: false, targets: [] },
        { key: 'k4', name: 'kind', lv: lvs.req, upper: 1, lower: 1, multi: false,
          targets: [{ rawIndex: 0, id: 'r_a', name: 'r_a', cls: 'Kind' }] },
        { key: 'k5', name: 'pair', lv: lvs.full, upper: 2, lower: 0, multi: true,
          targets: [{ rawIndex: 0, id: 'f_a', name: 'f_a', cls: 'X' }, { rawIndex: 1, id: 'f_b', name: 'f_b', cls: 'X' }] },
    ];
    const noop = () => undefined;
    const markup = renderToStaticMarkup(h(InfoReferenceSlots<FakeLv>, { slots, openTarget: noop, writeAt: noop, appendTarget: noop }));
    return { lvs, markup };
}

const optionsOf = (tag: string) =>
    `<optgroup label="Free     Objects"><option value="${tag}_a" title="m.${tag}_a">${tag}_a</option><option value="${tag}_b" title="m.${tag}_b">${tag}_b</option></optgroup>`;

describe('InfoReferenceSlots', () => {
    it('reads validTargetsJSX once per slot, not once per row (kills m2: per-row read)', () => {
        const { lvs } = fixture();
        // Rows per slot: multi 2 targets + add = 3, single 1, empty 1, required 1, full 2.
        expect(lvs.multi.reads).toBe(1);
        expect(lvs.full.reads).toBe(1);
        expect(lvs.single.reads).toBe(1);
        expect(lvs.empty.reads).toBe(1);
        expect(lvs.req.reads).toBe(1);
    });

    it('every select still carries the full option list of its slot (options unchanged)', () => {
        const { markup } = fixture();
        // The select marks its current value `selected=""`: stripped, the lists compare as lists.
        const plain = markup.replaceAll(' selected=""', '');
        const count = (s: string) => plain.split(s).length - 1;
        expect(count(optionsOf('m'))).toBe(3);
        expect(count(optionsOf('f'))).toBe(2);
        expect(count(optionsOf('s'))).toBe(1);
        expect(count(optionsOf('e'))).toBe(1);
        expect(count(optionsOf('r'))).toBe(1);
        expect(count('<select')).toBe(8);
    });

    it('renders the same markup as the per-row body it replaces', () => {
        const { markup } = fixture();
        expect(markup).toBe(GOLDEN);
    });
});

// Captured from the verbatim copy of the pre-change body (Info.tsx:819-889 at 3c7dc32f9).
const GOLDEN = "<div class=\"jj-ref-slot\"><div class=\"jj-ref-slot-head\"><span class=\"jj-ref-slot-name\">performers</span><span class=\"jj-ref-slot-mult\">[0..*]</span></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><optgroup label=\"Free     Objects\"><option value=\"m_a\" title=\"m.m_a\" selected=\"\">m_a</option><option value=\"m_b\" title=\"m.m_b\">m_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button><button type=\"button\" class=\"jj-slot-value-delete\" title=\"Remove this reference\">×</button></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><optgroup label=\"Free     Objects\"><option value=\"m_a\" title=\"m.m_a\">m_a</option><option value=\"m_b\" title=\"m.m_b\" selected=\"\">m_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button><button type=\"button\" class=\"jj-slot-value-delete\" title=\"Remove this reference\">×</button></div><div class=\"jj-slot-value-row jj-ref-row jj-ref-row--add\"><select class=\"jj-slot-value-select\"><option value=\"undefined\" selected=\"\">+ add performers…</option><optgroup label=\"Free     Objects\"><option value=\"m_a\" title=\"m.m_a\">m_a</option><option value=\"m_b\" title=\"m.m_b\">m_b</option></optgroup></select></div></div><div class=\"jj-ref-slot\"><div class=\"jj-ref-slot-head\"><span class=\"jj-ref-slot-name\">lane</span><span class=\"jj-ref-slot-mult\">[0..1]</span></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><option value=\"undefined\">-----</option><optgroup label=\"Free     Objects\"><option value=\"s_a\" title=\"m.s_a\">s_a</option><option value=\"s_b\" title=\"m.s_b\" selected=\"\">s_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button><button type=\"button\" class=\"jj-slot-value-delete\" title=\"Remove this reference\">×</button></div></div><div class=\"jj-ref-slot\"><div class=\"jj-ref-slot-head\"><span class=\"jj-ref-slot-name\">owner</span><span class=\"jj-ref-slot-mult\">[0..1]</span></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><option value=\"undefined\" selected=\"\">-----</option><optgroup label=\"Free     Objects\"><option value=\"e_a\" title=\"m.e_a\">e_a</option><option value=\"e_b\" title=\"m.e_b\">e_b</option></optgroup></select></div></div><div class=\"jj-ref-slot\"><div class=\"jj-ref-slot-head\"><span class=\"jj-ref-slot-name\">kind</span><span class=\"jj-ref-slot-mult\">[1..1]</span></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><optgroup label=\"Free     Objects\"><option value=\"r_a\" title=\"m.r_a\" selected=\"\">r_a</option><option value=\"r_b\" title=\"m.r_b\">r_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button></div></div><div class=\"jj-ref-slot\"><div class=\"jj-ref-slot-head\"><span class=\"jj-ref-slot-name\">pair</span><span class=\"jj-ref-slot-mult\">[0..2]</span></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><optgroup label=\"Free     Objects\"><option value=\"f_a\" title=\"m.f_a\" selected=\"\">f_a</option><option value=\"f_b\" title=\"m.f_b\">f_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button><button type=\"button\" class=\"jj-slot-value-delete\" title=\"Remove this reference\">×</button></div><div class=\"jj-slot-value-row jj-ref-row\"><select class=\"jj-slot-value-select\"><optgroup label=\"Free     Objects\"><option value=\"f_a\" title=\"m.f_a\">f_a</option><option value=\"f_b\" title=\"m.f_b\" selected=\"\">f_b</option></optgroup></select><button type=\"button\" class=\"jj-ref-open\" title=\"Open the referenced element — edits the shared instance\"><i class=\"bi bi-box-arrow-in-right\" aria-hidden=\"true\"></i></button><button type=\"button\" class=\"jj-slot-value-delete\" title=\"Remove this reference\">×</button></div></div>";
