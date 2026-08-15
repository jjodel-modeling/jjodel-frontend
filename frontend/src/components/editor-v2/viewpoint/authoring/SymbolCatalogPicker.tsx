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
 */

import React, { useMemo, useState } from 'react';
import { Button, Input, Select } from '../../../ui';
import { CATALOG_NOTATIONS, filterCatalog, type SymbolPreset } from '../ir/notationCatalog';
import SymbolPreview from './SymbolPreview';

export interface SymbolCatalogPickerProps {
    onApply: (preset: SymbolPreset) => void;
}

const NOTATION_OPTIONS = [
    { value: '', label: 'All notations' },
    ...CATALOG_NOTATIONS.map((n) => ({ value: n, label: n })),
];

const cellStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'transparent', border: '1px solid var(--border-default)',
    borderRadius: 6, padding: '6px 2px 4px', cursor: 'pointer', minWidth: 0,
};

const cellLabelStyle: React.CSSProperties = {
    fontSize: 10, lineHeight: 1.2, color: 'var(--color-text-primary, #334155)',
    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

export const SymbolCatalogPicker: React.FC<SymbolCatalogPickerProps> = ({ onApply }) => {
    const [open, setOpen] = useState(false);
    const [notation, setNotation] = useState('');
    const [query, setQuery] = useState('');

    const presets = useMemo(() => filterCatalog(notation, query), [notation, query]);

    if (!open) {
        return (
            <div className="jj-field">
                <Button variant="secondary" onClick={() => setOpen(true)}>
                    Browse symbol catalog
                </Button>
            </div>
        );
    }

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
};

export default SymbolCatalogPicker;
