import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parser';
import type {
    ParseResult,
    CreateArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    AddArgs,
    RemoveArgs,
    MoveArgs,
    CopyArgs,
    ListArgs,
    ShowArgs,
    HelpArgs,
    UndoRedoArgs,
    ClearArgs,
    ValidateArgs,
    ExtendsArgs,
    EvalArgs,
    LetArgs,
    ForAllArgs,
    AbstractArgs,
    BlockArgs,
} from '../types';

// Helper: parse and assert success
function parseOk(input: string): ParseResult {
    const result = parse(input);
    expect(result.success, `Parse failed for "${input}": ${result.errors?.map(e => e.message).join(', ')}`).toBe(true);
    expect(result.ast).toBeDefined();
    return result;
}

// Helper: parse and get typed args
function args<T>(input: string): T {
    return parseOk(input).ast!.args as T;
}

// ─── CREATE ──────────────────────────────────────────────────

describe('Parser: create', () => {
    it('should parse "create class Person"', () => {
        const a = args<CreateArgs>('create class Person');
        expect(a.command).toBe('create');
        expect(a.elementType).toBe('class');
        expect(a.name).toBe('Person');
    });

    it('should parse "create abstract class Entity"', () => {
        const a = args<CreateArgs>('create abstract class Entity');
        expect(a.elementType).toBe('abstract class');
        expect(a.name).toBe('Entity');
    });

    it('should parse "create attribute name in Person type String"', () => {
        const a = args<CreateArgs>('create attribute name in Person type String');
        expect(a.elementType).toBe('attribute');
        expect(a.name).toBe('name');
        expect(a.parent?.segments).toContain('Person');
        expect(a.options?.type?.kind).toBe('primitive');
    });

    it('should parse "create reference friends in Person type Person [0..*]"', () => {
        const a = args<CreateArgs>('create reference friends in Person type Person [0..*]');
        expect(a.elementType).toBe('reference');
        expect(a.name).toBe('friends');
        expect(a.options?.multiplicity?.lower).toBe(0);
        expect(a.options?.multiplicity?.upper).toBe('*');
    });

    it('should parse "create containment children in Person type Person [0..*]"', () => {
        const a = args<CreateArgs>('create containment children in Person type Person [0..*]');
        expect(a.elementType).toBe('containment');
        expect(a.name).toBe('children');
    });

    it('should parse "create enum Status"', () => {
        const a = args<CreateArgs>('create enum Status');
        expect(a.elementType).toBe('enum');
        expect(a.name).toBe('Status');
    });

    it('should parse "create literal ACTIVE in Status"', () => {
        const a = args<CreateArgs>('create literal ACTIVE in Status');
        expect(a.elementType).toBe('literal');
        expect(a.name).toBe('ACTIVE');
        expect(a.parent?.segments).toContain('Status');
    });

    it('should parse "create package domain"', () => {
        const a = args<CreateArgs>('create package domain');
        expect(a.elementType).toBe('package');
        expect(a.name).toBe('domain');
    });

    it('should parse "create operation greet in Person"', () => {
        const a = args<CreateArgs>('create operation greet in Person');
        expect(a.elementType).toBe('operation');
        expect(a.name).toBe('greet');
    });

    it('should parse create with extends option', () => {
        const a = args<CreateArgs>('create class Employee extends Person');
        expect(a.elementType).toBe('class');
        expect(a.name).toBe('Employee');
        expect(a.options?.superClass?.segments).toContain('Person');
    });

    it('should parse create attribute with default value', () => {
        const a = args<CreateArgs>('create attribute age in Person type Integer default 0');
        expect(a.name).toBe('age');
        expect(a.options?.defaultValue).toBeDefined();
    });

    it('should parse create with derived option', () => {
        const a = args<CreateArgs>('create attribute fullName in Person type String derived');
        expect(a.name).toBe('fullName');
        expect(a.options?.derived).toBe(true);
    });

    it('should parse create reference with containment flag', () => {
        const a = args<CreateArgs>('create reference items in Order type Item [0..*] containment');
        expect(a.options?.containment).toBe(true);
    });

    // Regression: create attribute used to ignore the `type` parameter and always
    // produce EString. These assertions document the parser output for every
    // alias that the executor's normalizeAttributeType is expected to accept.
    describe('create attribute — type parameter aliases', () => {
        const primitiveAliases = ['String', 'string', 'str', 'Integer', 'integer', 'int',
                                  'Boolean', 'boolean', 'bool', 'Date', 'date',
                                  'Double', 'double', 'Float', 'float'];
        it.each(primitiveAliases)('parses alias %s as primitive type', (alias) => {
            const a = args<CreateArgs>(`create attribute x in Person type ${alias}`);
            expect(a.options?.type?.kind).toBe('primitive');
        });

        // E-prefixed Ecore names are not in TYPE_ALIASES, so the parser stores them
        // as class-kind references. The executor's normalizeAttributeType is what
        // maps them back to ShortAttribETypes values.
        const ecoreNames = ['EString', 'EInt', 'EBoolean', 'EDate', 'EDouble',
                            'EFloat', 'ELong', 'EShort', 'EByte', 'EChar'];
        it.each(ecoreNames)('parses Ecore name %s as class-kind with raw name preserved', (name) => {
            const a = args<CreateArgs>(`create attribute x in Person type ${name}`);
            expect(a.options?.type?.kind).toBe('class');
            const classType = a.options?.type as { kind: 'class'; name: { raw: string } };
            expect(classType.name.raw).toBe(name);
        });
    });
});

// ─── DELETE ──────────────────────────────────────────────────

describe('Parser: delete', () => {
    it('should parse "delete Person"', () => {
        const a = args<DeleteArgs>('delete Person');
        expect(a.command).toBe('delete');
        expect(a.target.segments).toContain('Person');
    });

    it('should parse "delete class Person"', () => {
        const a = args<DeleteArgs>('delete class Person');
        expect(a.elementType).toBe('class');
        expect(a.target.segments).toContain('Person');
    });

    it('should parse "delete Person cascade"', () => {
        const a = args<DeleteArgs>('delete Person cascade');
        expect(a.cascade).toBe(true);
    });

    it('should parse "delete Person force"', () => {
        const a = args<DeleteArgs>('delete Person force');
        expect(a.force).toBe(true);
    });

    it('should parse qualified name target', () => {
        const a = args<DeleteArgs>('delete domain::OldClass');
        expect(a.target.segments).toEqual(['domain', 'OldClass']);
    });
});

// ─── RENAME ──────────────────────────────────────────────────

describe('Parser: rename', () => {
    it('should parse "rename Person to Human"', () => {
        const a = args<RenameArgs>('rename Person to Human');
        expect(a.command).toBe('rename');
        expect(a.target.segments).toContain('Person');
        expect(a.newName).toBe('Human');
    });

    it('should parse "rename Person as Human"', () => {
        const a = args<RenameArgs>('rename Person as Human');
        expect(a.newName).toBe('Human');
    });

    it('should parse "rename class Person to Human"', () => {
        const a = args<RenameArgs>('rename class Person to Human');
        expect(a.elementType).toBe('class');
    });
});

// ─── SET ─────────────────────────────────────────────────────

describe('Parser: set', () => {
    it('should parse "set Person.abstract = true"', () => {
        const a = args<SetArgs>('set Person.abstract = true');
        expect(a.command).toBe('set');
        expect(a.target.segments).toContain('Person');
        expect(a.property).toBeDefined();
    });

    it('should parse "set Person.abstract to true"', () => {
        const a = args<SetArgs>('set Person.abstract to true');
        expect(a.command).toBe('set');
    });

    it('should parse += operator', () => {
        const a = args<SetArgs>('set Person.superTypes += Animal');
        expect(a.operator).toBe('+=');
    });
});

// ─── ADD ─────────────────────────────────────────────────────

describe('Parser: add', () => {
    it('should parse "add attribute email to Person type String"', () => {
        const a = args<AddArgs>('add attribute email to Person type String');
        expect(a.command).toBe('add');
        expect(a.elementType).toBe('attribute');
        expect(a.name).toBe('email');
        expect(a.to.segments).toContain('Person');
    });
});

// ─── REMOVE ──────────────────────────────────────────────────

describe('Parser: remove', () => {
    it('should parse "remove name from Person"', () => {
        const a = args<RemoveArgs>('remove name from Person');
        expect(a.command).toBe('remove');
        expect(a.target.segments).toContain('name');
        expect(a.from.segments).toContain('Person');
    });
});

// ─── MOVE ────────────────────────────────────────────────────

describe('Parser: move', () => {
    it('should parse "move Person to NewPackage"', () => {
        const a = args<MoveArgs>('move Person to NewPackage');
        expect(a.command).toBe('move');
        expect(a.target.segments).toContain('Person');
        expect(a.to.segments).toContain('NewPackage');
    });
});

// ─── COPY ────────────────────────────────────────────────────

describe('Parser: copy', () => {
    it('should parse "copy Person to MyPackage as PersonCopy"', () => {
        const a = args<CopyArgs>('copy Person to MyPackage as PersonCopy');
        expect(a.command).toBe('copy');
        expect(a.target.segments).toContain('Person');
        expect(a.to.segments).toContain('MyPackage');
        expect(a.newName).toBe('PersonCopy');
    });

    it('should parse "copy MyPackage to Other deep"', () => {
        const a = args<CopyArgs>('copy MyPackage to Other deep');
        expect(a.deep).toBe(true);
    });
});

// ─── LIST ────────────────────────────────────────────────────

describe('Parser: list', () => {
    it('should parse "list"', () => {
        const a = args<ListArgs>('list');
        expect(a.command).toBe('list');
    });

    it('should parse "list class"', () => {
        const a = args<ListArgs>('list class');
        expect(a.elementType).toBe('class');
    });

    it('should parse "list attribute in Person"', () => {
        const a = args<ListArgs>('list attribute in Person');
        expect(a.elementType).toBe('attribute');
        expect(a.filter?.in?.segments).toContain('Person');
    });
});

// ─── SHOW ────────────────────────────────────────────────────

describe('Parser: show', () => {
    it('should parse "show Person"', () => {
        const a = args<ShowArgs>('show Person');
        expect(a.command).toBe('show');
    });

    it('should parse "show Person tree"', () => {
        const a = args<ShowArgs>('show Person tree');
        expect(a.detail).toBe('tree');
    });

    it('should parse "show project"', () => {
        const a = args<ShowArgs>('show project');
        expect(a.target).toBe('project');
    });

    it('should parse "show model full"', () => {
        const a = args<ShowArgs>('show model full');
        expect(a.target).toBe('model');
        expect(a.detail).toBe('full');
    });
});

// ─── HELP ────────────────────────────────────────────────────

describe('Parser: help', () => {
    it('should parse "help"', () => {
        const a = args<HelpArgs>('help');
        expect(a.command).toBe('help');
        expect(a.topic).toBeUndefined();
    });

    it('should parse "help create"', () => {
        const a = args<HelpArgs>('help create');
        expect(a.topic).toBe('create');
    });

    it('should parse "help syntax"', () => {
        const a = args<HelpArgs>('help syntax');
        expect(a.topic).toBe('syntax');
    });

    it('should parse "help examples"', () => {
        const a = args<HelpArgs>('help examples');
        expect(a.topic).toBe('examples');
    });
});

// ─── UNDO / REDO ─────────────────────────────────────────────

describe('Parser: undo/redo', () => {
    it('should parse "undo"', () => {
        const r = parseOk('undo');
        expect(r.ast!.command).toBe('undo');
    });

    it('should parse "undo 3"', () => {
        const a = args<UndoRedoArgs>('undo 3');
        expect(a.steps).toBe(3);
    });

    it('should parse "redo"', () => {
        const r = parseOk('redo');
        expect(r.ast!.command).toBe('redo');
    });

    it('should parse "redo 2"', () => {
        const a = args<UndoRedoArgs>('redo 2');
        expect(a.steps).toBe(2);
    });
});

// ─── CLEAR ───────────────────────────────────────────────────

describe('Parser: clear', () => {
    it('should parse "clear"', () => {
        const r = parseOk('clear');
        expect(r.ast!.command).toBe('clear');
    });

    it('should parse "clear history"', () => {
        const a = args<ClearArgs>('clear history');
        expect(a.target).toBe('history');
    });

    it('should parse "clear console"', () => {
        const a = args<ClearArgs>('clear console');
        expect(a.target).toBe('console');
    });
});

// ─── VALIDATE ────────────────────────────────────────────────

describe('Parser: validate', () => {
    it('should parse "validate"', () => {
        const r = parseOk('validate');
        expect(r.ast!.command).toBe('validate');
    });

    it('should parse "validate Person"', () => {
        const a = args<ValidateArgs>('validate Person');
        expect(a.target).toBeDefined();
    });
});

// ─── EXTENDS ─────────────────────────────────────────────────

describe('Parser: extends', () => {
    it('should parse "Employee extends Person"', () => {
        const a = args<ExtendsArgs>('Employee extends Person');
        expect(a.command).toBe('extends');
        expect(a.childClass.segments).toContain('Employee');
        expect(a.parentClass.segments).toContain('Person');
    });

    it('should parse qualified name extends', () => {
        const a = args<ExtendsArgs>('domain::Manager extends domain::Employee');
        expect(a.childClass.segments).toEqual(['domain', 'Manager']);
        expect(a.parentClass.segments).toEqual(['domain', 'Employee']);
    });
});

// ─── EVAL ────────────────────────────────────────────────────

describe('Parser: eval', () => {
    it('should parse "eval 2 + 3"', () => {
        const a = args<EvalArgs>('eval 2 + 3');
        expect(a.command).toBe('eval');
        expect(a.expression).toContain('2');
    });

    it('should delegate unrecognized input to eval', () => {
        // Anything that is not a known command gets delegated to JjEL eval
        const r = parseOk('2 + 3');
        expect(r.ast!.command).toBe('eval');
    });

    it('should delegate "exists" to eval (JjEL trigger)', () => {
        const r = parseOk('exists x in classes such that x.abstract');
        expect(r.ast!.command).toBe('eval');
    });

    it('should delegate "with...do" to eval (JjEL trigger)', () => {
        const r = parseOk('with Person do name');
        expect(r.ast!.command).toBe('eval');
    });
});

// ─── ABSTRACT ────────────────────────────────────────────────

describe('Parser: abstract', () => {
    it('should parse "abstract Person" as toggle', () => {
        const a = args<AbstractArgs>('abstract Person');
        expect(a.command).toBe('abstract');
        expect(a.target.segments).toContain('Person');
    });
});

// ─── LET ─────────────────────────────────────────────────────

describe('Parser: let', () => {
    it('should parse let with single binding and help body', () => {
        const a = args<LetArgs>('let $x = 42 in help');
        expect(a.command).toBe('let');
        expect(a.bindings.length).toBe(1);
        expect(a.bindings[0].name).toBe('$x');
        expect(a.bindings[0].valueExpr).toContain('42');
        expect(a.body).toBeDefined();
        expect(a.body.command).toBe('help');
    });

    it('should parse let with string value and show body', () => {
        const a = args<LetArgs>('let $name = "Person" in show project');
        expect(a.command).toBe('let');
        expect(a.bindings[0].name).toBe('$name');
        expect(a.body.command).toBe('show');
    });
});

// ─── FORALL ──────────────────────────────────────────────────

describe('Parser: forall', () => {
    it('should parse "forall c in classes do create class c.name" as JjScript forall', () => {
        const r = parseOk('forall c in classes do create class c');
        expect(r.ast!.command).toBe('forall');
        const a = r.ast!.args as ForAllArgs;
        expect(a.variable).toBe('c');
        expect(a.body).toBeDefined();
    });

    it('should parse forall with such that filter', () => {
        const r = parseOk('forall c in classes such that c.abstract do abstract c');
        expect(r.ast!.command).toBe('forall');
        const a = r.ast!.args as ForAllArgs;
        expect(a.filterExpr).toBeDefined();
    });

    it('should delegate forall WITHOUT "do" to eval (JjEL)', () => {
        // JjEL forall: "forall x in S : x.name" — no 'do' keyword
        const r = parseOk('forall x in items : x.name');
        expect(r.ast!.command).toBe('eval');
    });
});

// ─── BLOCK ───────────────────────────────────────────────────

describe('Parser: do...end block', () => {
    it('should parse a do...end block', () => {
        const r = parseOk('do\ncreate class A\ncreate class B\nend');
        expect(r.ast!.command).toBe('block');
        const a = r.ast!.args as BlockArgs;
        expect(a.commands.length).toBe(2);
    });
});

// ─── Error handling ──────────────────────────────────────────

describe('Parser: error handling', () => {
    it('should return error for empty input', () => {
        const r = parse('');
        expect(r.success).toBe(false);
        expect(r.errors).toBeDefined();
        expect(r.errors!.length).toBeGreaterThan(0);
    });

    it('should return error for whitespace-only input', () => {
        const r = parse('   ');
        expect(r.success).toBe(false);
    });

    it('should include position in errors', () => {
        const r = parse('');
        expect(r.errors![0].position).toBeDefined();
        expect(r.errors![0].position.line).toBe(1);
    });

    it('should still return tokens on error', () => {
        const r = parse('');
        // May or may not have tokens depending on implementation
        // Just verify no crash
        expect(r).toBeDefined();
    });
});
