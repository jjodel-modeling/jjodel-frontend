import React from 'react';
import styles from './ListEditor.module.css';

export interface ListEditorProps<T> {
    /** The array being edited. */
    items: T[];
    /** Renders the body of a single row. */
    renderItem: (item: T, index: number) => React.ReactNode;
    /** Remove the entry at `index`. */
    onRemove: (index: number) => void;
    /** Move the entry at `index` by `delta` (-1 up, +1 down). Out-of-range is a no-op. */
    onMove: (index: number, delta: number) => void;
    /** Append a new entry; when omitted, no add button is rendered. */
    onAdd?: () => void;
    /** Label of the add button. */
    addLabel?: string;
    /** Muted text shown when the list is empty. */
    emptyHint?: string;
    /** Optional per-row header label (defaults to `#<n>`). */
    itemLabel?: (item: T, index: number) => string;
}

/**
 * ListEditor — generic, presentational shell for editing a reorderable T[].
 *
 * Pure UI: it owns no state and imports nothing from editor-v2. The parent
 * supplies immutable add/remove/move handlers and a row renderer. Reordering is
 * up/down buttons (no drag-and-drop dependency). Reused for the IR label,
 * compartment, segment and badge lists (authoring phase B2a).
 */
export function ListEditor<T>({
    items,
    renderItem,
    onRemove,
    onMove,
    onAdd,
    addLabel = 'Add',
    emptyHint,
    itemLabel,
}: ListEditorProps<T>): React.ReactElement {
    return (
        <div className={styles.list}>
            {items.length === 0 && emptyHint && (
                <div className={styles.empty}>{emptyHint}</div>
            )}

            {items.map((item, index) => (
                <div key={index} className={styles.entry}>
                    <div className={styles.entryHeader}>
                        <span className={styles.entryLabel}>
                            {itemLabel ? itemLabel(item, index) : `#${index + 1}`}
                        </span>
                        <div className={styles.controls}>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                aria-label="Move up"
                                disabled={index === 0}
                                onClick={() => onMove(index, -1)}
                            >
                                <i className="bi bi-arrow-up" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                aria-label="Move down"
                                disabled={index === items.length - 1}
                                onClick={() => onMove(index, 1)}
                            >
                                <i className="bi bi-arrow-down" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                aria-label="Remove"
                                onClick={() => onRemove(index)}
                            >
                                <i className="bi bi-trash" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                    <div className={styles.entryBody}>{renderItem(item, index)}</div>
                </div>
            ))}

            {onAdd && (
                <button type="button" className={styles.addBtn} onClick={onAdd}>
                    <i className="bi bi-plus-lg" aria-hidden="true" /> {addLabel}
                </button>
            )}
        </div>
    );
}

export default ListEditor;
