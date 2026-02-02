/**
 * Export Image Menu Component
 * Dropdown menu for exporting canvas as image in various formats
 */

import React, { useState, useRef, useEffect, RefObject } from 'react';
import { useCanvasExport } from '../../hooks/useCanvasExport';
import { ExportFormat } from '../../services/CanvasExportService';
import './ExportImageMenu.scss';

interface ExportImageMenuProps {
    /** Reference to the canvas element to export */
    canvasRef: RefObject<HTMLElement>;
    /** Optional filename prefix (without extension) */
    filename?: string;
    /** Optional title to include in export */
    title?: string;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost';
    /** Button size */
    size?: 'sm' | 'md';
    /** Callback when export succeeds */
    onExportSuccess?: (format: ExportFormat) => void;
    /** Callback when export fails */
    onExportError?: (error: string) => void;
}

interface FormatOption {
    format: ExportFormat;
    label: string;
    description: string;
    icon: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
    {
        format: 'png',
        label: 'PNG',
        description: 'Best for transparency',
        icon: 'bi-file-image',
    },
    {
        format: 'jpeg',
        label: 'JPEG',
        description: 'Smaller file size',
        icon: 'bi-file-image',
    },
    {
        format: 'svg',
        label: 'SVG',
        description: 'Vector format, scalable',
        icon: 'bi-filetype-svg',
    },
];

export function ExportImageMenu({
    canvasRef,
    filename,
    title,
    variant = 'secondary',
    size = 'md',
    onExportSuccess,
    onExportError,
}: ExportImageMenuProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [includeTitle, setIncludeTitle] = useState(false);
    const [includeTimestamp, setIncludeTimestamp] = useState(false);
    const [scale, setScale] = useState(2);
    const menuRef = useRef<HTMLDivElement>(null);

    const { exportAs, copyToClipboard, isExporting, error } = useCanvasExport(canvasRef, {
        filename,
        padding: 40,
        backgroundColor: '#ffffff',
    });

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Report errors
    useEffect(() => {
        if (error && onExportError) {
            onExportError(error);
        }
    }, [error, onExportError]);

    const handleExport = async (format: ExportFormat) => {
        const success = await exportAs(format, {
            title: includeTitle ? title : undefined,
            includeTimestamp,
            scale,
        });

        if (success) {
            setIsOpen(false);
            onExportSuccess?.(format);
        }
    };

    const handleCopyToClipboard = async () => {
        const success = await copyToClipboard();

        if (success) {
            setIsOpen(false);
            onExportSuccess?.('png');
        }
    };

    const buttonClass = `export-menu__trigger btn btn--${variant} btn--${size}`;

    return (
        <div className="export-menu" ref={menuRef}>
            <button
                className={buttonClass}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                title="Export as image"
            >
                {isExporting ? (
                    <i className="bi bi-arrow-repeat export-menu__spinner" />
                ) : (
                    <i className="bi bi-image" />
                )}
                <span>Export</span>
                <i className="bi bi-chevron-down export-menu__chevron" />
            </button>

            {isOpen && (
                <div className="export-menu__dropdown">
                    <div className="export-menu__header">
                        <span className="export-menu__title">Export Image</span>
                        <button
                            className="export-menu__options-toggle"
                            onClick={() => setShowOptions(!showOptions)}
                            title="Export options"
                        >
                            <i className="bi bi-gear" />
                        </button>
                    </div>

                    {showOptions && (
                        <div className="export-menu__options">
                            {title && (
                                <label className="export-menu__option">
                                    <input
                                        type="checkbox"
                                        checked={includeTitle}
                                        onChange={(e) => setIncludeTitle(e.target.checked)}
                                    />
                                    <span>Include title</span>
                                </label>
                            )}
                            <label className="export-menu__option">
                                <input
                                    type="checkbox"
                                    checked={includeTimestamp}
                                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                                />
                                <span>Include timestamp</span>
                            </label>
                            <div className="export-menu__option export-menu__option--scale">
                                <span>Resolution</span>
                                <select
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="export-menu__select"
                                >
                                    <option value={1}>1x (Standard)</option>
                                    <option value={2}>2x (Retina)</option>
                                    <option value={3}>3x (High-res)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="export-menu__formats">
                        {FORMAT_OPTIONS.map((option) => (
                            <button
                                key={option.format}
                                className="export-menu__format"
                                onClick={() => handleExport(option.format)}
                                disabled={isExporting}
                            >
                                <i className={option.icon} />
                                <div className="export-menu__format-info">
                                    <span className="export-menu__format-label">{option.label}</span>
                                    <span className="export-menu__format-desc">{option.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="export-menu__divider" />

                    <button
                        className="export-menu__clipboard"
                        onClick={handleCopyToClipboard}
                        disabled={isExporting}
                    >
                        <i className="bi bi-clipboard" />
                        <span>Copy to clipboard</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportImageMenu;
