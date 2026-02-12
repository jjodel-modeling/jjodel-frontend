import React from 'react';

interface ContextMenuItem {
    label: string;
    icon?: string;
    danger?: boolean;
    onClick: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

/**
 * Context menu component for right-click actions on nodes and edges.
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
                {items.map((item, i) => (
                    <button
                        key={i}
                        className={`context-menu__item ${item.danger ? 'danger' : ''}`}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                    >
                        {item.icon && <i className={`bi ${item.icon}`} />}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export default ContextMenu;
