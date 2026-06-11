// THROWAWAY probe for Phase 2a. Remove after visual verification.
//
// Exposes window.__seedIRViewProbe(className, priority?) in dev builds. It seeds
// ONE DViewElement on the active metamodel so that instances (M1 DObjects) of the
// named metaclass render through IRView, proving end-to-end:
//   Gate A — stub jsxString -> registered IRView
//   Gate B — empty oclCondition + true jsCondition is selected
//   Gate C — data?.instanceof?.id === '<resolved id>' matches
//
// The IR is written onto the raw D object (view.__raw.ir) as a temporary read
// path for the probe; a proper L getter and an `ir` D-field come in a later task.

import { DViewElement, LProject } from '../../joiner';
import { resolveParentViewpoint } from '../../utils/lastViewpoint';
import { JjodelEvents } from '../../events/registry';
import type { ViewIR } from './types';

function resolveClassIdByName(className: string): { id: string; modelName: string } | null {
    const project: any = LProject.getProject();
    const metamodels: any[] = (project?.metamodels as any[]) || [];
    const matches: { id: string; modelName: string }[] = [];
    const available: string[] = [];
    for (const mm of metamodels) {
        const pools = [mm?.classes, mm?.crossClasses];
        for (const pool of pools) {
            if (!Array.isArray(pool)) continue;
            for (const c of pool) {
                if (!c) continue;
                if (c.name) available.push(c.name);
                if (c.name === className && c.id) matches.push({ id: c.id, modelName: mm?.name || mm?.id || '?' });
            }
        }
    }
    if (matches.length === 0) {
        console.error(
            `[__seedIRViewProbe] class "${className}" not found in any open metamodel.\nAvailable classes: ` +
            (available.length ? Array.from(new Set(available)).sort().join(', ') : '(none — open a metamodel first)')
        );
        return null;
    }
    if (matches.length > 1) {
        console.warn(`[__seedIRViewProbe] class name "${className}" is ambiguous (${matches.length} matches); using the first.`, matches);
    }
    return matches[0];
}

function buildIR(className: string): ViewIR {
    return {
        kind: 'vertex',
        irVersion: 'ir-1.0',
        metaclasses: [className],
        label: 'IRView probe',
        shape: {
            form: 'rect',
            border: { color: '#0ea5e9', width: 2, style: 'solid' },
            labels: [{ position: 'top', source: { from: 'path', expr: '$name.value' } }],
        },
        fieldCompartments: [
            {
                id: 'attributes',
                source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ': ' }, { kind: 'type' }] },
            },
        ],
    };
}

function seedIRViewProbe(className: string, priority: number = 1000): string | undefined {
    if (!className) { console.error('[__seedIRViewProbe] usage: window.__seedIRViewProbe(className, priority?)'); return undefined; }

    const resolved = resolveClassIdByName(className);
    if (!resolved) return undefined;
    const classId = resolved.id;

    const parent = resolveParentViewpoint();
    if (!parent) { console.error('[__seedIRViewProbe] no viewpoint available. Open a viewpoint first.'); return undefined; }

    const ir = buildIR(className);
    const stubJsx = '<IRView data={data} node={node} view={view} />';
    const jsCondition = 'return data?.instanceof?.id === ' + JSON.stringify(classId);
    const viewName = 'IRView probe — ' + className;

    let createdId: string | undefined;
    try {
        const newView = DViewElement.new2(viewName, stubJsx, parent.dViewpoint, (d: any) => {
            d.appliableTo = 'Vertex';
            d.appliableToClasses = ['DObject'];
            d.jsCondition = jsCondition;
            d.oclCondition = '';
            d.isExclusiveView = true;
            d.explicitApplicationPriority = priority;
            d.ir = ir;                 // probe read path: view.__raw.ir
            d.css_MUST_RECOMPILE = true;
        }, true);
        createdId = (newView as any)?.id;
    } catch (e) {
        console.error('[__seedIRViewProbe] DViewElement.new2 threw:', e);
        return undefined;
    }

    // Nudge the editor to re-select / re-render views (mirrors createViewInWorkbench).
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.VIEW_CREATED, { detail: { viewpointId: parent.dViewpoint.id } }));
    }, 100);

    console.log(
        `[__seedIRViewProbe] seeded view "${viewName}"\n  viewId:   ${createdId}\n  classId:  ${classId} (in "${resolved.modelName}")\n  priority: ${priority}\n` +
        '  -> open an M1 model with an instance of this class on the canvas (hard-refresh only retains the view if the project was saved first).'
    );
    return createdId;
}

// Attach in dev only; no-op in production builds. `window` (browser global) is
// used directly to avoid any module-init dependency on a joiner binding.
const isDev = (import.meta as any)?.env?.DEV;
if (isDev && typeof window !== 'undefined') {
    (window as any).__seedIRViewProbe = seedIRViewProbe;
    console.info('[irview-probe] __seedIRViewProbe ready');
}
