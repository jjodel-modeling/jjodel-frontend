import { useCallback } from 'react';
import type { MetaclassInfo } from '../hooks/useEditorMode';
import { setDraggedMetaclassId } from '../utils/dragState';

// ---------------------------------------------------------------------------
// M2 (Metamodel) Palette
// ---------------------------------------------------------------------------

interface PaletteItem {
    type: string;
    label: string;
    icon: string;
    group: string;
}

const m2PaletteItems: PaletteItem[] = [
    { type: 'packageNode', label: 'Package', icon: 'bi-folder', group: 'Structure' },
    { type: 'classNode', label: 'Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'classNode:abstract', label: 'Abstract Class', icon: 'bi-diagram-3', group: 'Classifiers' },
    { type: 'enumNode', label: 'Enumeration', icon: 'bi-list-ol', group: 'Classifiers' },
    { type: 'attribute', label: 'Attribute', icon: 'bi-card-text', group: 'Members' },
    { type: 'operation', label: 'Operation', icon: 'bi-gear', group: 'Members' },
    { type: 'literal', label: 'Literal', icon: 'bi-hash', group: 'Members' },
];

const m2Groups = [...new Set(m2PaletteItems.map(i => i.group))];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PalettePanelProps {
    /** If 'model' → show M1 palette with rootable classes. Default 'metamodel'. */
    editorMode?: 'metamodel' | 'model';
    /** Rootable classes for M1 palette (concrete classes not targeted by compositions). */
    rootableClasses?: MetaclassInfo[];
    /** ALL concrete (non-abstract) classes for M1 palette. */
    allConcreteClasses?: MetaclassInfo[];
}

function PalettePanel({ editorMode = 'metamodel', rootableClasses = [], allConcreteClasses = [] }: PalettePanelProps) {
    const onDragStart = useCallback((event: React.DragEvent, type: string, metaclassId?: string) => {
        event.dataTransfer.setData('application/reactflow', type);
        if (metaclassId) {
            event.dataTransfer.setData('metaclassId', metaclassId);
            setDraggedMetaclassId(metaclassId);
        }
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragEnd = useCallback(() => {
        setDraggedMetaclassId(null);
    }, []);

    // ── M1 Palette ───────────────────────────────────────────────────
    if (editorMode === 'model') {
        const rootableIds = new Set(rootableClasses.map(c => c.id));
        const compositionOnly = allConcreteClasses.filter(c => !rootableIds.has(c.id));

        return (
            <aside className="editor-v2-palette">
                {/* Group 1: Rootable classes — can be placed directly on canvas */}
                <div className="palette-group">
                    <div className="palette-group__title">Instances</div>
                    {rootableClasses.length === 0 ? (
                        <div className="palette-info">
                            <i className="bi bi-info-circle" style={{ marginRight: '4px' }} />
                            No rootable classes found
                        </div>
                    ) : (
                        rootableClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className="palette-item"
                                draggable
                                onDragStart={(e) => onDragStart(e, 'objectNode', cls.id)}
                                onDragEnd={onDragEnd}
                            >
                                <i className="bi bi-box" />
                                <span>{cls.name}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Group 2: Composition-only — must be dropped on a parent node */}
                {compositionOnly.length > 0 && (
                    <div className="palette-group">
                        <div className="palette-group__title">Composition Children</div>
                        {compositionOnly.map((cls) => (
                            <div
                                key={cls.id}
                                className="palette-item palette-item--composition"
                                draggable
                                onDragStart={(e) => onDragStart(e, 'objectNode', cls.id)}
                                onDragEnd={onDragEnd}
                            >
                                <i className="bi bi-diagram-2" />
                                <span>{cls.name}</span>
                                <span className="palette-item__hint">drop on parent</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="palette-divider" />

                <div className="palette-instructions">
                    <p><strong>Drag</strong> to canvas for root instances</p>
                    <p><strong>Drop on node</strong> for composition children</p>
                    <p><strong>Right-click</strong> for composition children</p>
                    <p><strong>Double-click</strong> to edit values</p>
                    <p><strong>Ctrl+Z/Y</strong> for undo/redo</p>
                </div>
            </aside>
        );
    }

    // ── M2 Palette ───────────────────────────────────────────────────
    return (
        <aside className="editor-v2-palette">
            {m2Groups.map(group => (
                <div key={group} className="palette-group">
                    <div className="palette-group__title">{group}</div>
                    {m2PaletteItems.filter(i => i.group === group).map((item) => (
                        <div
                            key={item.type}
                            className={`palette-item ${item.group === 'Members' ? 'palette-item--member' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, item.type)}
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
