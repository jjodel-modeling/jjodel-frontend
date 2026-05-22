import { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ClassNode from '../nodes/ClassNode';
import UnifiedEdge from '../edges/UnifiedEdge';

const nodeTypes = { classNode: ClassNode };
const edgeTypes = { reference: UnifiedEdge };

const initialNodes: Node[] = [
    {
        id: '204',
        type: 'classNode',
        position: { x: 100, y: 200 },
        data: { label: 'Family', isAbstract: false, attributes: [], references: [], operations: [] },
    },
    {
        id: '206',
        type: 'classNode',
        position: { x: 500, y: 200 },
        data: { label: 'Member', isAbstract: false, attributes: [], references: [], operations: [] },
    },
];

const makeRefEdge = (id: string, source: string, target: string, sourceHandle: string, targetHandle: string): Edge => ({
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'reference',
    data: {
        reference: {
            id,
            name: id,
            kind: 'association',
            targetClassId: target,
            lowerBound: 0,
            upperBound: -1,
            containment: false,
        },
    },
});

const initialEdges: Edge[] = [
    // 4 direct: (204, right-0) → (206, left-0)
    makeRefEdge('e1', '204', '206', 'right-0', 'left-0'),
    makeRefEdge('e2', '204', '206', 'right-0', 'left-0'),
    makeRefEdge('e3', '204', '206', 'right-0', 'left-0'),
    makeRefEdge('e4', '204', '206', 'right-0', 'left-0'),
    // 4 inverse: (206, left-0) → (204, right-0)
    makeRefEdge('e5', '206', '204', 'left-0', 'right-0'),
    makeRefEdge('e6', '206', '204', 'left-0', 'right-0'),
    makeRefEdge('e7', '206', '204', 'left-0', 'right-0'),
    makeRefEdge('e8', '206', '204', 'left-0', 'right-0'),
];

function ReproHarness() {
    const [stateNodes] = useState<Node[]>(initialNodes);
    const [stateEdges] = useState<Edge[]>(initialEdges);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ padding: 8, background: '#f1f5f9', fontFamily: 'monospace', fontSize: 11 }}>
                Repro: 2 nodes, 8 edges (4 direct + 4 inverse, same quartet).
                Expected: 8 edges in DOM. Bug: 4 in DOM.
                Inspect via: document.querySelectorAll('.react-flow__edge').length
            </div>
            <div style={{ width: '100%', height: 'calc(100vh - 40px)' }}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={stateNodes}
                        edges={stateEdges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}

export default ReproHarness;

export function ReproHarnessReactive() {
    const [stateNodes] = useState<Node[]>(initialNodes);
    const [stateEdges, setStateEdges] = useState<Edge[]>([]);

    useEffect(() => {
        // Simulates useJjomSync init effect: edges arrive after node mount.
        setStateEdges(initialEdges);
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ padding: 8, background: '#fef3c7', fontFamily: 'monospace', fontSize: 11 }}>
                REACTIVE Repro: 2 nodes (mount), 8 edges (useEffect setEdges).
                Expected if T1: 4 edges in DOM (race). If T1 wrong: 8 edges.
                Inspect: document.querySelectorAll('.react-flow__edge').length
            </div>
            <div style={{ width: '100%', height: 'calc(100vh - 40px)' }}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={stateNodes}
                        edges={stateEdges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}
