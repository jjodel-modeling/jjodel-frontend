/**
 * SymbolCatalogPicker — il catalogo dei simboli nel pannello di authoring (D10).
 *
 * Catalogo e wizard sono due viste dello stesso valore: cliccare un preset
 * scrive i campi IR (form, border, marker, fill) che i controlli sottostanti
 * gia' editano, e il pannello di ritocco si trova «gia' popolato sul preset».
 * Nessun tipo nuovo persiste: il preset applicato non lascia traccia di se'.
 *
 * UI: sezione a disclosure (niente Modal: non esportato dal barrel ui), con
 * filtro per notazione, ricerca testuale e griglia di anteprime. Il commit
 * debounced del pannello fa da live preview: cliccando piu' preset in fila si
 * vede il nodo cambiare sul canvas.
 *
 * D18 (column variant only): search-first column with notation chips instead
 * of the Select, a recents strip fed by the host, and collapsible sections
 * with counters. The index is derived: the data table is untouched. The
 * disclosure variant keeps the pre-D18 flat rendering.
 *
 * D24 (column variant only): sections are semantic FAMILIES
 * (catalogFamilySections), the notation degrades to provenance: a tag on the
 * tile in mixed families, and the chips become an orthogonal filter that
 * narrows tiles inside every section with the same suspension semantics as
 * the search.
 */

import React, { useMemo, useState } from 'react';
import { Button, Input, Select } from '../../../ui';
import {
    CATALOG_FAMILIES,
    CATALOG_NOTATIONS,
    catalogFamilySections,
    filterCatalog,
    getCatalogPreset,
    NOTATION_CATALOG,
    type SymbolPreset,
} from '../ir/notationCatalog';
import SymbolPreview from './SymbolPreview';

export interface SymbolCatalogPickerProps {
    onApply: (preset: SymbolPreset) => void;
    /**
     * 'disclosure' (default): Browse/Hide gate, the pre-D15b behavior, kept for
     * any other mount. 'column': always open, no gate and no Hide button — the
     * persistent catalog column of the symbol editor modal (D15b); the host
     * provides the container and its styling.
     */
    variant?: 'disclosure' | 'column';
    /**
     * Recent preset ids, most recent first (column variant only, D18). Unknown
     * ids are dropped at render, which keeps the strip safe when the catalog
     * evolves (and, later, when D17 stencil ids share the same store).
     */
    recentIds?: readonly string[];
}

const NOTATION_OPTIONS = [
    { value: '', label: 'All notations' },
    ...CATALOG_NOTATIONS.map((n) => ({ value: n, label: n })),
];

/**
 * Families whose presets span more than one notation (D24): only there the
 * tile shows its provenance tag; in a pure family the tag would repeat the
 * section header. Derived once from the table, no new export needed.
 */
const MIXED_FAMILIES: ReadonlySet<string> = new Set(
    CATALOG_FAMILIES.filter((f) =>
        new Set(NOTATION_CATALOG.filter((p) => p.family === f).map((p) => p.notation)).size > 1),
);

const cellStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'transparent', border: '1px solid var(--border-default)',
    borderRadius: 6, padding: '6px 2px 4px', cursor: 'pointer', minWidth: 0,
};

const cellLabelStyle: React.CSSProperties = {
    fontSize: 10, lineHeight: 1.2, color: 'var(--color-text-primary, #334155)',
    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

export const SymbolCatalogPicker: React.FC<SymbolCatalogPickerProps> = ({ onApply, variant = 'disclosure', recentIds }) => {
    const column = variant === 'column';
    const [open, setOpen] = useState(false);
    const [notation, setNotation] = useState('');
    const [query, setQuery] = useState('');
    // D18/D24: per-family collapse, alive exactly as long as the picker is
    // mounted (the modal unmounts it on close: collapse persists for the
    // duration of the modal by construction). Default per go-ahead D24:
    // first family (Base) expanded, the others collapsed.
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
        () => new Set(CATALOG_FAMILIES.slice(1)),
    );

    const presets = useMemo(() => filterCatalog(notation, query), [notation, query]);
    const searching = query.trim() !== '';
    // D24: with family sections the notation chip is no longer a section
    // selector, it filters tiles INSIDE every section, composing with the
    // query. Both filters share the same suspension semantics below.
    const filtering = notation !== '';
    const filtersActive = searching || filtering;
    // Derived family-section index (D24). The index keeps empty sections;
    // hiding them under an active filter is a UI choice made below: a "0" row
    // in a 264px column is noise, and clearing the filters brings the section
    // back.
    const sections = useMemo(
        () => (column ? catalogFamilySections(query, notation) : []),
        [column, query, notation],
    );
    const recents = useMemo(
        () => (column ? (recentIds ?? []).map(getCatalogPreset).filter((p): p is SymbolPreset => p !== undefined) : []),
        [column, recentIds],
    );

    if (!column && !open) {
        return (
            <div className="jj-field">
                <Button variant="secondary" onClick={() => setOpen(true)}>
                    Browse symbol catalog
                </Button>
            </div>
        );
    }

    if (!column) {
        return (
            <div className="jj-field">
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <Select
                        options={NOTATION_OPTIONS}
                        value={notation}
                        onChange={(e) => setNotation(e.target.value)}
                        aria-label="Notation filter"
                    />
                    <Button variant="secondary" onClick={() => setOpen(false)}>Hide</Button>
                </div>
                <Input
                    value={query}
                    placeholder="Search: gateway, timer, entity…"
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search symbols"
                />
                <div
                    style={{
                        display: 'grid', gap: 6, marginTop: 6,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                    }}
                >
                    {presets.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            style={cellStyle}
                            title={`${p.label} — ${p.notation}`}
                            aria-label={`Apply ${p.label} (${p.notation})`}
                            onClick={() => onApply(p)}
                        >
                            <SymbolPreview preset={p} />
                            <span style={cellLabelStyle}>{p.label}</span>
                        </button>
                    ))}
                    {presets.length === 0 && (
                        <span style={{ ...cellLabelStyle, gridColumn: '1 / -1', textAlign: 'left' }}>
                            No symbol matches this search.
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // ── column variant (D18): search-first, chips, recents, sections ──

    const toggleSection = (n: string) => setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(n)) next.delete(n);
        else next.add(n);
        return next;
    });

    // Chip semantics (D24): single selection with toggle as in D18, but the
    // active chip filters tiles across the family sections instead of
    // selecting a section; sections emptied by the filters are hidden.
    const visibleSections = sections.filter((s) => !filtersActive || s.presets.length > 0);

    return (
        <div className="jj-field symbol-catalog">
            <Input
                value={query}
                placeholder="Search symbol or notation…"
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search symbols"
            />
            <div className="symbol-catalog__chips" role="group" aria-label="Notation filter">
                {['', ...CATALOG_NOTATIONS].map((n) => (
                    <button
                        key={n === '' ? '__all' : n}
                        type="button"
                        className={`symbol-catalog__chip${notation === n ? ' is-active' : ''}`}
                        aria-pressed={notation === n}
                        onClick={() => setNotation(n !== '' && notation !== n ? n : '')}
                    >
                        {n === '' ? 'All' : n}
                    </button>
                ))}
            </div>
            {recents.length > 0 && (
                <div className="symbol-catalog__recents">
                    <span className="symbol-catalog__recents-label">Recent</span>
                    {recents.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            className="symbol-catalog__recent"
                            title={`${p.label} · ${p.notation}`}
                            aria-label={`Apply ${p.label} (${p.notation})`}
                            onClick={() => onApply(p)}
                        >
                            <SymbolPreview preset={p} width={26} />
                        </button>
                    ))}
                </div>
            )}
            <div className="symbol-catalog__sections">
                {visibleSections.map((s) => {
                    // While a filter is active (search or chip), collapse is
                    // suspended: a filter that hides its own results behind a
                    // closed header reads as broken. The user's collapse map
                    // is untouched and comes back when the filters clear.
                    const isCollapsed = !filtersActive && collapsed.has(s.family);
                    return (
                        <section key={s.family} className="symbol-catalog__section">
                            <button
                                type="button"
                                className="symbol-catalog__section-head"
                                aria-expanded={!isCollapsed}
                                disabled={filtersActive}
                                onClick={() => toggleSection(s.family)}
                            >
                                <i className={`bi bi-chevron-${isCollapsed ? 'right' : 'down'}`} aria-hidden="true" />
                                <span>{s.family}</span>
                                <span className="symbol-catalog__section-count">
                                    {filtersActive ? s.presets.length : s.total}
                                </span>
                            </button>
                            {!isCollapsed && (
                                <div className="symbol-catalog__tiles">
                                    {s.presets.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className="symbol-catalog__tile"
                                            title={`${p.label} · ${p.notation}`}
                                            aria-label={`Apply ${p.label} (${p.notation})`}
                                            onClick={() => onApply(p)}
                                        >
                                            {MIXED_FAMILIES.has(s.family) && (
                                                <span className="symbol-catalog__tag" aria-hidden="true">{p.notation}</span>
                                            )}
                                            <SymbolPreview preset={p} width={44} />
                                            <span className="symbol-catalog__tile-name">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}
                {filtersActive && visibleSections.length === 0 && (
                    <span className="symbol-catalog__empty">No symbol matches this search.</span>
                )}
            </div>
        </div>
    );
};

export default SymbolCatalogPicker;
