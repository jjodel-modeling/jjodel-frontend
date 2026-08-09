import React, { useState } from 'react';
import { DClass, LPointerTargetable, type LViewElement } from '../../../../joiner';
import { Button, HelpText, ErrorText, Select } from '../../../ui';
import { defaultObjectViewIR, defaultEdgeViewIR } from '../ir/irDefaults';
import { validateIR } from '../ir/irValidate';
import type { EdgeViewIR, RowViewIR, VertexViewIR } from '../ir/irTypes';

const KIND_OPTIONS = [
    { value: 'vertex', label: 'Vertex (node)' },
    { value: 'row', label: 'Row (inline)' },
    { value: 'edge', label: 'Edge (line)' },
];

export interface EnableIRPanelProps {
    view: LViewElement;
}

// D-level meta types offered by InfoData's Apply-to select (InfoData.tsx:83);
// '' = "anything". None of these are M2 metaclass names, and the IR resolver
// matches by metaclass name (classAncestryNames), so they are dropped from the
// seed — only real M2 class pointers become ir.metaclasses.
const D_LEVEL_TYPES = new Set([
    '', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute',
    'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature',
]);

/**
 * Resolve `view.appliableToClasses` to M2 metaclass NAMES for `ir.metaclasses`.
 * appliableToClasses mixes D-level type names (InfoData objectTypes) with M2 class
 * pointer ids (c.id). Only entries that resolve to a DClass with a name survive;
 * D-level types and "anything" ('') are discarded. Order-preserving dedup. A
 * malformed / unresolvable entry is skipped, never thrown.
 */
function resolveMetaclassNames(view: LViewElement): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const entry of (((view as any).appliableToClasses ?? []) as string[])) {
        if (!entry || D_LEVEL_TYPES.has(entry)) continue;
        try {
            const l = LPointerTargetable.fromPointer(entry) as any;
            const name: string | undefined = l && l.className === DClass.cname ? l.name : undefined;
            if (name && !seen.has(name)) { seen.add(name); out.push(name); }
        } catch { /* malformed / unresolvable entry — skip */ }
    }
    return out;
}

/**
 * EnableIRPanel — occupies the IR tab of a vertex view that has no `ir` yet.
 * One action seeds `view.ir` from the classic default IR, with metaclasses
 * resolved from the view's Apply-to classes (falling back to the '*' wildcard),
 * after which the same tab renders VertexAuthoringPanel (ViewData re-renders on
 * the L-proxy write). No `migratedFrom`: the view is authored custom, not
 * migrated, so it renders through the IR interpreter (not the native branch).
 */
export const EnableIRPanel: React.FC<EnableIRPanelProps> = ({ view }) => {
    const [error, setError] = useState<string | null>(null);
    // Kind of IR to seed. 'vertex' reproduces the pre-R3 behaviour exactly; 'row'
    // seeds a minimal inline row view (RowAuthoringPanel); 'edge' seeds a minimal
    // reference-as-edge view authored from EdgeAuthoringPanel afterwards.
    const [kind, setKind] = useState<'vertex' | 'row' | 'edge'>('vertex');

    // Guard (Fase R1): never overwrite an existing ir. A view may already carry an ir
    // of a kind this panel cannot author yet (e.g. 'row'); seeding the vertex default
    // here would silently corrupt it. ViewData routes non-vertex ir to a read-only
    // placeholder, but guard here too so the panel is safe wherever it is mounted.
    const existingIr = (view as any).ir;
    if (existingIr) {
        return (
            <section className="properties-tab properties-panel">
                <div className="jj-field-label" style={{ marginTop: 4 }}>IR authoring</div>
                <HelpText>This view already has an IR representation of kind "{existingIr.kind}". Authoring for this kind is not available yet: the view will not be modified.</HelpText>
            </section>
        );
    }

    const names = resolveMetaclassNames(view);

    const enable = () => {
        // Row seed is intentionally minimal (metaclasses empty, single intrinsic-name
        // segment): the author sets the metaclass and template from RowAuthoringPanel.
        const rowSeed: RowViewIR = {
            irVersion: 'ir-1.0',
            kind: 'row',
            metaclasses: [],
            template: [{ from: 'intrinsic', prop: 'name' }],
        };
        const vertexSeed: VertexViewIR = {
            ...defaultObjectViewIR(),
            metaclasses: names.length > 0 ? [...names] : '*',
            ...(view.name ? { label: view.name } : {}),
        };
        // Edge seed is intentionally minimal (SOURCE metaclass resolved like the
        // vertex, fallback empty; no reference): the author sets reference, line,
        // terminations and label center from EdgeAuthoringPanel.
        const edgeSeed: EdgeViewIR = {
            ...defaultEdgeViewIR(),
            metaclasses: names.length > 0 ? [...names] : [],
        };
        const seed = kind === 'row' ? rowSeed : kind === 'edge' ? edgeSeed : vertexSeed;
        const v = validateIR(view.id, seed);
        if (!v.ok) { setError(v.error); return; }
        setError(null);
        // Same L-proxy write as VertexAuthoringPanel (view.tsx set_ir → SetFieldAction
        // → dispatch): ViewData re-renders and the IR tab flips to the authoring panel.
        (view as any).ir = seed;
    };

    return (
        <section className="properties-tab properties-panel">
            <div className="jj-field-label" style={{ marginTop: 4 }}>IR authoring</div>
            <HelpText>This view still uses the classic template (jsxString). Enabling the IR describes the view with a structured representation, and the rendering of the instances it matches switches to the IR interpreter right away.</HelpText>

            {error && <ErrorText>{error}</ErrorText>}

            <div className="jj-field" style={{ marginTop: 8 }}>
                <label className="jj-field-label">Kind</label>
                <Select
                    options={KIND_OPTIONS}
                    value={kind}
                    onChange={(e) => setKind(e.target.value as 'vertex' | 'row' | 'edge')}
                />
            </div>

            <div className="jj-field" style={{ marginTop: 8 }}>
                {kind === 'row' ? (
                    <HelpText>The row view will start with no metaclass: set it (and the template) right afterwards from the authoring panel.</HelpText>
                ) : kind === 'edge' ? (
                    names.length > 0 ? (
                        <HelpText>The edge view will start applied to the metaclass: {names.join(', ')}. The nature (reference or object) and everything else are set right afterwards from the authoring panel.</HelpText>
                    ) : (
                        <HelpText>The edge view will start with no metaclass: set it, together with the nature (reference or object), right afterwards from the authoring panel.</HelpText>
                    )
                ) : names.length > 0 ? (
                    <HelpText>The view will start applied to: {names.join(', ')}.</HelpText>
                ) : (
                    <HelpText>The view will start applied to all metaclasses (*); you can narrow it right afterwards from the Advanced tab.</HelpText>
                )}
            </div>

            <div className="jj-field" style={{ marginTop: 8 }}>
                <Button variant="primary" onClick={enable}>Enable IR authoring</Button>
            </div>
        </section>
    );
};

export default EnableIRPanel;
