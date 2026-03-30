import React, { useMemo, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { EditorV2 } from '../../editor-v2/EditorV2';
import './EditorSwitch.scss';

export type EditorMode = 'classic' | 'v2';

interface EditorPane {
    id: string;
    type: 'classic' | 'flow';
}

interface EditorSwitchProps {
    /** Model ID passed to both editors. */
    modelid: string;
    /** The classic editor content (rendered as children). */
    children: ReactNode;
    /** When true, disables split view (metamodels only use abstract syntax). */
    isMetamodel?: boolean;
}

let paneCounter = 0;

/**
 * Wrapper that manages Classic + Flow editor split view.
 *
 * - No viewpoint selected → single Flow editor (default, unchanged)
 * - Viewpoint selected → split: Classic (left) + Flow (right)
 * - Split button adds more Flow panes
 * - Max 1 Classic pane (tied to viewpoint selection)
 * - Metamodels never enter split mode
 */
export function EditorSwitch({ modelid, children, isMetamodel }: EditorSwitchProps) {
    const viewpointId = useSelector((state: any) => state.viewpoint);

    // Pane state: managed internally, reacts to viewpoint changes
    const [flowPanes, setFlowPanes] = useState<EditorPane[]>([
        { id: 'main', type: 'flow' },
    ]);

    // Pane size ratios (flex values). Index 0 = classic (when present), rest = flow panes
    const [paneSizes, setPaneSizes] = useState<number[]>([1]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Determine if Classic pane should be shown
    const showClassic = !!viewpointId && !isMetamodel;

    // Build the full pane list
    const panes = useMemo<EditorPane[]>(() => {
        if (showClassic) {
            return [{ id: 'classic', type: 'classic' }, ...flowPanes];
        }
        return flowPanes;
    }, [showClassic, flowPanes]);

    const isSplit = panes.length > 1;

    // Sync paneSizes when pane count changes
    useEffect(() => {
        setPaneSizes(prev => {
            if (prev.length === panes.length) return prev;
            // Distribute evenly
            return panes.map(() => 1);
        });
    }, [panes.length]);

    // --- Split controls ---
    const handleAddFlowPane = useCallback(() => {
        paneCounter++;
        setFlowPanes(prev => [...prev, { id: `flow-${paneCounter}`, type: 'flow' }]);
    }, []);

    const handleRemoveFlowPane = useCallback((paneId: string) => {
        setFlowPanes(prev => {
            if (prev.length <= 1) return prev; // keep at least 1 flow
            return prev.filter(p => p.id !== paneId);
        });
    }, []);

    // --- Divider drag ---
    const handleDividerDrag = useCallback((e: React.MouseEvent, dividerIndex: number) => {
        e.preventDefault();
        const startX = e.clientX;
        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.getBoundingClientRect().width;
        const startSizes = [...paneSizes];
        // Ensure we have the right number of sizes
        while (startSizes.length < panes.length) startSizes.push(1);

        const leftIdx = dividerIndex;
        const rightIdx = dividerIndex + 1;
        const totalFlex = startSizes.reduce((a, b) => a + b, 0);

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const deltaRatio = (delta / containerWidth) * totalFlex;

            const newSizes = [...startSizes];
            newSizes[leftIdx] = Math.max(0.15, startSizes[leftIdx] + deltaRatio);
            newSizes[rightIdx] = Math.max(0.15, startSizes[rightIdx] - deltaRatio);
            setPaneSizes(newSizes);
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [paneSizes, panes.length]);

    // --- Metamodels: always use Flow editor (abstract syntax only) ---
    // state.viewpoint is global and may be set from a model tab;
    // metamodels must ignore it to avoid switching to Classic editor.
    if (isMetamodel) {
        return (
            <div className="editor-switch-container">
                <div className="editor-switch-v2-wrapper">
                    <EditorV2 modelid={modelid} />
                </div>
            </div>
        );
    }

    // --- Single pane (no viewpoint, no extra splits) ---
    if (!isSplit) {
        return (
            <div className="editor-switch-container">
                <div className="editor-switch-v2-wrapper">
                    <EditorV2 modelid={modelid} />
                </div>
            </div>
        );
    }

    // --- Split view ---
    return (
        <div className="editor-switch-container editor-split" ref={containerRef}>
            {panes.map((pane, index) => (
                <React.Fragment key={pane.id}>
                    {index > 0 && (
                        <div
                            className="editor-split__divider"
                            onMouseDown={(e) => handleDividerDrag(e, index - 1)}
                        />
                    )}
                    <div
                        className="editor-split__pane"
                        style={{ flex: paneSizes[index] ?? 1 }}
                    >
                        <div className="editor-split__pane-header">
                            <span className={`editor-split__pane-label editor-split__pane-label--${pane.type === 'classic' ? 'concrete' : 'abstract'}`}>
                                <i className={`bi ${pane.type === 'classic' ? 'bi-eye' : 'bi-diagram-3'}`} />
                                {pane.type === 'classic' ? ' Concrete syntax' : ' Abstract syntax'}
                            </span>
                            <div className="editor-split__pane-controls">
                                {pane.type === 'flow' && (
                                    <button
                                        className="editor-split__btn"
                                        onClick={handleAddFlowPane}
                                        title="Add split view"
                                    >
                                        <i className="bi bi-layout-split" />
                                    </button>
                                )}
                                {pane.type === 'flow' && flowPanes.length > 1 && (
                                    <button
                                        className="editor-split__btn editor-split__btn--close"
                                        onClick={() => handleRemoveFlowPane(pane.id)}
                                        title="Close pane"
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="editor-split__pane-content">
                            {pane.type === 'classic' ? (
                                children
                            ) : (
                                <EditorV2 modelid={modelid} />
                            )}
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

export default EditorSwitch;
