/**
 * irDemoFixture — dev-only console helper installing the "IR Demo" viewpoint.
 *
 * Usage (browser console, with an M1 model open):
 *   window.__jjodelInstallIRDemo()                      // defaults: 'State', 'isInitial'
 *   window.__jjodelInstallIRDemo('Task', 'done')        // parametrized
 *
 * Creates a viewpoint with vertex IR views for the given metaclass:
 *   - base view (rounded, name label, attribute compartment)
 *   - "initial" view (predicate on the boolean attribute, play badge, higher priority)
 * Views also get jsxString = DEFAULT_VIEW_JSX_STRING and coherent
 * appliableTo/appliableToClasses so switching to the classic editor with this
 * viewpoint active shows the default rendering instead of breaking.
 *
 * Idempotent: fixed Pointer_ ids; re-running with the same metaclass is a no-op.
 */

import { DViewElement, DViewPoint, store } from '../../../../joiner';
import { DEFAULT_VIEW_JSX_STRING } from '../../../../utils/defaultViewTemplate';
import { clearCompileCache } from './irCompile';
import type { VertexViewIR } from './irTypes';

const VP_ID_PREFIX = 'Pointer_IRDemoViewpoint';
const VIEW_BASE_PREFIX = 'Pointer_IRDemoBaseView';
const VIEW_FLAG_PREFIX = 'Pointer_IRDemoFlagView';

/**
 * The reference compartment, shared by both demo views.
 *
 * Why it exists: without it the demo view declares `attributes` only, and
 * `IRNodeContent` partitions its rows R/A — so a reference has no row on the IR
 * branch at all. Measured 2026-08-30 on `AllNine`: 12 rows per IR node, `cfg`
 * among them ZERO times, while the native branch drew it. That is what left the
 * three reference STATES — `refPill`, `brokenRef`, `dash` — unexercised on this
 * branch after R-STR-6 (B) routed the whole ladder through it.
 *
 * Same `rowFormat` as `attrs` on purpose: the two compartments must differ in
 * their SOURCE and in nothing else, or a difference in what they paint could be
 * read as a difference in how they were asked to paint it.
 *
 * Additive: it declares no new IR key (`{from:'references'}` is irVersion 1.0,
 * irTypes.ts:130), and `IRNodeContent` skips a compartment whose source array is
 * empty — so a metaclass with no references, `State` and `Task` included, renders
 * exactly as before.
 */
const REFERENCES_COMPARTMENT = {
    id: 'refs',
    source: { from: 'references' },
    rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: '=' }, { kind: 'value' }] },
    separator: true,
} as const satisfies NonNullable<VertexViewIR['fieldCompartments']>[number];

function baseViewIR(metaclassName: string): VertexViewIR {
    return {
        irVersion: 'ir-1.0',
        kind: 'vertex',
        metaclasses: [metaclassName],
        priority: 1,
        exclusive: true,
        label: `${metaclassName} (IR base)`,
        shape: {
            form: 'rounded',
            fill: '#f8fafc',
            border: { color: '#334155', width: 1, style: 'solid' },
            labels: [
                { position: 'center', source: { from: 'path', expr: '$name.value' } },
            ],
        },
        fieldCompartments: [
            {
                id: 'attrs',
                source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: '=' }, { kind: 'value' }] },
                separator: true,
            },
            REFERENCES_COMPARTMENT,
        ],
    };
}

function flagViewIR(metaclassName: string, boolAttrName: string): VertexViewIR {
    return {
        irVersion: 'ir-1.0',
        kind: 'vertex',
        metaclasses: [metaclassName],
        predicate: { op: 'eq', left: `$${boolAttrName}.value`, right: { kind: 'boolean', value: true } },
        priority: 10,
        exclusive: true,
        label: `${metaclassName} ${boolAttrName} (IR)`,
        shape: {
            form: 'rounded',
            fill: '#e0f2fe',
            border: { color: '#0ea5e9', width: 2, style: 'solid' },
            labels: [
                { position: 'center', source: { from: 'path', expr: '$name.value' } },
            ],
            badges: [
                {
                    icon: 'bi-play-circle-fill',
                    position: 'tr',
                    visible: { when: { op: 'eq', left: `$${boolAttrName}.value`, right: { kind: 'boolean', value: true } }, then: true, else: false },
                    tooltip: boolAttrName,
                },
            ],
        },
        fieldCompartments: [
            {
                id: 'attrs',
                source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: '=' }, { kind: 'value' }] },
                separator: true,
            },
            REFERENCES_COMPARTMENT,
        ],
    };
}

function installIRDemo(metaclassName: string = 'State', boolAttrName: string = 'isInitial'): string {
    const state: any = store.getState();
    const suffix = '_' + metaclassName;
    const vpId = VP_ID_PREFIX + suffix;

    if (state.idlookup?.[vpId]) {
        const msg = `[ir-demo] viewpoint already installed (${vpId}); activate "IR Demo ${metaclassName}" from the viewpoint selector.`;
        console.log(msg);
        return msg;
    }

    const viewpoint = DViewPoint.newVP(`IR Demo ${metaclassName}`, undefined, true, vpId);

    DViewElement.new2(`IR ${metaclassName} base`, DEFAULT_VIEW_JSX_STRING, viewpoint, (d) => {
        d.appliableToClasses = ['DObject'];
        d.appliableTo = 'Vertex';
        (d as any).ir = baseViewIR(metaclassName);
    }, true, VIEW_BASE_PREFIX + suffix);

    DViewElement.new2(`IR ${metaclassName} ${boolAttrName}`, DEFAULT_VIEW_JSX_STRING, viewpoint, (d) => {
        d.appliableToClasses = ['DObject'];
        d.appliableTo = 'Vertex';
        (d as any).ir = flagViewIR(metaclassName, boolAttrName);
    }, true, VIEW_FLAG_PREFIX + suffix);

    clearCompileCache();
    const msg = `[ir-demo] installed viewpoint "IR Demo ${metaclassName}" with 2 vertex IR views `
        + `(base + ${boolAttrName}-flagged). Activate it from the viewpoint selector.`;
    console.log(msg);
    return msg;
}

declare global {
    interface Window {
        __jjodelInstallIRDemo?: (metaclassName?: string, boolAttrName?: string) => string;
    }
}

if (typeof window !== 'undefined') {
    window.__jjodelInstallIRDemo = installIRDemo;
}

export { installIRDemo };
