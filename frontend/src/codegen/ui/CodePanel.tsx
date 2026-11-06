/**
 * CodePanel — the «Code» pill's launcher of a model editor (slice G3, P-2026-10-24-0003; R-GEN-2, R-GEN-23, R-GEN-40).
 *
 * Loaded only by EditorV2's `React.lazy`, when the experimental setting is on and its «Code» pill is pressed: every
 * module of the generator is reachable from here alone (scripts/gates/check-codegen-lazy.ts). Until G3 it was the
 * floating Code panel of 3.2 (P-2026-10-10-1825), with a Templates tab and an Output with Run and Check; it is no
 * longer an editor. The one authoring surface is the generator tab (TemplateEditorTab.tsx), whose right pane
 * (GeneratorPane.tsx) took Output, Run, Check and the origin navigation, moved there.
 *
 * Pressing the pill opens the tab of the generator last used on the metamodel in this session, else the default
 * (generatorTabs.ts `launchGenerator`); on a model editor the tab opens with that model chosen in its right pane. The
 * metamodel is the editor's own on a metamodel editor (`isMetamodel`, R-GEN-19), the model's `instanceof` otherwise.
 * With more than one generator a small menu floats where the pill was (`left`, measured by EditorV2's `CodegenSlot`),
 * the last used marked; a pick opens its tab, Escape, a click outside or «Collapse» gives the pill back.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { store } from '../../joiner';
import { GEN_TEMPLATES_KEY } from '../engine/templateCodec';
import { GEN_GENERATORS_KEY, decodeGenerators } from '../engine/generatorCodec';
import { openTemplateEditor } from './openTemplateEditor';
import { elementName } from './codeOrigins';
import { launchGenerator } from './generatorTabs';
import './CodePanel.scss';

export interface CodePanelProps {
    readonly modelid: string;
    /** The CSS `left` of the menu, where the pill was. */
    readonly left: string;
    readonly onClose: () => void;
    /** The editor is a metamodel's (R-GEN-19): `modelid` is then the metamodel whose generators the pill opens. */
    readonly isMetamodel?: boolean;
}

const storedKey = (v: unknown): string | null | undefined => (typeof v === 'string' ? v : v === undefined || v === null ? v : String(v));

export default function CodePanel({ modelid, left, onClose, isMetamodel = false }: CodePanelProps): React.ReactElement | null {
    const rootRef = useRef<HTMLDivElement>(null);
    const metamodelId = useSelector((state: any) => {
        if (isMetamodel) return modelid;
        const mm = state.idlookup?.[modelid]?.instanceof;
        return typeof mm === 'string' ? mm : null;
    });
    const rawT = useSelector((state: any) => (metamodelId ? storedKey(state.idlookup?.[metamodelId]?._state?.[GEN_TEMPLATES_KEY]) : undefined));
    const rawG = useSelector((state: any) => (metamodelId ? storedKey(state.idlookup?.[metamodelId]?._state?.[GEN_GENERATORS_KEY]) : undefined));
    const generators = useMemo(() => decodeGenerators(rawT, rawG).generators, [rawT, rawG]);
    const several = !!metamodelId && generators.length > 1;

    const launch = (generatorId: string) => {
        if (metamodelId) {
            const name = elementName((store.getState() as any).idlookup ?? {}, metamodelId);
            openTemplateEditor(metamodelId, name, null, generatorId, isMetamodel ? undefined : modelid);
        }
        onClose();
    };

    // One generator: its tab at once, and the pill back.
    useEffect(() => {
        if (metamodelId && !several) launch(launchGenerator(metamodelId, generators));
        // Once, on the press that mounted the launcher.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Several: Escape or a click outside the menu gives the pill back.
    useEffect(() => {
        if (!several && metamodelId) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose(); };
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('mousedown', onDown, true);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('mousedown', onDown, true);
        };
    }, [several, metamodelId, onClose]);

    if (metamodelId && !several) return null;
    const last = metamodelId ? launchGenerator(metamodelId, generators) : null;
    return (
        <div ref={rootRef} className="codegen-panel codegen-panel--menu" style={{ left }} onKeyDown={e => e.stopPropagation()}>
            <div className="codegen-panel__header">
                <i className="bi bi-code-slash" />
                <span className="codegen-panel__title">Code</span>
                <span className="codegen-panel__tabs" />
                <button type="button" className="codegen-panel__collapse" title="Collapse" onClick={onClose}>
                    <i className="bi bi-chevron-down" />
                </button>
            </div>
            <div className="codegen-panel__body">
                {!metamodelId ? (
                    <div className="codegen-panel__hint">This model has no metamodel to hold generators.</div>
                ) : (
                    <div className="codegen-panel__menu" role="menu" aria-label="Generators">
                        {generators.map(g => (
                            <button
                                type="button"
                                role="menuitem"
                                key={g.id}
                                aria-current={g.id === last ? 'true' : undefined}
                                className="codegen-panel__menu-item"
                                title={`Open the ${g.name} generator · target ${g.target}`}
                                onClick={() => launch(g.id)}
                            >
                                <span className="codegen-panel__item-name">{g.name}</span>
                                <span className="codegen-panel__item-params">{`${g.templates.length} template${g.templates.length === 1 ? '' : 's'} · ${g.target}`}</span>
                                {g.id === last && <span className="codegen-panel__menu-last">last used</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
