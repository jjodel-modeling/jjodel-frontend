import React from 'react';

export interface ContextMenuItem {
    label?: string;
    icon?: string;
    danger?: boolean;
    disabled?: boolean;
    tooltip?: string;
    onClick?: () => void;
    divider?: boolean;
    /**
     * Section header: the name of the model element the items below belong to
     * (e.g. a composition reference). Rendered as a non-interactive row with
     * the label in the code font between two hairlines, never as a button.
     */
    header?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

/**
 * Context menu component for right-click actions on nodes and edges.
 * Supports regular items and dividers.
 */
function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    return (
        <>
            {/* Transparent backdrop to close menu on outside click */}
            <div className="context-menu-backdrop" onClick={onClose} />
            <div
                className="context-menu"
                style={{ left: x, top: y }}
            >
                {items.map((item, i) =>
                    item.divider ? (
                        <div key={i} className="context-menu__divider" />
                    ) : item.header ? (
                        <div key={i} className="context-menu__header" title={item.tooltip}>
                            {item.icon && <i className={`bi ${item.icon}`} />}
                            <span className="context-menu__header-label">{item.label}</span>
                        </div>
                    ) : (
                        <button
                            key={i}
                            className={`context-menu__item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                            disabled={item.disabled}
                            title={item.tooltip}
                            aria-disabled={item.disabled || undefined}
                            onClick={() => {
                                // console.log('[ContextMenu] clicked:', item.label, 'disabled:', item.disabled);
                                if (item.disabled) return;
                                item.onClick?.();
                                onClose();
                            }}
                        >
                            {item.icon && <i className={`bi ${item.icon}`} />}
                            <span>{item.label}</span>
                        </button>
                    )
                )}
            </div>
        </>
    );
}

export default ContextMenu;
