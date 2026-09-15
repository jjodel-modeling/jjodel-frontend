/**
 * GrammarDiagramModal - Enlarged view of railroad diagrams with zoom/pan
 * Opens when clicking the expand button on a grammar card
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GrammarRule, GrammarRuleInfo, GRAMMAR_RULES } from './types';
import { renderDiagram } from './diagramRenderer';
import './GrammarDiagramModal.scss';

interface GrammarDiagramModalProps {
    /** The rule to display */
    rule: GrammarRule;
    /** Whether the modal is open */
    isOpen: boolean;
    /** Called when modal should close */
    onClose: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const GrammarDiagramModal: React.FC<GrammarDiagramModalProps> = ({
    rule,
    isOpen,
    onClose,
}) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const diagramRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const ruleInfo = GRAMMAR_RULES.find(r => r.id === rule);

    // Render diagram when modal opens or rule changes
    useEffect(() => {
        if (isOpen && diagramRef.current && ruleInfo) {
            diagramRef.current.innerHTML = '';
            renderDiagram(ruleInfo.id, diagramRef.current);
        }
    }, [isOpen, rule, ruleInfo]);

    // Reset zoom/pan when modal opens
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-') {
                handleZoomOut();
            } else if (e.key === '0') {
                handleResetZoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    }, []);

    // Zoom controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click only
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !ruleInfo) return null;

    return (
        <div className="grammar-modal-backdrop" onClick={handleBackdropClick}>
            <div className="grammar-modal">
                {/* Header */}
                <div className="grammar-modal__header">
                    <div className="grammar-modal__title-section">
                        <h2 className="grammar-modal__title">{ruleInfo.name}</h2>
                        <p className="grammar-modal__description">{ruleInfo.description}</p>
                    </div>
                    <div className="grammar-modal__controls">
                        {/* Zoom controls */}
                        <div className="grammar-modal__zoom-controls">
                            <button
                                className="grammar-modal__zoom-btn"
                                onClick={handleZoomOut}
                                disabled={zoom <= MIN_ZOOM}
                                title="Zoom out (-)"
                            >
                                <i className="bi bi-dash-lg" />
                            </button>
                            <span className="grammar-modal__zoom-level">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                className="grammar-modal__zoom-btn"
                                onClick={handleZoomIn}
                                disabled={zoom >= MAX_ZOOM}
                                title="Zoom in (+)"
                            >
                                <i className="bi bi-plus-lg" />
                            </button>
                            <button
                                className="grammar-modal__zoom-btn"
                                onClick={handleResetZoom}
                                title="Reset zoom (0)"
                            >
                                <i className="bi bi-arrows-angle-contract" />
                            </button>
                        </div>

                        {/* Close button */}
                        <button
                            className="grammar-modal__close-btn"
                            onClick={onClose}
                            title="Close (Esc)"
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                {/* Diagram canvas */}
                <div
                    ref={containerRef}
                    className={`grammar-modal__canvas-container ${isPanning ? 'grammar-modal__canvas-container--panning' : ''}`}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        ref={diagramRef}
                        className="grammar-modal__diagram"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                        }}
                    />
                </div>

                {/* Footer with EBNF and example */}
                <div className="grammar-modal__footer">
                    <div className="grammar-modal__ebnf">
                        <span className="grammar-modal__label">EBNF</span>
                        <code>{ruleInfo.ebnf}</code>
                    </div>
                    {ruleInfo.example && (
                        <div className="grammar-modal__example">
                            <span className="grammar-modal__label">Example</span>
                            <pre>{ruleInfo.example}</pre>
                        </div>
                    )}
                </div>

                {/* Keyboard hints */}
                <div className="grammar-modal__hints">
                    <span><kbd>+</kbd>/<kbd>-</kbd> Zoom</span>
                    <span><kbd>0</kbd> Reset</span>
                    <span><kbd>Esc</kbd> Close</span>
                    <span>Drag to pan</span>
                </div>
            </div>
        </div>
    );
};

export default GrammarDiagramModal;
