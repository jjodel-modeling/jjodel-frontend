import { describe, it, expect } from 'vitest';
import { validateScriptIntegrity } from '../executor/scriptValidator';

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
