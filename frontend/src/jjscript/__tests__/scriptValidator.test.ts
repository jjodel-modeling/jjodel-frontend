import { describe, it, expect } from 'vitest';
import { collectClassifierNames, validateScriptIntegrity } from '../executor/scriptValidator';

describe('validateScriptIntegrity', () => {
    it('rejects a script ending with an unterminated string, at the right line', () => {
        const script = [
            'create class Person',
            'create attribute name in Person',
            'set Person.name = "Alice',   // unterminated quote (truncated)
        ].join('\n');
        const res = validateScriptIntegrity(script);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(3);
        expect(res.issue?.reason).toMatch(/unterminated/i);
    });

    it('rejects a dangling assignment (truncated `set x =`)', () => {
        const script = [
            'create class Person',
            'set Person.name =',
        ].join('\n');
        const res = validateScriptIntegrity(script);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(2);
    });

    it('rejects an incomplete create (truncated element name)', () => {
        const res = validateScriptIntegrity('create class');
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(1);
    });

    it('accepts a valid script that ends on a comment or blank line', () => {
        const script = [
            'create class Person',
            'create attribute name in Person',
            '// done',
            '',
        ].join('\n');
        expect(validateScriptIntegrity(script).valid).toBe(true);
    });

    it('accepts a valid regression script (create class/attribute/instance + set)', () => {
        const script = [
            'create class Person',
            'create attribute name in Person',
            'create instance of Person "alice"',
            'set alice.name = "Alice"',
        ].join('\n');
        expect(validateScriptIntegrity(script).valid).toBe(true);
    });

    it('does NOT reject `create instance of X` without a quoted handle (auto-named is valid)', () => {
        // The instance handle is optional (auto-generated). A grammar-based validator must
        // not treat this as truncation — see scriptValidator.ts "Known limitation".
        const script = [
            'create class Conn',
            'create instance of Conn',
        ].join('\n');
        expect(validateScriptIntegrity(script).valid).toBe(true);
    });

    it('ignores target directives and hash/slash comments when validating', () => {
        const script = [
            'target MyMetamodel',
            '# a hash comment',
            '// a slash comment',
            'create class Person',
        ].join('\n');
        expect(validateScriptIntegrity(script).valid).toBe(true);
    });

    it('accepts a string that contains the other quote character', () => {
        // A double-quoted value containing an apostrophe must not read as unterminated.
        const res = validateScriptIntegrity('set Person.note = "it\'s fine"');
        expect(res.valid).toBe(true);
    });
});

// ============================================================================
// FORWARD REFERENCES (second pass)
// ============================================================================

/** Nothing exists yet in the project: every name must come from the script itself. */
const EMPTY = new Set<string>();

/**
 * The script Alfonso ran on `Micro MM v1` on 2026-09-16, with the containment on line 17
 * and the class it needs on line 19. Filler lines keep the two line numbers authentic.
 */
const PIPELINE_SCRIPT = [
    'create class Pipeline',                                          // 1
    'create attribute a2 in Pipeline type String',                    // 2
    'create attribute a3 in Pipeline type String',                    // 3
    'create attribute a4 in Pipeline type String',                    // 4
    'create attribute a5 in Pipeline type String',                    // 5
    'create attribute a6 in Pipeline type String',                    // 6
    'create attribute a7 in Pipeline type String',                    // 7
    'create attribute a8 in Pipeline type String',                    // 8
    'create attribute a9 in Pipeline type String',                    // 9
    'create attribute a10 in Pipeline type String',                   // 10
    'create attribute a11 in Pipeline type String',                   // 11
    'create attribute a12 in Pipeline type String',                   // 12
    'create attribute a13 in Pipeline type String',                   // 13
    'create attribute a14 in Pipeline type String',                   // 14
    'create attribute a15 in Pipeline type String',                   // 15
    'create attribute a16 in Pipeline type String',                   // 16
    'create containment stages in Pipeline type PipelineStage [1..*]', // 17
    'create attribute label in Pipeline type String',                 // 18
    'create class PipelineStage',                                     // 19
].join('\n');

describe('validateScriptIntegrity — forward references', () => {
    it('refuses the Pipeline script, naming the reference line and the creation line', () => {
        const res = validateScriptIntegrity(PIPELINE_SCRIPT, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(17);
        expect(res.issue?.kind).toBe('forward-reference');
        expect(res.issue?.reason).toBe(
            "line 17 references 'PipelineStage', which is created at line 19. Move the reference after it."
        );
    });

    it('accepts the same script once the class is created first', () => {
        const reordered = ['create class PipelineStage', ...PIPELINE_SCRIPT.split('\n')].join('\n');
        expect(validateScriptIntegrity(reordered, EMPTY).valid).toBe(true);
    });

    it('runs no forward-reference pass at all when no name set is supplied', () => {
        // Original behaviour: the truncation checks alone, exactly as before this pass existed.
        expect(validateScriptIntegrity(PIPELINE_SCRIPT).valid).toBe(true);
    });

    it('accepts a reference to a name that already exists elsewhere in the project', () => {
        // The name set spans EVERY metamodel, so a sibling metamodel's class makes the
        // reference resolve and the later duplicate creation is not our business.
        expect(validateScriptIntegrity(PIPELINE_SCRIPT, new Set(['PipelineStage'])).valid).toBe(true);
    });

    it('refuses a standalone `extends` that precedes the parent class', () => {
        const script = [
            'create class ALU',
            'ALU extends FunctionalUnit',
            'create class FunctionalUnit',
        ].join('\n');
        const res = validateScriptIntegrity(script, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(2);
        expect(res.issue?.reason).toContain("'FunctionalUnit'");
    });

    it('refuses a forward superclass in `create class A extends B`', () => {
        // Inverted on 2026-09-17. It used to assert acceptance, because the executor dropped
        // an unresolved superclass in silence and created the class anyway, so the script ran
        // to the end. Lane L2 (`4898aa60f`) made that a hard PARENT_NOT_FOUND, so this script
        // now stops on line 1 with nothing created, which is what the pass exists to prevent.
        const script = [
            'create class ALU extends FunctionalUnit',
            'create class FunctionalUnit',
        ].join('\n');
        const res = validateScriptIntegrity(script, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(1);
        expect(res.issue?.kind).toBe('forward-reference');
        expect(res.issue?.reason).toBe(
            "line 1 references 'FunctionalUnit', which is created at line 2. Move the reference after it."
        );
    });

    it('refuses a forward superclass among several, and an abstract class or interface too', () => {
        // The forward name is deliberately NOT the last one. The parser fills `superClasses`
        // with every name and leaves the LAST in `superClass`, so a check that reads only
        // `superClass` would see `Register`, find it declared on line 1, and pass this script.
        const script = [
            'create class Register',
            'create abstract class ALU extends Cache extends Register',
            'create class Cache',
        ].join('\n');
        const res = validateScriptIntegrity(script, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(2);
        expect(res.issue?.reason).toContain("'Cache'");

        const asInterface = script.replace('abstract class ALU', 'interface ALU');
        expect(validateScriptIntegrity(asInterface, EMPTY).valid).toBe(false);
    });

    it('accepts a superclass that lives in another metamodel of the project', () => {
        // The name set spans every metamodel, so the superclass resolves project-wide and the
        // later creation of a homonym is not this pass's business.
        const script = [
            'create class ALU extends FunctionalUnit',
            'create class FunctionalUnit',
        ].join('\n');
        expect(validateScriptIntegrity(script, new Set(['FunctionalUnit'])).valid).toBe(true);
    });

    it('accepts a superclass created earlier in the same script', () => {
        const script = [
            'create class FunctionalUnit',
            'create class ALU extends FunctionalUnit',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('accepts a name declared both before and after the reference', () => {
        const script = [
            'create class Stage',
            'create containment stages in Pipeline type Stage',
            'create class Stage',
        ].join('\n');
        const withParent = ['create class Pipeline', ...script.split('\n')].join('\n');
        expect(validateScriptIntegrity(withParent, EMPTY).valid).toBe(true);
    });

    it('refuses a forward parent, not only a forward type', () => {
        const script = [
            'create attribute name in Person type String',
            'create class Person',
        ].join('\n');
        const res = validateScriptIntegrity(script, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(1);
        expect(res.issue?.reason).toContain("'Person'");
    });

    // ---- exclusions -------------------------------------------------------

    it('skips a name that a `delete` touches', () => {
        const script = [
            'create class Pipeline',
            'create containment stages in Pipeline type PipelineStage',
            'delete class PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('skips a name that a `rename` touches, on either side', () => {
        const asSource = [
            'create class Pipeline',
            'create containment stages in Pipeline type PipelineStage',
            'rename class PipelineStage to Stage',
            'create class PipelineStage',
        ].join('\n');
        const asNewName = [
            'create class Pipeline',
            'create containment stages in Pipeline type PipelineStage',
            'rename class Step to PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(asSource, EMPTY).valid).toBe(true);
        expect(validateScriptIntegrity(asNewName, EMPTY).valid).toBe(true);
    });

    it('skips a name that a `copy` touches', () => {
        const script = [
            'create class Pipeline',
            'create containment stages in Pipeline type PipelineStage',
            'copy Stage to PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('skips qualified references, which may point at another metamodel', () => {
        const script = [
            'create class Pipeline',
            'create containment stages in Pipeline type Other::PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('does not read M1 commands as classifier references or declarations', () => {
        const script = [
            'create instance of Pipeline "p1"',
            'set p1.name = "first"',
            'create class Pipeline',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('stands down when the script contains an opaque command', () => {
        const withForall = [
            'create class Pipeline',
            'forall c in classes do create attribute id in c',
            'create containment stages in Pipeline type PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        const withEval = [
            'create class Pipeline',
            'this line is not a command and parses as eval',
            'create containment stages in Pipeline type PipelineStage',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(withForall, EMPTY).valid).toBe(true);
        expect(validateScriptIntegrity(withEval, EMPTY).valid).toBe(true);
    });

    it('stands down when the script switches target metamodel', () => {
        const script = [
            'target MM1',
            'create class Pipeline',
            'create containment stages in Pipeline type PipelineStage',
            'target MM2',
            'create class PipelineStage',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('keeps the classifier and feature namespaces apart', () => {
        // `create attribute Person in Order` declares a feature, not the class the first
        // line needs, so it must not be read as the forward declaration of `Person`.
        const script = [
            'create class Order',
            'create reference owner in Order type Person',
            'create attribute Person in Order type String',
        ].join('\n');
        expect(validateScriptIntegrity(script, EMPTY).valid).toBe(true);
    });

    it('still refuses a malformed line before looking at forward references', () => {
        const script = [
            'create containment stages in Pipeline type PipelineStage',
            'set Person.name =',
            'create class PipelineStage',
        ].join('\n');
        const res = validateScriptIntegrity(script, EMPTY);
        expect(res.valid).toBe(false);
        expect(res.issue?.line).toBe(2);
        expect(res.issue?.kind).toBe('malformed');
    });
});

describe('collectClassifierNames', () => {
    it('reads every metamodel of the project, not only the first', () => {
        const names = collectClassifierNames([
            { classes: [{ name: 'Pipeline' }] },
            { classes: [{ name: 'PipelineStage' }] },
        ]);
        expect(names.has('Pipeline')).toBe(true);
        expect(names.has('PipelineStage')).toBe(true);
    });

    it('sweeps enums, packages and the classes inside them', () => {
        const names = collectClassifierNames([
            {
                classes: [{ name: 'Pipeline' }],
                enumerators: [{ name: 'Phase' }],
                packages: [{ name: 'core', classes: [{ name: 'Nested' }] }],
            },
        ]);
        expect([...names].sort()).toEqual(['Nested', 'Phase', 'Pipeline', 'core']);
    });

    it('survives a metamodel whose collections are missing or not arrays', () => {
        expect(collectClassifierNames([null, undefined, {}, { classes: 'nope' }]).size).toBe(0);
        expect(collectClassifierNames([]).size).toBe(0);
    });
});
