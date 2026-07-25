import React, { useState } from 'react';
import { DClass, LPointerTargetable, type LViewElement } from '../../../../joiner';
import { Button, HelpText, ErrorText } from '../../../ui';
import { defaultObjectViewIR } from '../ir/irDefaults';
import { validateIR } from '../ir/irValidate';
import type { VertexViewIR } from '../ir/irTypes';

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

    // Guard (Fase R1): never overwrite an existing ir. A view may already carry an ir
    // of a kind this panel cannot author yet (e.g. 'row'); seeding the vertex default
    // here would silently corrupt it. ViewData routes non-vertex ir to a read-only
    // placeholder, but guard here too so the panel is safe wherever it is mounted.
    const existingIr = (view as any).ir;
    if (existingIr) {
        return (
            <section className="properties-tab properties-panel">
                <div className="jj-field-label" style={{ marginTop: 4 }}>IR authoring</div>
                <HelpText>Questa view ha già una rappresentazione IR di kind "{existingIr.kind}". L'authoring per questo kind non è ancora disponibile: la view non verrà modificata.</HelpText>
            </section>
        );
    }

    const names = resolveMetaclassNames(view);

    const enable = () => {
        const seed: VertexViewIR = {
            ...defaultObjectViewIR(),
            metaclasses: names.length > 0 ? [...names] : '*',
            ...(view.name ? { label: view.name } : {}),
        };
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
            <HelpText>Questa view usa ancora il template classico (jsxString). Abilitando l'IR la view viene descritta da una rappresentazione strutturata e il rendering delle istanze che matcha passa subito all'interprete IR.</HelpText>

            {error && <ErrorText>{error}</ErrorText>}

            <div className="jj-field" style={{ marginTop: 8 }}>
                {names.length > 0 ? (
                    <HelpText>La view partirà applicata a: {names.join(', ')}.</HelpText>
                ) : (
                    <HelpText>La view partirà applicata a tutte le metaclassi (*); potrai restringerla subito dopo dal tab Advanced.</HelpText>
                )}
            </div>

            <div className="jj-field" style={{ marginTop: 8 }}>
                <Button variant="primary" onClick={enable}>Abilita authoring IR</Button>
            </div>
        </section>
    );
};

export default EnableIRPanel;
