/**
 * Editor V3 — ContextMenu: right-click context menu for nodes, edges, and canvas.
 *
 * Actions adapt based on what was right-clicked:
 * - Node: Delete, Add Attribute/Operation/Literal, Toggle Abstract
 * - Edge: Delete, Change type
 * - Canvas: Paste, Select All, Fit View
 */

import React, { useCallback, useEffect, useRef, memo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ModelNodeData, UnifiedEdgeData } from '../types';
import {
    syncDeleteVertex,
    syncDeleteEdge,
    syncAddAttribute,
    syncAddOperation,
    syncAddLiteral,
    syncClassAbstract,
} from '../sync/canvasToJjomV3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextMenuState {
    x: number;
    y: number;
    target: ContextMenuTarget;
}

export type ContextMenuTarget =
    | { type: 'node'; node: Node }
    | { type: 'edge'; edge: Edge }
    | { type: 'canvas' };

interface ContextMenuProps {
    state: ContextMenuState;
    onClose: () => void;
    onFitView?: () => void;
    onSelectAll?: () => void;
}

interface MenuAction {
    label: string;
    icon: string;
    action: () => void;
    danger?: boolean;
    dividerBefore?: boolean;
}

// ---------------------------------------------------------------------------
// Build actions based on target
// ---------------------------------------------------------------------------

function buildActions(
    target: ContextMenuTarget,
    onClose: () => void,
    onFitView?: () => void,
    onSelectAll?: () => void,
): MenuAction[] {
    const actions: MenuAction[] = [];

    if (target.type === 'node') {
        const node = target.node;
        const data = node.data as unknown as ModelNodeData;
        const kind = data.modelSnapshot?.kind;

        if (kind === 'class') {
            const snapshot = data.modelSnapshot;
            const isAbstract = snapshot.kind === 'class' && snapshot.isAbstract;

            actions.push({
                label: 'Add Attribute',
                icon: 'bi-card-text',
                action: () => { syncAddAttribute(node.id); onClose(); },
            });
            actions.push({
                label: 'Add Operation',
                icon: 'bi-gear',
                action: () => { syncAddOperation(node.id); onClose(); },
            });
            actions.push({
                label: isAbstract ? 'Make Concrete' : 'Make Abstract',
                icon: 'bi-diagram-3',
                action: () => { syncClassAbstract(node.id, !isAbstract); onClose(); },
            });
        }

        if (kind === 'enum') {
            actions.push({
                label: 'Add Literal',
                icon: 'bi-hash',
                action: () => { syncAddLiteral(node.id); onClose(); },
            });
        }

        actions.push({
            label: 'Delete',
            icon: 'bi-trash',
            action: () => { syncDeleteVertex(node.id); onClose(); },
            danger: true,
            dividerBefore: actions.length > 0,
        });
    }

    if (target.type === 'edge') {
        const edge = target.edge;
        const edgeData = edge.data as unknown as UnifiedEdgeData | undefined;
        const isInheritance = edgeData?.edgeKind === 'inheritance';

        actions.push({
            label: 'Delete Edge',
            icon: 'bi-trash',
            action: () => {
                syncDeleteEdge(edge.id, isInheritance);
                onClose();
            },
            danger: true,
        });
    }

    if (target.type === 'canvas') {
        if (onSelectAll) {
            actions.push({
                label: 'Select All',
                icon: 'bi-check2-all',
                action: () => { onSelectAll(); onClose(); },
            });
        }
        if (onFitView) {
            actions.push({
                label: 'Fit View',
                icon: 'bi-fullscreen',
                action: () => { onFitView(); onClose(); },
            });
        }
    }

    return actions;
}

// ---------------------------------------------------------------------------
// ContextMenu Component
// ---------------------------------------------------------------------------

function ContextMenuInner({ state, onClose, onFitView, onSelectAll }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const actions = buildActions(state.target, onClose, onFitView, onSelectAll);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
                onClose();
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (actions.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className="v3-context-menu"
            style={{
                position: 'fixed',
                left: state.x,
                top: state.y,
            }}
        >
            {actions.map((action, i) => (
                <React.Fragment key={action.label}>
                    {action.dividerBefore && <div className="v3-context-menu__divider" />}
                    <button
                        className={`v3-context-menu__item ${action.danger ? 'v3-context-menu__item--danger' : ''}`}
                        onClick={action.action}
                    >
                        <i className={`bi ${action.icon} v3-context-menu__icon`} />
                        <span>{action.label}</span>
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

export const ContextMenu = memo(ContextMenuInner);
