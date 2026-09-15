/**
 * MegamodelContextMenu — Lightweight context menu for the Megamodel diagram.
 *
 * Renders a positioned menu of actions via portal. Closes on click-outside,
 * Escape, or scroll. Supports separators, shortcuts, and danger items.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

export interface MenuItem {
    label: string;
    icon: string;
    shortcut?: string;
    action: () => void;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
}

interface MegamodelContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}

const MegamodelContextMenu: React.FC<MegamodelContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handler);
        };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation(); // don't close the modal
                onClose();
            }
        };
        document.addEventListener('keydown', handler, true);
        return () => document.removeEventListener('keydown', handler, true);
    }, [onClose]);

    // Close on scroll
    useEffect(() => {
        const handler = () => onClose();
        window.addEventListener('scroll', handler, true);
        return () => window.removeEventListener('scroll', handler, true);
    }, [onClose]);

    // Viewport-safe positioning
    const adjustedPosition = useMemo(() => {
        const menuWidth = 200;
        const nonSepItems = items.filter(i => !i.separator).length;
        const sepItems = items.filter(i => i.separator).length;
        const menuHeight = nonSepItems * 32 + sepItems * 9 + 8; // items + separators + padding
        return {
            x: Math.min(x, window.innerWidth - menuWidth - 8),
            y: Math.min(y, window.innerHeight - menuHeight - 8),
        };
    }, [x, y, items]);

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="mm-context-menu"
            style={{
                position: 'fixed',
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                zIndex: 100001,
            }}
        >
            {items.map((item, i) => {
                if (item.separator) {
                    return <div key={i} className="mm-context-menu__sep" />;
                }
                return (
                    <button
                        key={i}
                        className={`mm-context-menu__item${item.danger ? ' mm-context-menu__item--danger' : ''}`}
                        disabled={item.disabled}
                        onClick={() => {
                            item.action();
                            onClose();
                        }}
                    >
                        <i className={`bi ${item.icon}`} />
                        <span className="mm-context-menu__label">{item.label}</span>
                        {item.shortcut && (
                            <span className="mm-context-menu__shortcut">{item.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

export default MegamodelContextMenu;
