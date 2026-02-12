import { useCallback } from 'react';

interface PaletteItem {
    type: string;
    label: string;
    icon: string;
    group: string;
}

interface PalettePanelProps {
    connectionMode: 'reference' | 'inheritance';
    onConnectionModeChange: (mode: 'reference' | 'inheritance') => void;
}

const paletteItems: PaletteItem[] = [
    { type: 'packageNode', label: 'Package', icon: 'bi-folder', group: 'Structure' },
    { type: 'classNode', label: 'Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'classNode:abstract', label: 'Abstract Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'enumNode', label: 'Enumeration', icon: 'bi-list-ol', group: 'Classifiers' },
    { type: 'attribute', label: 'Attribute', icon: 'bi-card-text', group: 'Members' },
    { type: 'operation', label: 'Operation', icon: 'bi-gear', group: 'Members' },
    { type: 'literal', label: 'Literal', icon: 'bi-hash', group: 'Members' },
];

const groups = [...new Set(paletteItems.map(i => i.group))];

/**
 * Sidebar palette with draggable metamodel elements.
 * Drag items onto the canvas to create new nodes.
 */
function PalettePanel({ connectionMode, onConnectionModeChange }: PalettePanelProps) {
    const onDragStart = useCallback((event: React.DragEvent, item: PaletteItem) => {
        event.dataTransfer.setData('application/reactflow', item.type);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    return (
        <aside className="editor-v2-palette">
            {groups.map(group => (
                <div key={group} className="palette-group">
                    <div className="palette-group__title">{group}</div>
                    {paletteItems.filter(i => i.group === group).map((item) => (
                        <div
                            key={item.type}
                            className={`palette-item ${item.group === 'Members' ? 'palette-item--member' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                        >
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                            {item.group === 'Members' && (
                                <span className="palette-item__hint">drop on node</span>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            <div className="palette-group">
                <div className="palette-group__title">Connections</div>
                <div className="palette-connection-modes">
                    <button
                        className={`palette-connection-mode ${connectionMode === 'reference' ? 'active' : ''}`}
                        onClick={() => onConnectionModeChange('reference')}
                    >
                        <span className="palette-connection-mode__icon">→</span>
                        <span>Reference</span>
                    </button>
                    <button
                        className={`palette-connection-mode ${connectionMode === 'inheritance' ? 'active' : ''}`}
                        onClick={() => onConnectionModeChange('inheritance')}
                    >
                        <span className="palette-connection-mode__icon">▷</span>
                        <span>Inheritance</span>
                    </button>
                </div>
                <div className="palette-info">
                    <i className="bi bi-info-circle" style={{ marginRight: '4px' }} />
                    Drag between anchors to connect
                </div>
            </div>

            <div className="palette-divider" />

            <div className="palette-instructions">
                <p><strong>Drag</strong> classifiers to canvas</p>
                <p><strong>Drag</strong> features onto classes/enums</p>
                <p><strong>Double-click</strong> to edit names</p>
                <p><strong>Ctrl+Z/Y</strong> for undo/redo</p>
            </div>
        </aside>
    );
}

export default PalettePanel;
