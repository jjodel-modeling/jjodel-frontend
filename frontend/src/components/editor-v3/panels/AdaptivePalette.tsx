/**
 * Editor V3 — AdaptivePalette: sidebar palette that adapts to editor mode.
 *
 * M2 (metamodel): static items — Class, Abstract Class, Enum, DataType, Package,
 *                  Attribute, Operation, Literal (drop on node).
 * M1 (model):     dynamic items from metamodel's non-abstract classes.
 *
 * Drag items onto the canvas to create new nodes/members.
 * Member items (Attribute, Operation, Literal) must be dropped on an existing node.
 */

import React, { useState, memo } from 'react';
import { PaletteItem } from './PaletteItem';
import { useEditorV3Context } from '../contexts/EditorV3Context';
import { useEditorMode, type InstantiableClass } from '../hooks/useEditorMode';

// ---------------------------------------------------------------------------
// M2 palette items
// ---------------------------------------------------------------------------

interface PaletteSectionConfig {
    title: string;
    items: Array<{
        icon: string;
        label: string;
        paletteType: string;
        paletteData?: Record<string, unknown>;
        hint?: string;
        className?: string;
    }>;
}

const M2_SECTIONS: PaletteSectionConfig[] = [
    {
        title: 'Classifiers',
        items: [
            { icon: 'bi-diagram-3', label: 'Class', paletteType: 'createClass' },
            { icon: 'bi-diagram-3', label: 'Abstract Class', paletteType: 'createClass', paletteData: { isAbstract: true }, className: 'v3-palette-item--abstract' },
            { icon: 'bi-list-ol', label: 'Enumeration', paletteType: 'createEnum' },
            { icon: 'bi-file-earmark-code', label: 'DataType', paletteType: 'createDataType' },
        ],
    },
    {
        title: 'Structure',
        items: [
            { icon: 'bi-folder', label: 'Package', paletteType: 'createPackage' },
        ],
    },
    {
        title: 'Members',
        items: [
            { icon: 'bi-card-text', label: 'Attribute', paletteType: 'addAttribute', hint: 'drop on class' },
            { icon: 'bi-gear', label: 'Operation', paletteType: 'addOperation', hint: 'drop on class' },
            { icon: 'bi-hash', label: 'Literal', paletteType: 'addLiteral', hint: 'drop on enum' },
        ],
    },
];

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function PaletteSection({ title, children, defaultOpen = true }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={`v3-palette-section ${open ? '' : 'v3-palette-section--collapsed'}`}>
            <button
                className="v3-palette-section__header"
                onClick={() => setOpen(o => !o)}
            >
                <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} v3-palette-section__chevron`} />
                <span className="v3-palette-section__title">{title}</span>
            </button>
            {open && (
                <div className="v3-palette-section__body">
                    {children}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// M2 Palette
// ---------------------------------------------------------------------------

function MetamodelPalette() {
    return (
        <>
            {M2_SECTIONS.map(section => (
                <PaletteSection key={section.title} title={section.title}>
                    {section.items.map(item => (
                        <PaletteItem
                            key={item.paletteType + (item.label)}
                            icon={item.icon}
                            label={item.label}
                            paletteType={item.paletteType}
                            paletteData={item.paletteData}
                            hint={item.hint}
                            className={item.className}
                        />
                    ))}
                </PaletteSection>
            ))}

            <PaletteSection title="Connections">
                <div className="v3-palette-info">
                    <i className="bi bi-info-circle" />
                    <span>Drag between handles to connect nodes</span>
                </div>
            </PaletteSection>

            <div className="v3-palette-divider" />

            <div className="v3-palette-instructions">
                <p><strong>Drag</strong> classifiers to canvas</p>
                <p><strong>Drag</strong> members onto classes/enums</p>
                <p><strong>Double-click</strong> to edit names</p>
                <p><strong>Delete</strong> to remove selection</p>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// M1 Palette (dynamic — reads classes from metamodel)
// ---------------------------------------------------------------------------

function ModelPalette({ instantiableClasses }: { instantiableClasses: InstantiableClass[] }) {
    return (
        <>
            <PaletteSection title="Instances">
                {instantiableClasses.length === 0 ? (
                    <div className="v3-palette-info">
                        <i className="bi bi-info-circle" />
                        <span>No instantiable classes in metamodel</span>
                    </div>
                ) : (
                    instantiableClasses.map(cls => (
                        <PaletteItem
                            key={cls.id}
                            icon="bi-box"
                            label={cls.name}
                            sublabel={`${cls.attributeCount} attr, ${cls.referenceCount} ref`}
                            paletteType="createObject"
                            paletteData={{ classId: cls.id, className: cls.name }}
                        />
                    ))
                )}
            </PaletteSection>

            <PaletteSection title="Links">
                <div className="v3-palette-info">
                    <i className="bi bi-info-circle" />
                    <span>Drag between handles to link instances</span>
                </div>
            </PaletteSection>

            <div className="v3-palette-divider" />

            <div className="v3-palette-instructions">
                <p><strong>Drag</strong> classes to create instances</p>
                <p><strong>Double-click</strong> to edit values</p>
                <p><strong>Delete</strong> to remove selection</p>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// AdaptivePalette (main export)
// ---------------------------------------------------------------------------

function AdaptivePaletteInner() {
    const ctx = useEditorV3Context();
    const modeInfo = useEditorMode(ctx.modelId, ctx.mode);

    if (modeInfo.mode === 'model') {
        return (
            <aside className="v3-palette">
                <div className="v3-palette__header">
                    Palette
                    <span className="v3-palette__mode-badge">M1</span>
                </div>
                <ModelPalette instantiableClasses={modeInfo.instantiableClasses} />
            </aside>
        );
    }

    return (
        <aside className="v3-palette">
            <div className="v3-palette__header">
                Palette
                <span className="v3-palette__mode-badge">M2</span>
            </div>
            <MetamodelPalette />
        </aside>
    );
}

export const AdaptivePalette = memo(AdaptivePaletteInner);
