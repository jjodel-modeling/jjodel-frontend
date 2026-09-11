/**
 * JjScript CREATE Command Handler
 * Creates new model elements (classes, attributes, references, etc.)
 */

import {
    CreateArgs,
    ExecutionResult,
    ExecutionContext,
    QualifiedName
} from '../../types';
import {
    resolveElement, resolveElementInMetamodel,
    resolveTargetInMetamodel, resolveTargetInProject, resolveEnumTypeTarget,
    kindLabel, memberMissingMessage, ResolutionKind, TargetResolution
} from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject, getDefaultParent, needsParent, getTargetMetamodel } from '../utils';
import { executeCreateInstance } from './instance';

// Import Jjodel model types and actions
import {
    DClass,
    DAttribute,
    DReference,
    DOperation,
    DParameter,
    DPackage,
    DEnumerator,
    DEnumLiteral,
    Defaults,
    SetFieldAction
} from '../../../joiner';

// ============================================
// ATTRIBUTE TYPE NORMALIZATION
// ============================================

/**
 * Map user-facing type aliases to the E-prefixed names expected by ShortAttribETypes.
 * Covers both the JjScript TYPE_ALIASES ('String', 'Integer', 'bool', ...) and the
 * raw Ecore names ('EString', 'EInt', 'EBoolean', ...) that parseTypeReference
 * parks under `kind: 'class'` because they are not in TYPE_ALIASES.
 */
const PRIMITIVE_ATTRIBUTE_TYPES: Record<string, string> = {
        'estring':  'EString',
        'string':   'EString',
        'str':      'EString',
        'echar':    'EChar',
        'char':     'EChar',
        'eint':     'EInt',
        'int':      'EInt',
        'integer':  'EInt',
        'eshort':   'EShort',
        'short':    'EShort',
        'elong':    'ELong',
        'long':     'ELong',
        'ebyte':    'EByte',
        'byte':     'EByte',
        'eboolean': 'EBoolean',
        'boolean':  'EBoolean',
        'bool':     'EBoolean',
        'edate':    'EDate',
        'date':     'EDate',
        'edouble':  'EDouble',
        'double':   'EDouble',
        'efloat':   'EFloat',
        'float':    'EFloat',
        'evoid':    'EVoid',
        'void':     'EVoid',
};

/**
 * The primitive this name denotes, or `null` when it denotes none.
 *
 * `normalizeAttributeType` cannot answer that question: its `?? 'EString'` returns the
 * same value for 'String' and for 'Mood', which is the first of the two silent fallbacks
 * that typed every enum-valued attribute as EString. Measured in
 * `docs/discovery/discovery_2026-09-11_attribute_enum_type.md` §3.1.
 */
export function primitiveAttributeType(raw: string): string | null {
    return PRIMITIVE_ATTRIBUTE_TYPES[raw.trim().toLowerCase()] ?? null;
}

/**
 * Unchanged behaviour, kept for the callers that want a type name no matter what.
 * The attribute-creation path no longer uses it: it needs to tell 'not a primitive'
 * from 'EString', and this cannot.
 */
export function normalizeAttributeType(raw: string): string {
    return primitiveAttributeType(raw) ?? 'EString';
}

/**
 * Extract the raw type name string from a TypeReference produced by the parser.
 * parseTypeReference returns `{ kind: 'primitive', type }` for names in TYPE_ALIASES,
 * and `{ kind: 'class', name }` as a fallback for unknown identifiers — which includes
 * the E-prefixed names (EString, EInt, ...) users commonly type.
 */
function rawTypeName(typeRef: any): string | undefined {
    if (!typeRef) return undefined;
    if (typeRef.kind === 'primitive') return typeRef.type;
    if (typeRef.kind === 'class' || typeRef.kind === 'enum') {
        return typeRef.name?.raw
            ?? typeRef.name?.segments?.[typeRef.name.segments.length - 1];
    }
    return undefined;
}

// ============================================
// PARENT KINDS
// ============================================

/**
 * The element kinds the target of `create <type> ... in <Target>` may legitimately be.
 *
 * Mirrors the guard each creator applies downstream (`isClass`, `isEnum`, `isOperation`),
 * so a wrong-kind target is caught while resolving instead of after the fact. Without it
 * the resolver returned whichever element matched the name first, ignoring case and kind:
 * `create literal HAPPY in Mood` picked the attribute `Scene.mood` over the enum `Mood`.
 */
const PARENT_KINDS_BY_ELEMENT_TYPE: { [elementType: string]: ResolutionKind[] } = {
    'attribute':      ['class'],
    'reference':      ['class'],
    'containment':    ['class'],
    'composition':    ['class'],
    'operation':      ['class'],
    'parameter':      ['operation'],
    'literal':        ['enum'],
    'class':          ['package', 'model'],
    'abstract class': ['package', 'model'],
    'interface':      ['package', 'model'],
    'enum':           ['package', 'model'],
    'enumeration':    ['package', 'model'],
    'package':        ['package', 'model'],
};

/**
 * The sentence explaining the restriction, appended to a not-found message so it names the
 * kind that was expected. Wording is the one the creators already use, verbatim: the
 * recovery rule `literal-in-attribute` matches on 'Literals can only be added to enums'
 * (jjscript/recovery/rules.ts:94) and must keep firing for the case it was written for —
 * the target really is an attribute and no enum by that name exists.
 */
const PARENT_RULE_BY_ELEMENT_TYPE: { [elementType: string]: string } = {
    'attribute':   'Attributes can only be added to classes.',
    'reference':   'References can only be added to classes.',
    'containment': 'References can only be added to classes.',
    'composition': 'References can only be added to classes.',
    'operation':   'Operations can only be added to classes.',
    'parameter':   'Parameters can only be added to operations.',
    'literal':     'Literals can only be added to enums.',
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Get the element type name for error messages
 */
function getElementTypeName(element: any): string {
    if (!element) return 'unknown';

    const className = element.className || element.constructor?.name || '';

    if (className.includes('Class')) return 'class';
    if (className.includes('Package')) return 'package';
    if (className.includes('Enum') || className.includes('Enumerator')) return 'enum';
    if (className.includes('Operation')) return 'operation';
    if (className.includes('Attribute')) return 'attribute';
    if (className.includes('Reference')) return 'reference';
    if (className.includes('Model')) return 'model';

    return className.toLowerCase() || 'unknown';
}

/**
 * Check if element is a Class (not Package, Enum, etc.)
 */
function isClass(element: any): boolean {
    if (!element) return false;
    const className = element.className || element.constructor?.name || '';
    return className.includes('Class') && !className.includes('DataType');
}

/**
 * Check if element is an Enum/Enumerator
 */
function isEnum(element: any): boolean {
    if (!element) return false;
    const className = element.className || element.constructor?.name || '';
    return className.includes('Enum') || className.includes('Enumerator');
}

/**
 * Check if element is an Operation
 */
function isOperation(element: any): boolean {
    if (!element) return false;
    const className = element.className || element.constructor?.name || '';
    return className.includes('Operation');
}

// ============================================
// CREATE COMMAND EXECUTOR
// ============================================

export async function executeCreate(
    args: CreateArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { elementType, name, parent, options } = args;

    try {
        // Get current project and model
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'create',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot create element without an active project' }]
            };
        }

        // M1 routing: 'create instance <ClassName>' delegates to the instance handler.
        if (elementType === 'instance') {
            return executeCreateInstance(args, context, project);
        }

        // M2 guard: every other elementType modifies the metamodel.
        if (context.level === 'M1') {
            return {
                success: false,
                command: 'create',
                message: `'create ${elementType}' modifies the metamodel`,
                errors: [{
                    code: 'WRONG_LEVEL',
                    message: `Open a metamodel editor (M2) to create a ${elementType}. To create an instance in M1, use 'create instance <ClassName>'.`
                }]
            };
        }

        // Get target metamodel for scoped resolution
        // This prevents the bug where elements are added to wrong classes
        // when the same class name exists in multiple metamodels
        const targetMetamodel = getTargetMetamodel(context, project);

        // Resolve parent context - use scoped resolution when we have a target metamodel,
        // restricted to the kinds this elementType can legitimately live in.
        const parentKinds = PARENT_KINDS_BY_ELEMENT_TYPE[elementType];
        let parentElement;
        let parentAmbiguity: string[] | undefined;
        let parentMemberMissing: TargetResolution['memberMissingOn'];
        if (parent) {
            // First try scoped resolution within target metamodel
            let resolution: TargetResolution = targetMetamodel
                ? resolveTargetInMetamodel(parent, targetMetamodel, parentKinds)
                : { element: null };
            if (!resolution.element && !resolution.ambiguousWith) {
                // Log warning but try project-wide fallback for backward compatibility
                if (targetMetamodel) {
                    console.warn(`[JjScript] Parent '${qualifiedNameToString(parent)}' not found in target metamodel, trying project-wide search`);
                }
                resolution = resolveTargetInProject(parent, project, parentKinds);
            }
            parentElement = resolution.element;
            parentAmbiguity = resolution.ambiguousWith;
            parentMemberMissing = resolution.memberMissingOn;

            // Types with no downstream guard (class, enum, package: they take whatever
            // `father` they are handed) fall back to the unrestricted search rather than
            // failing, so a parent that used to resolve still does.
            if (!parentElement && !parentAmbiguity && !resolution.memberMissingOn && !needsParent(elementType)) {
                parentElement = targetMetamodel
                    ? resolveElementInMetamodel(parent, targetMetamodel)
                    : null;
                if (!parentElement) parentElement = resolveElement(parent, project);
            }
        } else {
            parentElement = getDefaultParent(project, elementType);
        }

        if (parentMemberMissing) {
            // e.g. `create parameter p in Shape.draw` where `draw` is not on `Shape`.
            const missing = memberMissingMessage(parentMemberMissing, kindLabel(parentKinds));
            return {
                success: false,
                command: 'create',
                message: missing,
                errors: [{
                    code: 'MEMBER_NOT_FOUND',
                    message: missing,
                    suggestion: 'Check the member name, and the case of the container name'
                }]
            };
        }

        if (parentAmbiguity && parent) {
            const expected = kindLabel(parentKinds).toLowerCase();
            return {
                success: false,
                command: 'create',
                message: `'${qualifiedNameToString(parent)}' is ambiguous: ${parentAmbiguity.join(', ')}`,
                errors: [{
                    code: 'AMBIGUOUS_PARENT',
                    message: `More than one ${expected} matches '${qualifiedNameToString(parent)}' ignoring case: ${parentAmbiguity.join(', ')}`,
                    suggestion: 'Use the exact name, matching case, of the one you mean'
                }]
            };
        }

        if (!parentElement && needsParent(elementType)) {
            const expected = kindLabel(parentKinds);
            const rule = PARENT_RULE_BY_ELEMENT_TYPE[elementType];
            const notFound = `${expected} '${parent ? qualifiedNameToString(parent) : ''}' not found.${rule ? ' ' + rule : ''}`;
            return {
                success: false,
                command: 'create',
                message: parent ? notFound : `Could not find parent for ${elementType}`,
                errors: [{
                    code: 'PARENT_NOT_FOUND',
                    message: parent
                        ? notFound
                        : `No suitable parent found for ${elementType}`
                }]
            };
        }

        // Create the element based on type
        let result: ExecutionResult;

        switch (elementType) {
            case 'class':
            case 'abstract class':
            case 'interface':
                result = await createClass(name, parentElement, options, elementType === 'abstract class', elementType === 'interface', project, targetMetamodel);
                break;

            case 'attribute':
                result = await createAttribute(name, parentElement, options, project, targetMetamodel);
                break;

            case 'reference':
                result = await createReference(name, parentElement, options, false, project, targetMetamodel);
                break;

            case 'containment':
            case 'composition':
                // "create containment" is shorthand for "create reference ... containment"
                result = await createReference(name, parentElement, options, true, project, targetMetamodel);
                break;

            case 'operation':
                result = await createOperation(name, parentElement, options);
                break;

            case 'parameter':
                result = await createParameter(name, parentElement, options);
                break;

            case 'package':
                result = await createPackage(name, parentElement, options);
                break;

            case 'enum':
            case 'enumeration':
                result = await createEnumerator(name, parentElement, options);
                break;

            case 'literal':
                result = await createEnumLiteral(name, parentElement, options);
                break;

            default:
                result = {
                    success: false,
                    command: 'create',
                    message: `Element type '${elementType}' is not yet supported`,
                    errors: [{ code: 'UNSUPPORTED_TYPE', message: `Cannot create ${elementType}` }]
                };
        }

        return result;

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'create',
            message: `Failed to create ${elementType}: ${err.message}`,
            errors: [{ code: 'CREATE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// ELEMENT CREATORS
// ============================================

async function createClass(
    name: string,
    parent: any,
    options: CreateArgs['options'],
    isAbstract: boolean = false,
    isInterface: boolean = false,
    project?: any,
    targetMetamodel?: any
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            // Get the parent ID (package or model)
            const parentId = parent?.id || parent;

            // DClass.new signature: (name, isInterface, isAbstract, isPrimitive, partial, partialDefaultName, father, persist, id)
            // With persist=true, the action is automatically fired
            const newClass = DClass.new(
                name,
                isInterface || options?.interface || false,
                isAbstract || options?.abstract || false,
                false,      // isPrimitive
                undefined,  // partial
                undefined,  // partialDefaultName
                parentId,   // father - this is the key parameter!
                true        // persist - automatically dispatches the action
            );

            // Handle superclass (extends) - use scoped resolution when available
            let superClassName: string | undefined;
            if (options?.superClass && project) {
                // Prefer scoped resolution within the target metamodel
                let superClass = targetMetamodel
                    ? resolveElementInMetamodel(options.superClass, targetMetamodel)
                    : null;
                // Fallback to project-wide search
                if (!superClass) {
                    superClass = resolveElement(options.superClass, project);
                }
                if (superClass) {
                    // Set the extends property using SetFieldAction
                    // The '=' operator sets the array, '+=' adds to it
                    SetFieldAction.new(newClass, 'extends', superClass.id, '+=', true);
                    superClassName = superClass.name;
                }
            }

            // Handle multiple superclasses - use scoped resolution when available
            if (options?.superClasses && options.superClasses.length > 1 && project) {
                // Skip first one as it's already handled above
                for (let i = 1; i < options.superClasses.length; i++) {
                    let superClass = targetMetamodel
                        ? resolveElementInMetamodel(options.superClasses[i], targetMetamodel)
                        : null;
                    if (!superClass) {
                        superClass = resolveElement(options.superClasses[i], project);
                    }
                    if (superClass) {
                        SetFieldAction.new(newClass, 'extends', superClass.id, '+=', true);
                    }
                }
            }

            const typeLabel = isInterface ? 'interface' : isAbstract ? 'abstract class' : 'class';

            resolve({
                success: true,
                command: 'create',
                message: `Created ${typeLabel} '${name}'`,
                data: {
                    id: newClass.id,
                    name,
                    type: typeLabel,
                    superClass: superClassName
                },
                affectedElements: [newClass.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create class: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_CLASS_ERROR', message: (error as Error).message }]
            });
        }
    });
}

/** What `type <Name>` settled on, or the error that stops the line. */
type AttributeTypeOutcome =
    | { ok: true; typePointer: string; typeLabel: string; enumName?: string }
    | { ok: false; error: ExecutionResult };

/**
 * Resolve the `type <Name>` clause of `create attribute` to the pointer to write.
 *
 * Order, and each step is deliberate:
 *   1. no clause at all -> EString, the documented default, unchanged.
 *   2. a primitive -- whether the parser called it `primitive` or parked the raw Ecore
 *      spelling ('EString', 'EInt') under `class`, which it does for anything outside
 *      TYPE_ALIASES. `primitiveAttributeType` is the test; `normalizeAttributeType` is
 *      not, because its fallback answers 'EString' for 'Mood' too.
 *   3. an enumerator, kind-restricted, metamodel before project.
 *   4. anything else is an error. It used to be a silent EString with `success: true`.
 *
 * The QualifiedName goes to the resolver untouched -- NOT through `rawTypeName`, which
 * flattens `MM::Mood` to the string 'MM::Mood' and loses the qualification (referto §3.3).
 *
 * Ambiguity is answered apart from not-found: both are `element: null` on the
 * `resolveElement*` shorthands, and only `ambiguousWith` separates them (referto §5, R4).
 */
function resolveAttributeType(
    attrName: string,
    options: CreateArgs['options'],
    project?: any,
    targetMetamodel?: any
): AttributeTypeOutcome {
    const pointerFor = (shortType: string): string => (Defaults as any)['Pointer_' + shortType.toUpperCase()];

    const typeRef: any = options?.type;
    if (!typeRef) {
        return { ok: true, typePointer: pointerFor('EString'), typeLabel: 'EString' };
    }

    // 2. primitive, in either of the two shapes the parser produces.
    const spelled = rawTypeName(typeRef);
    const primitive = spelled ? primitiveAttributeType(spelled) : null;
    if (primitive) {
        // The table and Defaults are both compile-time constants, so a miss here is an
        // internal inconsistency, not user input -- it must not degrade to EString.
        const ptr = pointerFor(primitive);
        if (!ptr) {
            return { ok: false, error: {
                success: false,
                command: 'create',
                message: `Internal error: no pointer registered for primitive type '${primitive}'.`,
                errors: [{ code: 'UNKNOWN_PRIMITIVE_POINTER', message: `Missing Defaults.Pointer_${primitive.toUpperCase()}` }]
            }};
        }
        return { ok: true, typePointer: ptr, typeLabel: primitive };
    }

    // 3. an enumerator of the metamodel (or of the project, qualified or not).
    const qn: QualifiedName | undefined = typeRef.kind === 'class' ? typeRef.name : undefined;
    if (qn) {
        const found = resolveEnumTypeTarget(qn, targetMetamodel, project);
        if (found.element) {
            return { ok: true, typePointer: found.element.id, typeLabel: found.element.name, enumName: found.element.name };
        }
        if (found.ambiguousWith && found.ambiguousWith.length > 0) {
            const shown = found.ambiguousWith.join(', ');
            return { ok: false, error: {
                success: false,
                command: 'create',
                message: `Ambiguous type '${qualifiedNameToString(qn)}' for attribute '${attrName}': ${shown}. Qualify as Metamodel::Name.`,
                errors: [{
                    code: 'AMBIGUOUS_TYPE',
                    message: `'${qualifiedNameToString(qn)}' matches more than one enum: ${shown}`,
                    suggestion: 'Qualify the type as Metamodel::Name.'
                }]
            }};
        }
    }

    // 4. neither a primitive nor a resolvable enum.
    const shownName = qn ? qualifiedNameToString(qn) : (spelled ?? String(typeRef?.type ?? ''));
    return { ok: false, error: {
        success: false,
        command: 'create',
        message: `Unknown type '${shownName}' for attribute '${attrName}'. Expected a primitive type or an enum.`,
        errors: [{
            code: 'UNKNOWN_ATTRIBUTE_TYPE',
            message: `'${shownName}' is neither a primitive type nor an enum reachable from this metamodel`,
            suggestion: 'Use a primitive (String, Integer, Boolean, ...) or an existing enum. Qualify as Metamodel::Name if needed.'
        }]
    }};
}

async function createAttribute(
    name: string,
    parent: any,
    options: CreateArgs['options'],
    project?: any,
    targetMetamodel?: any
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Attribute requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the attribute to' }]
        };
    }

    // Validate that the parent is a class
    if (!isClass(parent)) {
        const parentType = getElementTypeName(parent);
        return {
            success: false,
            command: 'create',
            message: `Cannot create attribute in ${parentType} '${parent.name || 'unnamed'}'. Attributes can only be added to classes.`,
            errors: [{
                code: 'INVALID_PARENT_TYPE',
                message: `Expected a class, but '${parent.name || 'parent'}' is a ${parentType}`,
                suggestion: 'Use "create attribute <name> in <ClassName> type <Type>"'
            }]
        };
    }

    // The type is settled BEFORE the element exists: an unresolvable one must not leave a
    // half-made attribute behind. Three outcomes only -- a primitive, an enumerator, or an
    // error; the silent EString fallback this replaces is gone from both of its steps
    // (docs/discovery/discovery_2026-09-11_attribute_enum_type.md §3).
    const typed = resolveAttributeType(name, options, project, targetMetamodel);
    if (!typed.ok) return typed.error;

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            const newAttr = DAttribute.new(name, typed.typePointer, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created attribute '${name}'${typed.enumName ? ` : ${typed.enumName}` : ''}`,
                data: { id: newAttr.id, name, type: 'attribute', attributeType: typed.typeLabel },
                affectedElements: [newAttr.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create attribute: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_ATTRIBUTE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createReference(
    name: string,
    parent: any,
    options: CreateArgs['options'],
    isContainment: boolean = false,
    project?: any,
    targetMetamodel?: any
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Reference requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the reference to' }]
        };
    }

    // Validate that the parent is a class
    if (!isClass(parent)) {
        const parentType = getElementTypeName(parent);
        const refType = isContainment ? 'containment/composition' : 'reference';
        return {
            success: false,
            command: 'create',
            message: `Cannot create ${refType} in ${parentType} '${parent.name || 'unnamed'}'. References can only be added to classes.`,
            errors: [{
                code: 'INVALID_PARENT_TYPE',
                message: `Expected a class, but '${parent.name || 'parent'}' is a ${parentType}`,
                suggestion: 'Use "create reference <name> in <ClassName> type <TargetClass>"'
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            // DReference.new(name, type, father, persist)
            const newRef = DReference.new(name, undefined, parentId, true);

            // Apply target type if specified
            let targetTypeName: string | undefined;
            if (options?.type && project) {
                // options.type can be { kind: 'class', name: QualifiedName } or { kind: 'primitive', type: string }
                if (options.type.kind === 'class' && options.type.name) {
                    // Use scoped resolution when we have a target metamodel
                    // This prevents resolving to wrong class when same name exists in multiple metamodels
                    let targetClass = targetMetamodel
                        ? resolveElementInMetamodel(options.type.name, targetMetamodel)
                        : null;

                    // Fall back to project-wide search if not found in target metamodel
                    if (!targetClass) {
                        targetClass = resolveElement(options.type.name, project);
                    }

                    if (targetClass) {
                        SetFieldAction.new(newRef, 'type', targetClass.id, undefined, true);
                        targetTypeName = targetClass.name;
                    }
                }
            }

            // Apply multiplicity if specified
            // Multiplicity values: '*' in parsed form means unbounded, converted to -1 for model
            if (options?.multiplicity) {
                const { lower, upper } = options.multiplicity;
                SetFieldAction.new(newRef, 'lowerBound', lower, undefined, false);
                // Convert '*' to -1 for unbounded upper bound (EMF/Ecore convention)
                const upperValue = upper === '*' ? -1 : upper;
                SetFieldAction.new(newRef, 'upperBound', upperValue, undefined, false);
            }

            // Apply containment if specified (via "containment" keyword or "create containment" command)
            // Note: The DReference property is called 'composition', but in EMF/Ecore it's called 'containment'
            const shouldBeContainment = isContainment || options?.containment;
            if (shouldBeContainment) {
                // SetFieldAction.new(element, property, value, operator, isPointer)
                // operator: undefined = '=' assignment
                // isPointer: false because composition is a boolean value, not a reference
                SetFieldAction.new(newRef, 'composition', true, undefined, false);
            }

            const typeLabel = shouldBeContainment ? 'containment' : 'reference';
            const multiplicityStr = options?.multiplicity?.raw || '';

            resolve({
                success: true,
                command: 'create',
                message: `Created ${typeLabel} '${name}'${targetTypeName ? ` → ${targetTypeName}` : ''}${multiplicityStr ? ` ${multiplicityStr}` : ''}`,
                data: {
                    id: newRef.id,
                    name,
                    type: typeLabel,
                    targetType: targetTypeName,
                    containment: shouldBeContainment,
                    multiplicity: options?.multiplicity
                },
                affectedElements: [newRef.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create reference: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_REFERENCE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createOperation(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Operation requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the operation to' }]
        };
    }

    // Validate that the parent is a class
    if (!isClass(parent)) {
        const parentType = getElementTypeName(parent);
        return {
            success: false,
            command: 'create',
            message: `Cannot create operation in ${parentType} '${parent.name || 'unnamed'}'. Operations can only be added to classes.`,
            errors: [{
                code: 'INVALID_PARENT_TYPE',
                message: `Expected a class, but '${parent.name || 'parent'}' is a ${parentType}`,
                suggestion: 'Use "create operation <name> in <ClassName>"'
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;
            const returnType = options?.returnType?.kind === 'primitive' ? options.returnType.type : undefined;

            // DOperation.new(name, type, params, father, persist)
            const newOp = DOperation.new(name, returnType, [], parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created operation '${name}'`,
                data: { id: newOp.id, name, type: 'operation' },
                affectedElements: [newOp.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create operation: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_OPERATION_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createParameter(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Parameter requires a parent operation',
            errors: [{ code: 'NO_PARENT', message: 'Specify an operation to add the parameter to' }]
        };
    }

    // Validate that the parent is an operation
    if (!isOperation(parent)) {
        const parentType = getElementTypeName(parent);
        return {
            success: false,
            command: 'create',
            message: `Cannot create parameter in ${parentType} '${parent.name || 'unnamed'}'. Parameters can only be added to operations.`,
            errors: [{
                code: 'INVALID_PARENT_TYPE',
                message: `Expected an operation, but '${parent.name || 'parent'}' is a ${parentType}`,
                suggestion: 'Use "create parameter <name> in <ClassName>.<operationName> type <Type>"'
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;
            const typeName = options?.type?.kind === 'primitive' ? options.type.type : undefined;

            // DParameter.new(name, type, father, persist)
            const newParam = DParameter.new(name, typeName, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created parameter '${name}'`,
                data: { id: newParam.id, name, type: 'parameter' },
                affectedElements: [newParam.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create parameter: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_PARAMETER_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createPackage(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            const parentId = parent?.id || parent;

            // DPackage.new(name, uri, prefix, father, persist, fatherClass)
            const newPkg = DPackage.new(
                name,
                options?.nsUri,
                options?.nsPrefix,
                parentId,
                true
            );

            resolve({
                success: true,
                command: 'create',
                message: `Created package '${name}'`,
                data: { id: newPkg.id, name, type: 'package' },
                affectedElements: [newPkg.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create package: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_PACKAGE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createEnumerator(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            const parentId = parent?.id || parent;

            // DEnumerator.new(name, father, persist)
            const newEnum = DEnumerator.new(name, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created enum '${name}'`,
                data: { id: newEnum.id, name, type: 'enum' },
                affectedElements: [newEnum.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create enum: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_ENUM_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createEnumLiteral(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Enum literal requires a parent enum',
            errors: [{ code: 'NO_PARENT', message: 'Specify an enum to add the literal to' }]
        };
    }

    // Validate that the parent is an enum
    if (!isEnum(parent)) {
        const parentType = getElementTypeName(parent);
        return {
            success: false,
            command: 'create',
            message: `Cannot create literal in ${parentType} '${parent.name || 'unnamed'}'. Literals can only be added to enums.`,
            errors: [{
                code: 'INVALID_PARENT_TYPE',
                message: `Expected an enum, but '${parent.name || 'parent'}' is a ${parentType}`,
                suggestion: 'Use "create literal <name> in <EnumName>"'
            }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            // DEnumLiteral.new(name, value, father, persist)
            const newLiteral = DEnumLiteral.new(name, options?.value, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created enum literal '${name}'`,
                data: { id: newLiteral.id, name, type: 'literal' },
                affectedElements: [newLiteral.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create enum literal: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_LITERAL_ERROR', message: (error as Error).message }]
            });
        }
    });
}

