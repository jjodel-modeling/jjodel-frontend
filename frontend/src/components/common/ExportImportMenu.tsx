/**
 * ExportImportMenu Component
 * Dropdown menu for exporting/importing metamodels and models
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ExportImportMenu.scss';

interface ExportImportMenuProps {
    type: 'metamodel' | 'model';
    onExport: () => void;
    onImport: (file: File) => void;
    className?: string;
    disabled?: boolean;
}

export function ExportImportMenu({
    type,
    onExport,
    onImport,
    className = '',
    disabled = false
}: ExportImportMenuProps): JSX.Element {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fileExtension = type === 'metamodel' ? '.ecore' : '.xmi';
    const formatName = type === 'metamodel' ? 'Ecore' : 'XMI';

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showMenu]);

    const handleExport = useCallback(() => {
        setShowMenu(false);
        onExport();
    }, [onExport]);

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setShowMenu(false);
            onImport(file);
            // Reset file input
            e.target.value = '';
        }
    }, [onImport]);

    const toggleMenu = useCallback(() => {
        if (!disabled) {
            setShowMenu(prev => !prev);
        }
    }, [disabled]);

    return (
        <div className={`export-import-menu ${className}`} ref={menuRef}>
            <button
                className="export-import-menu__trigger"
                onClick={toggleMenu}
                disabled={disabled}
                title="Export/Import options"
                aria-expanded={showMenu}
                aria-haspopup="true"
            >
                <i className="bi bi-three-dots-vertical" />
            </button>

            {showMenu && (
                <div className="export-import-menu__dropdown" role="menu">
                    <button
                        className="export-import-menu__item"
                        onClick={handleExport}
                        role="menuitem"
                    >
                        <i className="bi bi-download" />
                        <span>Export as {formatName}</span>
                        <span className="export-import-menu__hint">{fileExtension}</span>
                    </button>
                    <button
                        className="export-import-menu__item"
                        onClick={handleImportClick}
                        role="menuitem"
                    >
                        <i className="bi bi-upload" />
                        <span>Import {formatName}</span>
                        <span className="export-import-menu__hint">{fileExtension}</span>
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={fileExtension}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
            />
        </div>
    );
}

export default ExportImportMenu;
