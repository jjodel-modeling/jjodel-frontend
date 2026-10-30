/**
 * GeneratorsSection — the GENERATORS section of the project dashboard (P-2026-10-30-1430, P-2026-10-30-1515;
 * discovery_2026-10-30_generator_import_export §6, decision 8).
 *
 * Loaded lazily by ProjectEditor, only with the codegen setting on and outside consumer mode (R-GEN-42, R-GEN-23),
 * so the dashboard's eager code imports nothing of `codegen/` but `setting.ts` (R-GEN-2). One row per stored
 * generator of the project's metamodels, as the left bar lists them: a metamodel holding neither key has no row. A row
 * shows the generator, its metamodel and its template count, with Export (none for a generator with no template)
 * and Open (its Templates tab). The header has Import, which always shows the dialog to choose the targets, and
 * Export all, one file of every generator with a template. The header component is ProjectEditor's own, passed in.
 */

import React, { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { EmptyState } from '../../components/ui/EmptyState';
import { GEN_TEMPLATES_KEY } from '../engine/templateCodec';
import { decodeGenerators, GEN_GENERATORS_KEY } from '../engine/generatorCodec';
import { exportAllGenerators, exportGenerator } from './generatorTransfer';
import type { MetamodelRef } from './generatorTransfer';
import { useGeneratorImport } from './GeneratorImportDialog';
import { openTemplateEditor } from './openTemplateEditor';
import { templateTabDrafts } from './TemplateEditorTab';

/** The props of ProjectEditor's SectionHeader that this section uses. */
export interface GeneratorsSectionHeaderProps {
    title: string;
    count: number;
    primaryAction?: { label: string; onClick: () => void; disabled?: boolean; disabledTitle?: string };
    secondaryAction?: { label: string; onClick: () => void; icon?: string };
}

export interface GeneratorsSectionProps {
    readonly SectionHeader: React.ComponentType<GeneratorsSectionHeaderProps>;
    readonly metamodels: readonly MetamodelRef[];
    readonly projectName: string;
}

interface Row {
    readonly metamodel: MetamodelRef;
    readonly id: string;
    readonly name: string;
    readonly templates: number;
}

const storedKey = (v: unknown): string | null | undefined => (typeof v === 'string' ? v : v === undefined || v === null ? v : String(v));

export default function GeneratorsSection({ SectionHeader, metamodels, projectName }: GeneratorsSectionProps): React.ReactElement {
    // The two keys of every metamodel, flat, so a write to any of them re-renders the section.
    const keys = useSelector((state: any) => metamodels.flatMap(m => {
        const bag = state.idlookup?.[m.id]?._state;
        return [storedKey(bag?.[GEN_TEMPLATES_KEY]), storedKey(bag?.[GEN_GENERATORS_KEY])];
    }), shallowEqual);
    const rows = useMemo<Row[]>(() => metamodels.flatMap((m, i) => {
        const rawT = keys[2 * i];
        const rawG = keys[2 * i + 1];
        if (rawT == null && rawG == null) return [];
        return decodeGenerators(rawT, rawG).generators.map(g => ({ metamodel: m, id: g.id, name: g.name, templates: g.templates.length }));
    }), [metamodels, keys]);
    const exportable = rows.some(r => r.templates > 0);
    const importer = useGeneratorImport({ metamodels, alwaysShow: true, draftsOf: templateTabDrafts });

    return (
        <div className="project-section" id="section-generators">
            <SectionHeader
                title="GENERATORS"
                count={rows.length}
                secondaryAction={{ label: 'Import', icon: 'box-arrow-in-down', onClick: importer.start }}
                primaryAction={{
                    label: 'Export all',
                    onClick: () => { exportAllGenerators(projectName, metamodels); },
                    disabled: !exportable,
                    disabledTitle: 'No generator has a template to export',
                }}
            />
            {rows.length === 0 ? (
                <EmptyState
                    icon="bi-code-slash"
                    title="No generators yet"
                    description="Generators turn models into text through templates. Import one from a JSON file, or open a metamodel's Templates tab."
                    action={{ label: 'Import a Generator', onClick: importer.start }}
                />
            ) : (
                <div className="list-card">
                    {rows.map(r => {
                        const open = () => { openTemplateEditor(r.metamodel.id, r.metamodel.name, null, r.id); };
                        return (
                            <div className="list-card__item" key={`${r.metamodel.id}:${r.id}`}>
                                <span className="list-card__icon" style={{ cursor: 'pointer' }} onClick={open}>G</span>
                                <div className="list-card__content" style={{ cursor: 'pointer' }} onClick={open}>
                                    <div className="list-card__name">{r.name}</div>
                                    <div className="list-card__type">
                                        {`${r.metamodel.name} · ${r.templates} ${r.templates === 1 ? 'template' : 'templates'}`}
                                    </div>
                                </div>
                                <div className="list-card__actions">
                                    <button
                                        className="icon-btn"
                                        title={r.templates > 0 ? 'Export as JSON' : 'No template to export'}
                                        disabled={r.templates === 0}
                                        onClick={() => exportGenerator(r.metamodel, r.id)}
                                    >
                                        <i className="bi bi-box-arrow-up" />
                                    </button>
                                    <button className="icon-btn" title="Open the Templates tab" onClick={open}>
                                        <i className="bi bi-box-arrow-up-right" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {importer.element}
        </div>
    );
}
