/**
 * ImportDropZone Component
 * Wrapper component that enables drag & drop for Ecore/XMI files
 */

import React, { useState, useCallback, useRef } from 'react';
import { EcoreService, XMIService, EcoreImportResult, XMIImportResult } from '../../services/export';
import './ImportDropZone.scss';

interface ImportDropZoneProps {
    onImportMetamodel?: (result: EcoreImportResult) => void;
    onImportModel?: (result: XMIImportResult) => void;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export function ImportDropZone({
    onImportMetamodel,
    onImportModel,
    children,
    disabled = false,
    className = ''
}: ImportDropZoneProps): JSX.Element {
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const dragCounterRef = useRef(0);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled) return;

        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounterRef.current = 0;
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        setIsImporting(true);
        setImportStatus(null);

        const results: string[] = [];

        for (const file of files) {
            const extension = file.name.split('.').pop()?.toLowerCase();

            try {
                if (extension === 'ecore') {
                    if (onImportMetamodel) {
                        const result = await EcoreService.importFromFile(file);
                        onImportMetamodel(result);

                        if (result.success) {
                            results.push(`Metamodel "${result.model?.name}" imported`);
                        } else {
                            results.push(`Failed: ${result.errors.join(', ')}`);
                        }
                    } else {
                        results.push(`Metamodel import not configured`);
                    }
                } else if (extension === 'xmi') {
                    if (onImportModel) {
                        const result = await XMIService.importFromFile(file);
                        onImportModel(result);

                        if (result.success) {
                            results.push(`Model "${result.model?.name}" imported`);
                        } else {
                            results.push(`Failed: ${result.errors.join(', ')}`);
                        }
                    } else {
                        results.push(`Model import not configured`);
                    }
                } else {
                    results.push(`Unsupported file type: .${extension}`);
                }
            } catch (error) {
                results.push(`Error: ${(error as Error).message}`);
            }
        }

        setIsImporting(false);

        // Show status briefly
        const hasErrors = results.some(r => r.startsWith('Failed') || r.startsWith('Error') || r.startsWith('Unsupported'));
        setImportStatus({
            type: hasErrors ? 'error' : 'success',
            message: results.join('\n')
        });

        // Clear status after delay
        setTimeout(() => setImportStatus(null), 3000);

    }, [disabled, onImportMetamodel, onImportModel]);

    return (
        <div
            className={`import-drop-zone ${isDragging ? 'dragging' : ''} ${isImporting ? 'importing' : ''} ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            {/* Drag overlay */}
            {isDragging && (
                <div className="import-drop-zone__overlay import-drop-zone__overlay--drag">
                    <div className="import-drop-zone__content">
                        <i className="bi bi-file-earmark-arrow-down" />
                        <span className="import-drop-zone__title">Drop to import</span>
                        <span className="import-drop-zone__hint">
                            Supported: .ecore (metamodel), .xmi (model)
                        </span>
                    </div>
                </div>
            )}

            {/* Importing indicator */}
            {isImporting && (
                <div className="import-drop-zone__overlay import-drop-zone__overlay--loading">
                    <div className="import-drop-zone__content">
                        <i className="bi bi-arrow-repeat spinning" />
                        <span className="import-drop-zone__title">Importing...</span>
                    </div>
                </div>
            )}

            {/* Status message */}
            {importStatus && (
                <div className={`import-drop-zone__status import-drop-zone__status--${importStatus.type}`}>
                    <i className={`bi ${importStatus.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{importStatus.message}</span>
                </div>
            )}
        </div>
    );
}

export default ImportDropZone;
