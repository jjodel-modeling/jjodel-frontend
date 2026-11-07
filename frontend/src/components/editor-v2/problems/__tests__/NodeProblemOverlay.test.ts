/**
 * The problem overlay is a portal, and a React portal bubbles through the React tree, not the DOM: an event inside it
 * reaches the handlers of the node that renders the dot (ReactFlow's node wrapper: onNodeClick, onNodeContextMenu;
 * ObjectNode's body: onClick, onDoubleClick). A click on «Sync slots» also selected the node, a selection write that
 * can land outside the sync's undo group as an entry of its own (P-2026-11-07-0040, S3-4).
 *
 * vitest runs in node here, with no DOM, so the overlay is rendered by react-dom/server with createPortal captured, and
 * the event is driven along the rendered tree from the target up, as React bubbles it, ending at a spy that stands for
 * the node. The walk is the test's, not React's; what it executes are the overlay's own handlers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NodeProblem } from '../registry';

const captured = vi.hoisted(() => ({ portal: null as unknown }));

vi.mock('react-dom', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-dom')>()),
    createPortal: (child: unknown) => { captured.portal = child; return null; },
}));
vi.mock('@xyflow/react', () => ({
    useReactFlow: () => ({ fitView: () => {}, setNodes: () => {} }),
}));

import { NodeProblemOverlay } from '../NodeProblemOverlay';

type El = React.ReactElement<{ className?: string; children?: React.ReactNode } & Record<string, unknown>>;

const HANDLER = {
    click: 'onClick',
    dblclick: 'onDoubleClick',
    contextmenu: 'onContextMenu',
    mousedown: 'onMouseDown',
} as const;

function childrenOf(el: El): El[] {
    const out: El[] = [];
    const visit = (n: React.ReactNode) => {
        if (Array.isArray(n)) n.forEach(visit);
        else if (React.isValidElement(n)) out.push(n as El);
    };
    visit(el.props.children);
    return out;
}

/** The elements from `root` down to the first one carrying class `cls`, root first. */
function pathTo(root: El, cls: string): El[] | null {
    if (String(root.props.className ?? '').split(' ').includes(cls)) return [root];
    for (const c of childrenOf(root)) {
        const p = pathTo(c, cls);
        if (p) return [root, ...p];
    }
    return null;
}

/** Bubbles `type` from the element of class `cls` up to `root`, then to `node` unless a handler stopped it. */
function bubble(root: El, cls: string, type: keyof typeof HANDLER, node: (e: unknown) => void): void {
    const path = pathTo(root, cls);
    if (!path) throw new Error(`no .${cls} in the tree`);
    const state = { stopped: false };
    const event = { type, stopPropagation: () => { state.stopped = true; }, preventDefault: () => {} };
    for (const el of path.reverse()) {
        const h = el.props[HANDLER[type]];
        if (typeof h === 'function') h(event);
        if (state.stopped) return;
    }
    node(event);
}

function syncSlotsProblem(run: () => void): NodeProblem {
    return {
        id: 'p1',
        nodeId: 'n1',
        kind: 'instantiation',
        severity: 'warning',
        title: 'Slots out of sync',
        description: 'dune has a slot its class no longer declares',
        relatedNodeIds: [],
        action: { label: 'Sync slots', type: 'custom', run },
        createdAt: 0,
    };
}

function renderOverlay(problems: NodeProblem[], onClose: () => void): El {
    captured.portal = null;
    renderToStaticMarkup(React.createElement(NodeProblemOverlay, { problems, anchorEl: null, onClose }));
    if (!captured.portal) throw new Error('the overlay did not reach createPortal');
    return captured.portal as El;
}

describe('NodeProblemOverlay: events inside the portal do not reach the node', () => {
    beforeEach(() => { vi.stubGlobal('document', { body: {} }); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('control: the walk reaches the node when no handler stops the event', () => {
        const node = vi.fn();
        const tree = React.createElement('div', { className: 'a' },
            React.createElement('button', { className: 'b', onClick: () => {} })) as El;
        bubble(tree, 'b', 'click', node);
        expect(node).toHaveBeenCalledTimes(1);
    });

    it('a click on «Sync slots» runs the action, closes, and does not reach the node (kills: no click stop)', () => {
        const run = vi.fn();
        const onClose = vi.fn();
        const node = vi.fn();
        bubble(renderOverlay([syncSlotsProblem(run)], onClose), 'node-problem-overlay__action', 'click', node);
        expect(run).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(node).not.toHaveBeenCalled();
    });

    it('a click on the close button closes and does not reach the node (kills: no click stop)', () => {
        const onClose = vi.fn();
        const node = vi.fn();
        bubble(renderOverlay([syncSlotsProblem(() => {})], onClose), 'node-problem-overlay__close', 'click', node);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(node).not.toHaveBeenCalled();
    });

    it('a double click inside the overlay does not reach the node (kills: no dblclick stop)', () => {
        const node = vi.fn();
        bubble(renderOverlay([syncSlotsProblem(() => {})], () => {}), 'node-problem-overlay__description', 'dblclick', node);
        expect(node).not.toHaveBeenCalled();
    });

    it('a right click inside the overlay does not reach the node (kills: no contextmenu stop)', () => {
        const node = vi.fn();
        bubble(renderOverlay([syncSlotsProblem(() => {})], () => {}), 'node-problem-overlay__title', 'contextmenu', node);
        expect(node).not.toHaveBeenCalled();
    });

    it('a mousedown inside the overlay still stops at the root (kills: no mousedown stop)', () => {
        const node = vi.fn();
        bubble(renderOverlay([syncSlotsProblem(() => {})], () => {}), 'node-problem-overlay__action', 'mousedown', node);
        expect(node).not.toHaveBeenCalled();
    });
});
