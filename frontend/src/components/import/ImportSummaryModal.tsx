import React, { useState, useEffect, useRef } from 'react';
import { ImportSummary } from './ImportSummary.types';
import { JjodelEvents } from '../../events/registry';
import './ImportSummaryModal.scss';

function statusTitle(status: ImportSummary['status']): string {
    switch (status) {
        case 'success': return 'Import successful';
        case 'success-with-warnings': return 'Import successful with warnings';
        case 'error': return 'Import failed';
    }
}

function statusIcon(status: ImportSummary['status']): string {
    switch (status) {
        case 'success': return 'bi-check-circle-fill';
        case 'success-with-warnings': return 'bi-exclamation-circle-fill';
        case 'error': return 'bi-x-circle-fill';
    }
}

function formatSummaryForClipboard(s: ImportSummary): string {
    const lines: string[] = [];
    lines.push('Jjodel Import Summary');
    lines.push('=====================');
    lines.push(`File: ${s.fileName}`);
    const statusLabel =
        s.status === 'error' ? 'Failed'
        : s.status === 'success' ? 'Success'
        : 'Success with warnings';
    lines.push(`Status: ${statusLabel}`);
    lines.push(`Type: ${s.kind === 'metamodel' ? 'Metamodel' : 'Model'}`);
    lines.push('');

    if (s.status !== 'error') {
        lines.push('Identity:');
        if (s.kind === 'metamodel') {
            lines.push(`  Model name: ${s.modelName}`);
            lines.push(`  Root package: ${s.rootPackageName}`);
            lines.push(`  nsURI: ${s.rootPackageNsURI}`);
        } else {
            lines.push(`  Model name: ${s.modelName}`);
            lines.push(`  Metamodel: ${s.metamodelName}`);
            lines.push(`  nsURI: ${s.metamodelNsURI}`);
            lines.push(`  XMI pattern: ${s.xmiPattern}`);
        }
        lines.push('');
        lines.push('Statistics:');
        if (s.kind === 'metamodel') {
            lines.push(`  Packages: ${s.packageCount}`);
            lines.push(`  Classes: ${s.classCount}`);
            lines.push(`  Attributes: ${s.attributeCount}`);
            lines.push(`  References: ${s.referenceCount}`);
            lines.push(`  Enums: ${s.enumCount}`);
            lines.push(`  DataTypes: ${s.dataTypeCount}`);
        } else {
            lines.push(`  Root objects: ${s.rootObjectCount}`);
            lines.push(`  Nested objects: ${s.nestedObjectCount}`);
            lines.push(`  Values: ${s.valueCount}`);
        }
    }

    if (s.warnings.length > 0) {
        lines.push('');
        lines.push(`Warnings (${s.warnings.length}):`);
        s.warnings.forEach((w) => lines.push(`  - ${w}`));
    }

    if (s.errorMessage) {
        lines.push('');
        lines.push('Error:');
        lines.push(`  ${s.errorMessage.replace(/\n/g, '\n  ')}`);
    }

    return lines.join('\n');
}

const ImportSummaryModal: React.FC = () => {
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const copyResetTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<ImportSummary>;
            if (ce.detail) setSummary(ce.detail);
        };
        window.addEventListener(JjodelEvents.IMPORT_SUMMARY_SHOW, handler);
        return () => window.removeEventListener(JjodelEvents.IMPORT_SUMMARY_SHOW, handler);
    }, []);

    useEffect(() => {
        if (!summary) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSummary(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [summary]);

    useEffect(() => {
        if (summary && closeBtnRef.current) {
            closeBtnRef.current.focus();
        }
        if (!summary) {
            setCopyState('idle');
            if (copyResetTimerRef.current !== null) {
                window.clearTimeout(copyResetTimerRef.current);
                copyResetTimerRef.current = null;
            }
        }
    }, [summary]);

    if (!summary) return null;

    const onCloseClick = () => setSummary(null);

    const onCopy = async () => {
        try {
            const text = formatSummaryForClipboard(summary);
            await navigator.clipboard.writeText(text);
            setCopyState('copied');
            if (copyResetTimerRef.current !== null) {
                window.clearTimeout(copyResetTimerRef.current);
            }
            copyResetTimerRef.current = window.setTimeout(() => {
                setCopyState('idle');
                copyResetTimerRef.current = null;
            }, 1500);
        } catch {
            // Clipboard API may fail in non-secure contexts: feedback silently to idle.
            setCopyState('idle');
        }
    };

    const typeLabel = summary.kind === 'metamodel' ? 'Metamodel' : 'Model';
    const hasIdentity = summary.status !== 'error';
    const hasStats = summary.status !== 'error';
    const hasWarnings = summary.warnings.length > 0;
    const hasError = summary.status === 'error' && !!summary.errorMessage;

    return (
        <div
            className="import-summary-modal-backdrop"
            onClick={onCloseClick}
            role="presentation"
        >
            <div
                className={`import-summary-modal import-summary-modal--${summary.status}`}
                role="dialog"
                aria-labelledby="import-summary-modal-title"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="import-summary-modal__header">
                    <i
                        className={`bi ${statusIcon(summary.status)} import-summary-modal__header-icon`}
                        aria-hidden="true"
                    />
                    <h2 id="import-summary-modal-title" className="import-summary-modal__title">
                        {statusTitle(summary.status)}
                    </h2>
                    <button
                        type="button"
                        className="import-summary-modal__close-btn"
                        onClick={onCloseClick}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="import-summary-modal__body">
                    <section className="import-summary-modal__section">
                        <h3 className="import-summary-modal__section-title">File</h3>
                        <div className="import-summary-modal__kv-row">
                            <span className="import-summary-modal__kv-label">Name:</span>
                            <span className="import-summary-modal__kv-value">{summary.fileName}</span>
                        </div>
                        <div className="import-summary-modal__kv-row">
                            <span className="import-summary-modal__kv-label">Type:</span>
                            <span className="import-summary-modal__kv-value">{typeLabel}</span>
                        </div>
                    </section>

                    {hasIdentity && (
                        <section className="import-summary-modal__section">
                            <h3 className="import-summary-modal__section-title">Identity</h3>
                            {summary.kind === 'metamodel' ? (
                                <>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">Model name:</span>
                                        <span className="import-summary-modal__kv-value">{summary.modelName}</span>
                                    </div>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">Root package:</span>
                                        <span className="import-summary-modal__kv-value">{summary.rootPackageName}</span>
                                    </div>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">nsURI:</span>
                                        <span className="import-summary-modal__kv-value">{summary.rootPackageNsURI}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">Model name:</span>
                                        <span className="import-summary-modal__kv-value">{summary.modelName}</span>
                                    </div>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">Metamodel:</span>
                                        <span className="import-summary-modal__kv-value">{summary.metamodelName}</span>
                                    </div>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">nsURI:</span>
                                        <span className="import-summary-modal__kv-value">{summary.metamodelNsURI}</span>
                                    </div>
                                    <div className="import-summary-modal__kv-row">
                                        <span className="import-summary-modal__kv-label">XMI pattern:</span>
                                        <span className="import-summary-modal__kv-value">{summary.xmiPattern}</span>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {hasStats && (
                        <section className="import-summary-modal__section">
                            <h3 className="import-summary-modal__section-title">Statistics</h3>
                            <div className="import-summary-modal__stat-table">
                                {summary.kind === 'metamodel' ? (
                                    <>
                                        <span className="import-summary-modal__stat-label">Packages</span>
                                        <span className="import-summary-modal__stat-value">{summary.packageCount}</span>
                                        <span className="import-summary-modal__stat-label">Classes</span>
                                        <span className="import-summary-modal__stat-value">{summary.classCount}</span>
                                        <span className="import-summary-modal__stat-label">Attributes</span>
                                        <span className="import-summary-modal__stat-value">{summary.attributeCount}</span>
                                        <span className="import-summary-modal__stat-label">References</span>
                                        <span className="import-summary-modal__stat-value">{summary.referenceCount}</span>
                                        <span className="import-summary-modal__stat-label">Enums</span>
                                        <span className="import-summary-modal__stat-value">{summary.enumCount}</span>
                                        <span className="import-summary-modal__stat-label">DataTypes</span>
                                        <span className="import-summary-modal__stat-value">{summary.dataTypeCount}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="import-summary-modal__stat-label">Root objects</span>
                                        <span className="import-summary-modal__stat-value">{summary.rootObjectCount}</span>
                                        <span className="import-summary-modal__stat-label">Nested objects</span>
                                        <span className="import-summary-modal__stat-value">{summary.nestedObjectCount}</span>
                                        <span className="import-summary-modal__stat-label">Values</span>
                                        <span className="import-summary-modal__stat-value">{summary.valueCount}</span>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {hasWarnings && (
                        <section className="import-summary-modal__section">
                            <h3 className="import-summary-modal__section-title">
                                {`Warnings (${summary.warnings.length})`}
                            </h3>
                            <ul className="import-summary-modal__warnings">
                                {summary.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {hasError && (
                        <section className="import-summary-modal__section">
                            <h3 className="import-summary-modal__section-title">Error</h3>
                            <pre className="import-summary-modal__error-pre">{summary.errorMessage}</pre>
                        </section>
                    )}
                </div>

                <div className="import-summary-modal__footer">
                    <button
                        type="button"
                        className="import-summary-modal__btn import-summary-modal__btn--secondary"
                        onClick={onCopy}
                    >
                        <i
                            className={`bi ${copyState === 'copied' ? 'bi-check' : 'bi-clipboard'}`}
                            aria-hidden="true"
                        />
                        {copyState === 'copied' ? 'Copied' : 'Copy details'}
                    </button>
                    <button
                        type="button"
                        ref={closeBtnRef}
                        className="import-summary-modal__btn import-summary-modal__btn--primary"
                        onClick={onCloseClick}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportSummaryModal;
