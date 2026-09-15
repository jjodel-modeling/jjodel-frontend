/**
 * TransformationsList Component
 * Displays list of transformations in project dashboard style
 */

import React, { useState, useRef, useEffect } from 'react';
import { JjtlTransformation } from '../types/transformation';
// Uses styles from project-editor.scss (list-card, context-menu, icon-btn)

interface TransformationsListProps {
    transformations: JjtlTransformation[];
    onOpen: (transformation: JjtlTransformation) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
}

export const TransformationsList: React.FC<TransformationsListProps> = ({
    transformations,
    onOpen,
    onRename,
    onDelete,
    onDuplicate,
}) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ align: 'left' | 'right'; direction: 'up' | 'down' }>({
        align: 'right',
        direction: 'down',
    });
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    // Click-outside handler for contextual menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [openMenu]);

    // Focus rename input
    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (openMenu === id) {
            setOpenMenu(null);
        } else {
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();

            const spaceOnRight = window.innerWidth - rect.right;
            const spaceOnLeft = rect.left;
            const align = spaceOnRight < 200 && spaceOnLeft > spaceOnRight ? 'left' : 'right';

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const direction = spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down';

            setMenuPosition({ align, direction });
            setOpenMenu(id);
        }
    };

    const closeMenu = () => setOpenMenu(null);

    const startRename = (transformation: JjtlTransformation) => {
        setRenamingId(transformation.id);
        setRenameValue(transformation.name);
        closeMenu();
    };

    const handleRenameSubmit = (transformation: JjtlTransformation) => {
        if (renameValue.trim() && renameValue.trim() !== transformation.name) {
            onRename(transformation.id, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleRenameCancel = () => {
        setRenamingId(null);
        setRenameValue('');
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent, transformation: JjtlTransformation) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(transformation);
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    const handleDelete = (id: string) => {
        closeMenu();
        onDelete(id);
    };

    const handleDuplicate = (id: string) => {
        closeMenu();
        onDuplicate(id);
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="list-card">
            {transformations.map((t) => (
                <div
                    className={`list-card__item ${openMenu === t.id ? 'list-card__item--menu-open' : ''}`}
                    key={t.id}
                    onClick={() => onOpen(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpen(t);
                        }
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {/* Icon */}
                    <span className="list-card__icon list-card__icon--transformation">
                        <i className="bi bi-arrow-left-right" />
                    </span>

                    {/* Content */}
                    <div className="list-card__content" style={{ pointerEvents: 'none' }}>
                        {renamingId === t.id ? (
                            <input
                                ref={renameInputRef}
                                type="text"
                                className="list-card__rename-input"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRenameSubmit(t)}
                                onKeyDown={(e) => handleRenameKeyDown(e, t)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ pointerEvents: 'auto' }}
                            />
                        ) : (
                            <>
                                <div className="list-card__name">{t.name}</div>
                                <div className="list-card__type">
                                    {t.sourceMetamodelName} → {t.targetMetamodelName}
                                    {t.isValid === false && (
                                        <span className="list-card__error-badge">
                                            <i className="bi bi-exclamation-circle" />
                                            {t.errorCount || 0}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="list-card__actions">
                        <button
                            className="icon-btn icon-btn--menu"
                            title="More actions"
                            onClick={(e) => toggleMenu(t.id, e)}
                        >
                            <i className="bi bi-three-dots-vertical" />
                        </button>

                        {/* Contextual Menu */}
                        {openMenu === t.id && (
                            <div
                                className="context-menu"
                                ref={menuRef}
                                data-align={menuPosition.align}
                                data-direction={menuPosition.direction}
                            >
                                <button
                                    className="context-menu__item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpen(t);
                                        closeMenu();
                                    }}
                                >
                                    <i className="bi bi-box-arrow-up-right" />
                                    Open
                                </button>
                                <button
                                    className="context-menu__item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicate(t.id);
                                    }}
                                >
                                    <i className="bi bi-copy" />
                                    Duplicate
                                </button>
                                <div className="context-menu__divider" />
                                <button
                                    className="context-menu__item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startRename(t);
                                    }}
                                >
                                    <i className="bi bi-pencil" />
                                    Rename
                                </button>
                                <div className="context-menu__divider" />
                                <button
                                    className="context-menu__item context-menu__item--danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(t.id);
                                    }}
                                >
                                    <i className="bi bi-trash" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TransformationsList;
