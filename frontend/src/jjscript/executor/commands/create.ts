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
import { resolveElement, resolveElementInMetamodel } from '../resolvers';
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
export function normalizeAttributeType(raw: string): string {
    const map: Record<string, string> = {
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
    return map[raw.toLowerCase()] ?? 'EString';
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

        // Resolve parent context - use scoped resolution when we have a target metamodel
        let parentElement;
        if (parent) {
            // First try scoped resolution within target metamodel
            if (targetMetamodel) {
                parentElement = resolveElementInMetamodel(parent, targetMetamodel);
                if (!parentElement) {
                    // Log warning but try project-wide fallback for backward compatibility
                    console.warn(`[JjScript] Parent '${qualifiedNameToString(parent)}' not found in target metamodel, trying project-wide search`);
                    parentElement = resolveElement(parent, project);
                }
            } else {
                parentElement = resolveElement(parent, project);
            }
        } else {
            parentElement = getDefaultParent(project, elementType);
        }

        if (!parentElement && needsParent(elementType)) {
            return {
                success: false,
                command: 'create',
                message: `Could not find parent for ${elementType}`,
                errors: [{
                    code: 'PARENT_NOT_FOUND',
                    message: parent
                        ? `Parent '${qualifiedNameToString(parent)}' not found`
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
                result = await createAttribute(name, parentElement, options);
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

async function createAttribute(
    name: string,
    parent: any,
    options: CreateArgs['options']
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

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            const rawType = rawTypeName(options?.type);
            const shortType = rawType ? normalizeAttributeType(rawType) : 'EString';
            // Convert short-name (e.g. 'EInt') to the stable Pointer ID the framework
            // expects. Requires the companion fix in DTypedElement (joiner/classes.ts)
            // which short-circuits lookup when it receives an already-valid Pointer_E* ID.
            const typePointer = (Defaults as any)['Pointer_' + shortType.toUpperCase()] ?? Defaults.Pointer_ESTRING;

            const newAttr = DAttribute.new(name, typePointer, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created attribute '${name}'`,
                data: { id: newAttr.id, name, type: 'attribute', attributeType: shortType },
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

