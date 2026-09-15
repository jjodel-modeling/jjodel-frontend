/**
 * Module-level drag state for M1 palette → onDragOver cursor feedback.
 *
 * Browser security: dataTransfer.getData() is unavailable during dragover,
 * so the PalettePanel sets this in onDragStart and clears it in onDragEnd.
 *
 * Kept in a separate file to avoid circular imports between
 * EditorV2.tsx ↔ PalettePanel.tsx.
 */
let _draggedMetaclassId: string | null = null;

export function setDraggedMetaclassId(id: string | null) {
    _draggedMetaclassId = id;
}

export function getDraggedMetaclassId(): string | null {
    return _draggedMetaclassId;
}
