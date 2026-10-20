import React, { useState } from 'react';

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
    /**
     * Cascade: the item opens a second panel beside it, on hover or click,
     * listing these items; its own `onClick` is not called.
     */
    children?: ContextMenuItem[];
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

/** Width a cascade panel is assumed to need when deciding to open it on the left. */
const CASCADE_FLIP_WIDTH = 220;

/** One panel of the menu: the root one, or the panel a cascade item opens. */
function MenuPanel({ x, y, items, onClose }: ContextMenuProps) {
    const [open, setOpen] = useState<{ index: number; x: number; y: number } | null>(null);

    const openCascade = (index: number, target: HTMLElement) => {
        const r = target.getBoundingClientRect();
        const left = r.right + CASCADE_FLIP_WIDTH > window.innerWidth ? r.left - CASCADE_FLIP_WIDTH : r.right;
        setOpen({ index, x: left, y: r.top - 6 });
    };
    const opened = open !== null ? items[open.index] : undefined;

    return (
        <>
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
                    ) : item.children ? (
                        <button
                            key={i}
                            className={`context-menu__item context-menu__item--cascade ${open?.index === i ? 'open' : ''} ${item.disabled ? 'disabled' : ''}`}
                            disabled={item.disabled}
                            title={item.tooltip}
                            aria-disabled={item.disabled || undefined}
                            aria-haspopup="menu"
                            aria-expanded={open?.index === i}
                            onMouseEnter={(e) => { if (!item.disabled) openCascade(i, e.currentTarget); }}
                            onClick={(e) => { if (!item.disabled) openCascade(i, e.currentTarget); }}
                        >
                            {item.icon && <i className={`bi ${item.icon}`} />}
                            <span>{item.label}</span>
                            <i className="bi bi-chevron-right context-menu__chevron" />
                        </button>
                    ) : (
                        <button
                            key={i}
                            className={`context-menu__item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                            disabled={item.disabled}
                            title={item.tooltip}
                            aria-disabled={item.disabled || undefined}
                            onMouseEnter={() => setOpen(null)}
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
            {open !== null && opened?.children && (
                <MenuPanel x={open.x} y={open.y} items={opened.children} onClose={onClose} />
            )}
        </>
    );
}

/**
 * Context menu component for right-click actions on nodes, edges and the pane.
 * Supports regular items, dividers, headers and one-panel-per-level cascades.
 */
function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    return (
        <>
            {/* Transparent backdrop to close menu on outside click */}
            <div className="context-menu-backdrop" onClick={onClose} />
            <MenuPanel x={x} y={y} items={items} onClose={onClose} />
        </>
    );
}

export default ContextMenu;
