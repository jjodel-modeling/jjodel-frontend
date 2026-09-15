import { useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

interface NodeRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

function getNodeRect(node: Node): NodeRect {
    return {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: (node.measured?.width as number) ?? (node.width as number) ?? 180,
        height: (node.measured?.height as number) ?? (node.height as number) ?? 80,
    };
}

export function useAlignment() {
    const { getNodes, setNodes } = useReactFlow();

    const getSelectedRects = useCallback((): NodeRect[] => {
        return getNodes().filter(n => n.selected).map(getNodeRect);
    }, [getNodes]);

    // === ALIGNMENT ===

    const alignLeft = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const minX = Math.min(...rects.map(r => r.x));
        setNodes(nds => nds.map(n =>
            n.selected ? { ...n, position: { ...n.position, x: minX } } : n
        ));
    }, [getSelectedRects, setNodes]);

    const alignCenterVertical = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const avgCenterX = rects.reduce((sum, r) => sum + r.x + r.width / 2, 0) / rects.length;
        const rectMap = new Map(rects.map(r => [r.id, r]));
        setNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const rect = rectMap.get(n.id);
            if (!rect) return n;
            return { ...n, position: { ...n.position, x: avgCenterX - rect.width / 2 } };
        }));
    }, [getSelectedRects, setNodes]);

    const alignRight = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const maxRight = Math.max(...rects.map(r => r.x + r.width));
        const rectMap = new Map(rects.map(r => [r.id, r]));
        setNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const rect = rectMap.get(n.id);
            if (!rect) return n;
            return { ...n, position: { ...n.position, x: maxRight - rect.width } };
        }));
    }, [getSelectedRects, setNodes]);

    const alignTop = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const minY = Math.min(...rects.map(r => r.y));
        setNodes(nds => nds.map(n =>
            n.selected ? { ...n, position: { ...n.position, y: minY } } : n
        ));
    }, [getSelectedRects, setNodes]);

    const alignCenterHorizontal = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const avgCenterY = rects.reduce((sum, r) => sum + r.y + r.height / 2, 0) / rects.length;
        const rectMap = new Map(rects.map(r => [r.id, r]));
        setNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const rect = rectMap.get(n.id);
            if (!rect) return n;
            return { ...n, position: { ...n.position, y: avgCenterY - rect.height / 2 } };
        }));
    }, [getSelectedRects, setNodes]);

    const alignBottom = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 2) return;
        const maxBottom = Math.max(...rects.map(r => r.y + r.height));
        const rectMap = new Map(rects.map(r => [r.id, r]));
        setNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const rect = rectMap.get(n.id);
            if (!rect) return n;
            return { ...n, position: { ...n.position, y: maxBottom - rect.height } };
        }));
    }, [getSelectedRects, setNodes]);

    // === DISTRIBUTION ===

    const distributeHorizontally = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 3) return;

        // Sort by X position
        const sorted = [...rects].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        // Total available space minus width of all nodes
        const totalWidth = (last.x + last.width) - first.x;
        const nodesWidth = sorted.reduce((sum, r) => sum + r.width, 0);
        const gap = (totalWidth - nodesWidth) / (sorted.length - 1);

        // Position each node with uniform gap
        let currentX = first.x;
        const posMap = new Map<string, number>();
        for (const rect of sorted) {
            posMap.set(rect.id, currentX);
            currentX += rect.width + gap;
        }

        setNodes(nds => nds.map(n => {
            const newX = posMap.get(n.id);
            if (newX === undefined) return n;
            return { ...n, position: { ...n.position, x: newX } };
        }));
    }, [getSelectedRects, setNodes]);

    const distributeVertically = useCallback(() => {
        const rects = getSelectedRects();
        if (rects.length < 3) return;

        const sorted = [...rects].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const totalHeight = (last.y + last.height) - first.y;
        const nodesHeight = sorted.reduce((sum, r) => sum + r.height, 0);
        const gap = (totalHeight - nodesHeight) / (sorted.length - 1);

        let currentY = first.y;
        const posMap = new Map<string, number>();
        for (const rect of sorted) {
            posMap.set(rect.id, currentY);
            currentY += rect.height + gap;
        }

        setNodes(nds => nds.map(n => {
            const newY = posMap.get(n.id);
            if (newY === undefined) return n;
            return { ...n, position: { ...n.position, y: newY } };
        }));
    }, [getSelectedRects, setNodes]);

    return {
        alignLeft,
        alignCenterVertical,
        alignRight,
        alignTop,
        alignCenterHorizontal,
        alignBottom,
        distributeHorizontally,
        distributeVertically,
    };
}
