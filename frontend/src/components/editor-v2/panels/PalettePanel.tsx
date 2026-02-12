import React, { useCallback } from 'react';

interface PaletteItem {
    type: string;
    label: string;
    icon: string;
}

const paletteItems: PaletteItem[] = [
    { type: 'classNode', label: 'Class', icon: 'bi-diagram-3' },
    { type: 'nestedFlowNode', label: 'Container', icon: 'bi-bounding-box' },
];

/**
 * Sidebar palette with draggable node types.
 * Drag items onto the canvas to create new nodes.
 */
function PalettePanel() {
    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    return (
        <aside className="editor-v2-palette">
            <div className="palette-title">Elements</div>
            {paletteItems.map((item) => (
                <div
                    key={item.type}
                    className="palette-item"
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type)}
                >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                </div>
            ))}

            <div className="palette-divider" />

            <div className="palette-title">Instructions</div>
            <div className="palette-instructions">
                <p><strong>Drag</strong> elements to canvas</p>
                <p><strong>Double-click</strong> to edit names</p>
                <p><strong>Drag handles</strong> to connect</p>
                <p><strong>Scroll</strong> to zoom</p>
            </div>
        </aside>
    );
}

export default PalettePanel;
