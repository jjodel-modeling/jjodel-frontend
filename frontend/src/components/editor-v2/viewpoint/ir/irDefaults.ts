/**
 * irDefaults — IR default views (Fase 2a, spec v1.2 sez. 2/11).
 *
 * IR equivalents of the classic default M1 views (CLASSIC_OBJECT_VIEW_JSX /
 * CLASSIC_SINGLETON_VIEW_JSX). They use the '*' wildcard (minimum specificity:
 * any metaclass-declared view beats them at equal priority) and replicate the
 * UML instance notation already rendered natively by ObjectNode: underlined
 * "name : Metaclass" header plus an attribute compartment.
 *
 * Notes:
 * - CLASSIC_VALUE_VIEW_JSX has no IR equivalent: in EditorV2 values are rows
 *   inside the object node, never standalone nodes.
 * - M2 (metamodel) needs no IR default: ClassNode/EnumNode/PackageNode are the
 *   native abstract rendering and never went through jsxString in the flow.
 * - Consumed by the Fase 4 inverse migration (marker-matched classic views →
 *   these factories, migratedFrom: 'classic-default') and by dev fixtures.
 */

import type { VertexViewIR } from './irTypes';

/** Stable id for the migrated default view (Fase 4 idempotency). */
export const IR_DEFAULT_OBJECT_VIEW_ID = 'Pointer_IRDefaultObjectView';

export function defaultObjectViewIR(): VertexViewIR {
    return {
        irVersion: 'ir-1.2',
        kind: 'vertex',
        metaclasses: '*',
        priority: 0,
        exclusive: true,
        label: 'Object (IR default)',
        shape: {
            form: 'rect',
            labels: [
                { position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' } },
            ],
        },
        fieldCompartments: [
            {
                id: 'attributes',
                source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
                separator: true,
            },
        ],
    };
}

/*
 * No singleton IR default: singleton-ness lives on the metaclass
 * (DClass.isSingleton), which the Predicate grammar deliberately cannot reach,
 * and ObjectNode renders the singleton diamond badge natively on the IR branch
 * (the badge sits outside IRNodeContent in the wrapper). The classic
 * CLASSIC_SINGLETON_VIEW_JSX therefore migrates onto defaultObjectViewIR.
 */
