import { describe, it, expect } from 'vitest';
import { formatForDisplay, DEFAULT_FORMAT_WIDTH } from '../formatter';
import { parse } from '../parser/parser';

/**
 * P-2026-10-24-0405: the formatter breaks a long `create instance of X "n" in a.b` before `in`.
 * The script path parses one line per command (executeScript splits on '\n'), so the continuation
 * line is not accepted by the parser: the formatter is display only. The AST check therefore folds
 * every continuation back onto its command and compares the result with the input.
 */

// Folds a continuation line (newline, indentation, `in`) back onto the line above it.
const fold = (text: string): string => text.replace(/\r?\n[ \t]+(?=in )/g, ' ');

// Every non-blank line that is not a comment, parsed on its own as executeScript does.
const astsOf = (text: string) =>
    text.split('\n')
        .map(l => l.replace(/\r$/, ''))
        .filter(l => l.trim() !== '' && !/^\s*(\/\/|\/\*|\*)/.test(l))
        .map(l => {
            const r = parse(l);
            return r.success ? r.ast : { error: r.errors?.[0]?.message };
        });

const LONG = 'create instance of Person "Mario Rossi Bianchi Verdi" in familyRegistry.registeredMembers';
const LONG_HEAD = 'create instance of Person "Mario Rossi Bianchi Verdi"';
const LONG_TAIL = 'in familyRegistry.registeredMembers';
const SHORT = 'create instance of Person "alice" in root.people';

const FIXTURES: Record<string, string> = {
    short: SHORT,
    long: LONG,
    nameWithIn: 'create instance of Book "Alice in Wonderland, the annotated edition" in library.shelvedBooks',
    bareName: 'create instance of Customer customerWithAVeryLongBareIdentifierName in shopRoot.customers',
    qualifiedClass: 'create instance of Shop::Customer "a customer with a long name" in shopRoot.allCustomers',
    mixed: [
        '// a model of a family',
        '',
        'create instance of Family "Rossi" in root.families',
        LONG,
        '/* create instance of Person "inside a block comment that runs very long" in r.members',
        '   still a comment */',
        `${LONG} // trailing note`,
        '',
        'set Rossi.name = "Rossi"',
    ].join('\n'),
    insideBlockComment: `/*\n${LONG}\n*/\n${SHORT}`,
    slashStarInString: `set Rossi.name = "/* not a comment"\n${LONG}`,
    indented: `do\n    ${LONG}\nend`,
    crlf: `${SHORT}\r\n${LONG}\r\n`,
};

describe('formatForDisplay (P-2026-10-24-0405)', () => {
    it('defaults the width to 80', () => {
        expect(DEFAULT_FORMAT_WIDTH).toBe(80);
        expect(LONG.length).toBeGreaterThan(80);
        expect(SHORT.length).toBeLessThanOrEqual(80);
    });

    it('leaves a line that fits byte for byte', () => {
        expect(formatForDisplay(SHORT)).toBe(SHORT);
    });

    it('breaks a long create instance line before in, four spaces on the continuation', () => {
        expect(formatForDisplay(LONG)).toBe(`${LONG_HEAD}\n    ${LONG_TAIL}`);
    });

    it('breaks only above the width: a line of exactly width characters stays', () => {
        expect(formatForDisplay(LONG, LONG.length)).toBe(LONG);
        expect(formatForDisplay(LONG, LONG.length - 1)).toBe(`${LONG_HEAD}\n    ${LONG_TAIL}`);
    });

    it('breaks before the keyword, never at an in inside a quoted name', () => {
        expect(formatForDisplay(FIXTURES.nameWithIn)).toBe(
            'create instance of Book "Alice in Wonderland, the annotated edition"\n    in library.shelvedBooks'
        );
    });

    it('breaks a bare instance name and a qualified class name the same way', () => {
        expect(formatForDisplay(FIXTURES.bareName)).toBe(
            'create instance of Customer customerWithAVeryLongBareIdentifierName\n    in shopRoot.customers'
        );
        expect(formatForDisplay(FIXTURES.qualifiedClass)).toBe(
            'create instance of Shop::Customer "a customer with a long name"\n    in shopRoot.allCustomers'
        );
    });

    it('keeps comments, blank lines and a trailing comment byte for byte', () => {
        const out = formatForDisplay(FIXTURES.mixed);
        const lines = out.split('\n');
        expect(lines[0]).toBe('// a model of a family');
        expect(lines[1]).toBe('');
        expect(lines[2]).toBe('create instance of Family "Rossi" in root.families');
        expect(lines[3]).toBe(LONG_HEAD);
        expect(lines[4]).toBe(`    ${LONG_TAIL}`);
        // A line inside a block comment is never broken, however it reads.
        expect(lines[5]).toBe('/* create instance of Person "inside a block comment that runs very long" in r.members');
        expect(lines[6]).toBe('   still a comment */');
        expect(lines[7]).toBe(LONG_HEAD);
        expect(lines[8]).toBe(`    ${LONG_TAIL} // trailing note`);
        expect(lines[9]).toBe('');
        expect(lines[10]).toBe('set Rossi.name = "Rossi"');
        expect(lines).toHaveLength(11);
    });

    it('never breaks a line comment that reads like a long create', () => {
        const c = `// ${LONG}`;
        expect(formatForDisplay(c)).toBe(c);
    });

    it('never breaks a create line that sits inside a block comment', () => {
        expect(formatForDisplay(FIXTURES.insideBlockComment)).toBe(FIXTURES.insideBlockComment);
    });

    it('does not open a block comment at a slash-star inside a string', () => {
        expect(formatForDisplay(FIXTURES.slashStarInString)).toBe(
            `set Rossi.name = "/* not a comment"\n${LONG_HEAD}\n    ${LONG_TAIL}`
        );
    });

    it('indents the continuation four spaces past the command', () => {
        expect(formatForDisplay(FIXTURES.indented)).toBe(`do\n    ${LONG_HEAD}\n        ${LONG_TAIL}\nend`);
    });

    it('keeps CRLF line endings, on the inserted break too', () => {
        expect(formatForDisplay(FIXTURES.crlf)).toBe(`${SHORT}\r\n${LONG_HEAD}\r\n    ${LONG_TAIL}\r\n`);
    });

    it('leaves other long commands alone', () => {
        const attr = 'create attribute aVeryLongAttributeNameForTesting in SomePackage::SomeVeryLongClassName type EString';
        const twoCommands = `${LONG}; create instance of Person "b" in root.people`;
        const containerFirst = 'create instance of Person in familyRegistry.registeredMembers "Mario Rossi Bianchi Verdi"';
        // Same shape as an instance line, another element type: not ours to break.
        const notInstance = LONG.replace('create instance', 'create package');
        expect(formatForDisplay(attr)).toBe(attr);
        expect(formatForDisplay(notInstance)).toBe(notInstance);
        expect(formatForDisplay(twoCommands)).toBe(twoCommands);
        expect(formatForDisplay(containerFirst)).toBe(containerFirst);
    });

    it('is idempotent on every fixture', () => {
        for (const [name, input] of Object.entries(FIXTURES)) {
            const once = formatForDisplay(input);
            expect(formatForDisplay(once), name).toBe(once);
        }
    });

    it('changes only the whitespace before in: folded back, every fixture is its input and parses the same', () => {
        for (const [name, input] of Object.entries(FIXTURES)) {
            const out = formatForDisplay(input);
            expect(fold(out), name).toBe(input);
            expect(astsOf(fold(out)), name).toEqual(astsOf(input));
        }
    });

    it('is display only: the parser does not take the continuation line as part of the create', () => {
        const oneLine = parse(LONG);
        expect(oneLine.success).toBe(true);
        expect((oneLine.ast as any).args.parent).toBeDefined();
        // executeScript parses the head and the continuation as two commands.
        const head = parse(LONG_HEAD);
        expect(head.success).toBe(true);
        expect((head.ast as any).args.parent).toBeUndefined();
        // The continuation falls through to a JjEL eval of its own text.
        expect((parse(`    ${LONG_TAIL}`).ast as any)?.command).toBe('eval');
    });
});
