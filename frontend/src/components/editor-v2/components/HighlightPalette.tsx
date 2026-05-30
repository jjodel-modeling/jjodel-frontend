interface HighlightPaletteProps {
    activeColor: number;                 // 1..5
    onSelect: (n: number) => void;
    onClear: () => void;
}

const COLOR_INDICES = [1, 2, 3, 4, 5];

/**
 * Toolbar palette for highlight mode (figure authoring). Pure presentation:
 * 5 color swatches + a clear button. Swatch backgrounds use the theme-adaptive
 * `--hl-N` CSS variables (defined in EditorV2.scss) so they always match the
 * active color scheme. State lives in EditorV2; this only emits callbacks.
 */
function HighlightPalette({ activeColor, onSelect, onClear }: HighlightPaletteProps) {
    return (
        <div className="toolbar-group hl-palette" role="group" aria-label="Highlight colors">
            {COLOR_INDICES.map(n => (
                <button
                    key={n}
                    type="button"
                    className={`hl-palette__swatch ${activeColor === n ? 'active' : ''}`}
                    onClick={() => onSelect(n)}
                    title={`Highlight color ${n}`}
                    aria-pressed={activeColor === n}
                >
                    <span className="hl-palette__dot" style={{ background: `var(--hl-${n})` }} />
                </button>
            ))}
            <button
                type="button"
                className="toolbar-btn hl-palette__clear"
                onClick={onClear}
                title="Clear all highlights"
            >
                <i className="bi bi-eraser" />
            </button>
        </div>
    );
}

export default HighlightPalette;
