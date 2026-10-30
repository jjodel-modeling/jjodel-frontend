/**
 * GeneratorImportDialog — the file picker and the one dialog of a generator import (P-2026-10-30-1430,
 * P-2026-10-30-1515; discovery_2026-10-30_generator_import_export §5, §6, decision 7).
 *
 * `useGeneratorImport` returns `start`, which opens a hidden file input, and `element`, which holds that input and
 * the dialog. The file is read and validated (engine/generatorFile.ts) before anything is written. The dialog lists
 * errors, then warnings, then notes; one row per generator of the file, with its target metamodel (a select unless the
 * caller fixes it) and, when the metamodel already has a generator of that name, Replace or Import under a new name.
 * Import is disabled while there is an error or a generator without a target; Cancel writes nothing. The Templates tab
 * shows the dialog only when there is something to show; the dashboard always shows it, to choose the targets.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { decodeGeneratorFile, planImport } from '../engine/generatorFile';
import type { CollisionChoice, DecodedGeneratorFile, GeneratorFileProblem, ImportPlan } from '../engine/generatorFile';
import { applyImportPlan, storedGenerators } from './generatorTransfer';
import type { MetamodelRef } from './generatorTransfer';
import '../../components/ConfirmDialog/confirm-dialog.scss';
import './GeneratorImportDialog.scss';

export interface GeneratorImportOptions {
    /** The metamodels a generator can land in. */
    readonly metamodels: readonly MetamodelRef[];
    /** The one target, when the caller fixes it (the Templates tab's metamodel). */
    readonly target?: string;
    /** Show the dialog even when there is no problem and no collision. */
    readonly alwaysShow?: boolean;
    /** The unsaved drafts of a generator's open tab. */
    readonly draftsOf?: (metamodelId: string, generatorId: string) => number;
    /** Called after the writes, with where each generator landed. */
    readonly onImported?: (imported: ImportPlan['imported']) => void;
}

interface Pending {
    readonly fileName: string;
    readonly decoded: DecodedGeneratorFile;
    readonly targets: (string | null)[];
    readonly choices: Record<number, CollisionChoice>;
}

/** The target a generator of the file starts with: the fixed one, else the metamodel it names, else the only one. */
function initialTarget(metamodel: string | undefined, opts: GeneratorImportOptions): string | null {
    if (opts.target) return opts.target;
    const named = opts.metamodels.find(m => m.name === metamodel);
    if (named) return named.id;
    return opts.metamodels.length === 1 ? opts.metamodels[0].id : null;
}

const planOf = (p: Pending, opts: GeneratorImportOptions): ImportPlan =>
    planImport(p.decoded.generators, p.targets, storedGenerators, p.choices, opts.draftsOf);

function problemLabel(p: GeneratorFileProblem): string {
    const where = [p.generator, p.template].filter(Boolean).join(' › ');
    const at = p.line !== undefined ? ` (${p.line}:${p.column})` : '';
    return where ? `${where}${at}: ${p.message}` : p.message;
}

export function useGeneratorImport(opts: GeneratorImportOptions): { start: () => void; element: React.ReactElement } {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<Pending | null>(null);
    const optsRef = useRef(opts);
    optsRef.current = opts;

    const start = useCallback(() => inputRef.current?.click(), []);
    const close = useCallback(() => setPending(null), []);

    const commit = useCallback((plan: ImportPlan) => {
        if (!applyImportPlan(plan)) return;
        setPending(null);
        optsRef.current.onImported?.(plan.imported);
    }, []);

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const decoded = decodeGeneratorFile(await file.text());
        const o = optsRef.current;
        const next: Pending = { fileName: file.name, decoded, targets: decoded.generators.map(g => initialTarget(g.metamodel, o)), choices: {} };
        if (!o.alwaysShow && decoded.problems.length === 0 && decoded.generators.length > 0) {
            const plan = planOf(next, o);
            if (plan.errors.length === 0 && plan.collisions.length === 0) {
                commit(plan);
                return;
            }
        }
        setPending(next);
    };

    useEffect(() => {
        if (!pending) return undefined;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [pending, close]);

    const input = <input ref={inputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onFile} />;
    if (!pending) return { start, element: input };

    const fileErrors = pending.decoded.problems.filter(p => p.severity === 'error');
    const plan = fileErrors.length === 0 ? planOf(pending, opts) : null;
    const blocked = fileErrors.length > 0 || pending.decoded.generators.length === 0 || !plan || plan.errors.length > 0;
    const setTarget = (i: number, id: string) =>
        setPending(p => (p ? { ...p, targets: p.targets.map((t, j) => (j === i ? id || null : t)) } : p));
    const setChoice = (i: number, c: CollisionChoice) => setPending(p => (p ? { ...p, choices: { ...p.choices, [i]: c } } : p));

    const element = (
        <>
            {input}
            <div className="confirm-dialog-backdrop" onClick={close} aria-hidden="true" />
            <div className="confirm-dialog codegen-import" role="dialog" aria-modal="true" aria-labelledby="codegen-import-title">
                <div className="confirm-dialog-content codegen-import__content">
                    <h2 id="codegen-import-title" className="confirm-dialog-title">{`Import ${pending.fileName}`}</h2>
                    {pending.decoded.problems.length > 0 && (
                        <ul className="codegen-import__problems" aria-label="Problems">
                            {pending.decoded.problems.map((p, i) => (
                                <li key={i} className={`codegen-import__problem codegen-import__problem--${p.severity}`}>{problemLabel(p)}</li>
                            ))}
                        </ul>
                    )}
                    {pending.decoded.generators.length > 0 && (
                        <div className="codegen-import__rows">
                            {pending.decoded.generators.map((g, i) => {
                                const collision = plan?.collisions.find(c => c.index === i);
                                return (
                                    <div className="codegen-import__row" key={i}>
                                        <span className="codegen-import__name">{g.name}</span>
                                        <span className="codegen-import__count">{`${g.templates.length} template${g.templates.length === 1 ? '' : 's'}`}</span>
                                        {!opts.target && (
                                            <select
                                                className="codegen-import__select"
                                                aria-label={`Target metamodel of ${g.name}`}
                                                value={pending.targets[i] ?? ''}
                                                onChange={e => setTarget(i, e.target.value)}
                                            >
                                                <option value="">Choose a metamodel</option>
                                                {opts.metamodels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        )}
                                        {collision && (
                                            <select
                                                className="codegen-import__select"
                                                aria-label={`What to do with ${g.name}, which the metamodel already has`}
                                                value={pending.choices[i] ?? 'rename'}
                                                onChange={e => setChoice(i, e.target.value as CollisionChoice)}
                                            >
                                                <option value="rename">{`Import as «${collision.newName}»`}</option>
                                                <option value="replace">{`Replace «${g.name}» (${collision.existingTemplates} template${collision.existingTemplates === 1 ? '' : 's'})`}</option>
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {plan && plan.errors.length > 0 && (
                        <ul className="codegen-import__problems" aria-label="Why it cannot be imported">
                            {plan.errors.map((m, i) => <li key={i} className="codegen-import__problem codegen-import__problem--error">{m}</li>)}
                        </ul>
                    )}
                    <div className="confirm-dialog-actions">
                        <button type="button" className="confirm-dialog-btn confirm-dialog-btn--secondary" onClick={close}>Cancel</button>
                        <button
                            type="button"
                            className="confirm-dialog-btn confirm-dialog-btn--info"
                            disabled={blocked}
                            onClick={() => plan && commit(plan)}
                        >
                            Import
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
    return { start, element };
}
