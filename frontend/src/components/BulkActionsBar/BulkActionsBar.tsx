import React, { JSX } from 'react';
import './bulk-actions-bar.scss';

interface BulkActionsBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onDelete: () => void;
    onExport: () => void;
    onAddTag: () => void;
    onCancel: () => void;
}

/**
 * BulkActionsBar - Sticky bar for bulk operations on selected projects
 *
 * Appears when one or more projects are selected in list view.
 * Provides Delete, Export, and Add Tag actions.
 */
export function BulkActionsBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onDelete,
    onExport,
    onAddTag,
    onCancel
}: BulkActionsBarProps): JSX.Element | null {
    if (selectedCount === 0) return null;

    const allSelected = selectedCount === totalCount && totalCount > 0;

    return (
        <div className="bulk-actions-bar">
            <div className="bulk-actions-bar__left">
                {/* Select All Checkbox */}
                <label className="bulk-actions-bar__select-all">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onSelectAll}
                        className="bulk-checkbox"
                    />
                    <span className="bulk-actions-bar__count">
                        {selectedCount} project{selectedCount > 1 ? 's' : ''} selected
                    </span>
                </label>
            </div>

            <div className="bulk-actions-bar__actions">
                <button
                    className="bulk-action-btn bulk-action-btn--danger"
                    onClick={onDelete}
                    title="Delete selected projects"
                >
                    <i className="bi bi-trash" />
                    <span>Delete</span>
                </button>

                <button
                    className="bulk-action-btn"
                    onClick={onExport}
                    title="Export selected projects"
                >
                    <i className="bi bi-download" />
                    <span>Export</span>
                </button>

                <button
                    className="bulk-action-btn"
                    onClick={onAddTag}
                    title="Add tag to selected projects"
                >
                    <i className="bi bi-tag" />
                    <span>Add Tag</span>
                </button>

                <button
                    className="bulk-action-btn bulk-action-btn--secondary"
                    onClick={onCancel}
                    title="Clear selection"
                >
                    <span>Cancel</span>
                </button>
            </div>
        </div>
    );
}

export default BulkActionsBar;
