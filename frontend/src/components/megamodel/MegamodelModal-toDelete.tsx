import React, { useEffect } from 'react';
import { getRuntimeMegamodel } from '../../model/megamodelRuntime';
import MegamodelGraph from './MegamodelGraph';
import type { Megamodel } from '../../model/megamodel';
import './megamodel-modal.scss';

// ─── Legend data ─────────────────────────────────────────────────────────────

const NODE_LEGEND = [
    { key: 'metamodel',     label: 'Metamodel' },
    { key: 'model',         label: 'Model' },
    { key: 'transformation',label: 'Transformation' },
] as const;

interface EdgeLegendItem {
    key: string;
    label: string;
    color: string;
    dashed?: boolean;
    dotted?: boolean;
}

const EDGE_LEGEND: EdgeLegendItem[] = [
    { key: 'conformsTo',   label: 'conforms to',  color: '#94a3b8', dashed: true  },
    { key: 'inputOf',      label: 'input of',     color: '#0ea5e9'                },
    { key: 'outputOf',     label: 'output of',    color: '#10b981'                },
    { key: 'tracedBy',     label: 'traced by',    color: '#f59e0b', dotted: true  },
    { key: 'user-defined', label: 'user-defined', color: '#a855f7'                },
];

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MegamodelModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const MegamodelModal: React.FC<MegamodelModalProps> = ({ projectId, isOpen, onClose }) => {
    // ESC key closes the modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const megamodel: Megamodel | undefined = getRuntimeMegamodel(projectId);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="megamodel-modal-overlay" onClick={handleOverlayClick}>
            <div className="megamodel-modal">

                {/* Header */}
                <div className="megamodel-modal__header">
                    <div className="megamodel-modal__title">
                        <i className="bi bi-diagram-3" />
                        Megamodel
                    </div>

                    <div className="megamodel-modal__controls">
                        {/* Node legend */}
                        <div className="mm-legend">
                            <div className="mm-legend__section">
                                {NODE_LEGEND.map(({ key, label }) => (
                                    <div key={key} className="mm-legend__item">
                                        <span className={`mm-legend__node mm-legend__node--${key}`} />
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mm-legend__divider" />
                            {/* Edge legend */}
                            <div className="mm-legend__section">
                                {EDGE_LEGEND.map(({ key, label, color, dashed, dotted }) => (
                                    <div key={key} className="mm-legend__item">
                                        <svg width="18" height="8" style={{ flexShrink: 0 }}>
                                            <line
                                                x1="0" y1="4" x2="18" y2="4"
                                                stroke={color}
                                                strokeWidth="1.5"
                                                strokeDasharray={dashed ? '4 2' : dotted ? '2 2' : undefined}
                                            />
                                        </svg>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="megamodel-modal__close"
                            onClick={onClose}
                            aria-label="Close"
                            title="Close (Esc)"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="megamodel-modal__body">
                    {megamodel === undefined ? (
                        <div className="mm-loading-state">
                            <i className="bi bi-hourglass-split mm-loading-state__icon" />
                            <div className="mm-loading-state__text">Loading megamodel…</div>
                        </div>
                    ) : (
                        <MegamodelGraph megamodel={megamodel} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MegamodelModal;
