import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Parser, parse } from '../parser/parser';
import type { ParseResult } from '../types';

/**
 * A block whose body is not a command must terminate (P-2026-10-10-0810).
 *
 * `parseCommand` hands a non-command word to JjEL through `remainingInput()` without
 * consuming a token, and `parseBlockBody` used to push that eval node again and again
 * until the heap ran out: a Jjodie message such as `do not use copy` froze the tab.
 *
 * A vitest timeout cannot interrupt a synchronous loop, so the guard is a bound on the
 * `parseCommand` calls one parse may make. Past the bound the wrapper throws, `parse()`
 * returns through its catch, and the test fails on the count instead of hanging.
 */

const CALL_BOUND = 1000;
const CASE_TIMEOUT_MS = 1000;

type ParseCommand = (...a: unknown[]) => unknown;
const proto = Parser.prototype as unknown as { parseCommand: ParseCommand };
const originalParseCommand = proto.parseCommand;
let calls = 0;

beforeAll(() => {
    expect(typeof originalParseCommand).toBe('function');
    proto.parseCommand = function (this: unknown, ...a: unknown[]) {
        calls++;
        if (calls > CALL_BOUND) throw new Error('parserTermination guard: parseCommand call bound exceeded');
        return originalParseCommand.apply(this, a);
    };
});

afterAll(() => {
    proto.parseCommand = originalParseCommand;
});

function boundedParse(input: string, strict: boolean): ParseResult {
    calls = 0;
    const result = parse(input, strict ? { strict: true } : undefined);
    expect(calls, `parseCommand calls for ${JSON.stringify(input)}`).toBeLessThanOrEqual(CALL_BOUND);
    return result;
}

const MODES: Array<[string, boolean]> = [['strict', true], ['default', false]];

describe.each(MODES)('Parser termination (%s)', (_mode, strict) => {
    // Positive control: the guard sees the calls, so a zero count below is not a silence.
    it('the guard counts parseCommand calls', () => {
        boundedParse('do create class A end', strict);
        expect(calls).toBeGreaterThan(0);
    }, CASE_TIMEOUT_MS);

    it.each([
        ['do not use copy', 'not', { line: 1, column: 4 }],
        ['Do not use copy', 'not', { line: 1, column: 4 }],
        ['do it again', 'it', { line: 1, column: 4 }],
        ['Do the same without copy end', 'the', { line: 1, column: 4 }],
        // No in-repo grammar documents an eval statement inside a block: a parse error like the rest.
        ['do x.name end', 'x.name', { line: 1, column: 4 }],
    ])('%j stops with a parse error naming the offending token', (input, token, position) => {
        const r = boundedParse(input, strict);
        expect(r.success).toBe(false);
        expect(r.ast).toBeUndefined();
        expect(r.errors).toEqual([{ message: `Unexpected '${token}' in do block`, position }]);
    }, CASE_TIMEOUT_MS);

    it.each([
        ['forall c in classes do c.name end', "'c.name'"],
        ['let $x = 1 in $x end', "'$'"],
    ])('%j (same block body, other opener) stops with a parse error', (input, token) => {
        const r = boundedParse(input, strict);
        expect(r.success).toBe(false);
        expect(r.errors?.[0]?.message).toContain(token);
    }, CASE_TIMEOUT_MS);

    // A bare `do` parsed clean as an empty block, so Jjodie's detect, a strict parse, took the
    // one-word message `do` as a script (P-2026-10-11-1145). Under strict the missing `end` is an
    // error. The default mode keeps the empty block of the base commit 3099fb53c:
    // validateScriptIntegrity parses a multi-line `do ... end` script one line at a time, and its
    // first line is a bare `do`.
    it.each([
        ['do', { line: 1, column: 3 }],
        ['do ', { line: 1, column: 4 }],
        ['Do', { line: 1, column: 3 }],
    ])('%j alone: an error naming the missing end under strict, an empty block otherwise', (input, position) => {
        const r = boundedParse(input, strict);
        if (strict) {
            expect(r.success).toBe(false);
            expect(r.ast).toBeUndefined();
            expect(r.errors).toEqual([{ message: "Expected 'end' to close do block", position }]);
        } else {
            expect(r.success).toBe(true);
            expect(r.ast).toEqual({
                type: 'Command', command: 'block',
                args: { command: 'block', commands: [] },
                position: { line: 1, column: 1 },
            });
        }
    }, CASE_TIMEOUT_MS);

    // The same rule reaches a block with a body and no `end`: under strict it is no longer a script.
    it('"do create class A" without end: an error under strict, a block otherwise', () => {
        const r = boundedParse('do create class A', strict);
        if (strict) {
            expect(r.success).toBe(false);
            expect(r.errors).toEqual([{ message: "Expected 'end' to close do block", position: { line: 1, column: 18 } }]);
        } else {
            expect(r.success).toBe(true);
            expect(r.ast).toEqual({
                type: 'Command', command: 'block',
                args: {
                    command: 'block',
                    commands: [{
                        type: 'Command', command: 'create',
                        args: { command: 'create', elementType: 'class', name: 'A' },
                        position: { line: 1, column: 4 },
                    }],
                },
                position: { line: 1, column: 1 },
            });
        }
    }, CASE_TIMEOUT_MS);

    // Pinned as measured on the base commit e47e456b1: an explicitly empty block is an empty block.
    it('"do end" returns an empty block, unchanged', () => {
        const r = boundedParse('do end', strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'block',
            args: { command: 'block', commands: [] },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);

    // Inside a block the eval body stops before the bare `end` that closes it: on the base
    // `parseEvalCommand` read to the end of the line and swallowed the block's `end`.
    it.each([
        ['do eval x.name end', 'x.name'],
        // A string literal is one token: its `end` stays inside it. The quotes are not kept,
        // as for a top-level `eval "a end b"`.
        ['do eval "a end b" end', 'a end b'],
        // An identifier that starts with `end` is not the terminator.
        ['do eval endDate end', 'endDate'],
    ])('%j parses to a block of one eval that stops before end', (input, expression) => {
        const r = boundedParse(input, strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'block',
            args: {
                command: 'block',
                commands: [{
                    type: 'Command', command: 'eval',
                    args: { command: 'eval', expression },
                    position: { line: 1, column: 4 },
                }],
            },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);

    it('an eval in a forall...do...end body stops before end', () => {
        const r = boundedParse('forall c in classes do eval c.name end', strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'forall',
            args: {
                command: 'forall', variable: 'c', collectionExpr: 'classes',
                body: {
                    type: 'Command', command: 'eval',
                    args: { command: 'eval', expression: 'c.name' },
                    position: { line: 1, column: 24 },
                },
            },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);

    // Outside a block `end` is not a terminator: the top-level eval keeps reading, as on the base.
    it('a top-level eval still reads to the end of the line', () => {
        const r = boundedParse('eval x.name end', strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'eval',
            args: { command: 'eval', expression: 'x.name end' },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);

    // The no-progress error names the block kind that is open, not always `do`.
    it.each([
        ['let $x = 1 in x.name end', "Unexpected 'x.name' in let block", { line: 1, column: 15 }],
        ['forall c in classes do c.name end', "Unexpected 'c.name' in forall block", { line: 1, column: 24 }],
    ])('%j names its own opener in the no-progress error', (input, message, position) => {
        const r = boundedParse(input, strict);
        expect(r.success).toBe(false);
        expect(r.errors).toEqual([{ message, position }]);
    }, CASE_TIMEOUT_MS);

    it('"do create class A end" parses to the AST of the base commit', () => {
        const r = boundedParse('do create class A end', strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'block',
            args: {
                command: 'block',
                commands: [{
                    type: 'Command', command: 'create',
                    args: { command: 'create', elementType: 'class', name: 'A' },
                    position: { line: 1, column: 4 },
                }],
            },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);

    it('a forall...do...end block parses to the AST of the base commit', () => {
        const r = boundedParse('forall c in classes do\n  create attribute id in c\n  rename c to D\nend', strict);
        expect(r.success).toBe(true);
        expect(r.ast).toEqual({
            type: 'Command', command: 'forall',
            args: {
                command: 'forall', variable: 'c', collectionExpr: 'classes',
                body: {
                    type: 'Command', command: 'block',
                    args: {
                        command: 'block',
                        commands: [
                            {
                                type: 'Command', command: 'create',
                                args: {
                                    command: 'create', elementType: 'attribute', name: 'id',
                                    parent: { segments: ['c'], raw: 'c' },
                                },
                                position: { line: 2, column: 3 },
                            },
                            {
                                type: 'Command', command: 'rename',
                                args: { command: 'rename', target: { segments: ['c'], raw: 'c' }, newName: 'D' },
                                position: { line: 3, column: 3 },
                            },
                        ],
                    },
                    position: { line: 2, column: 3 },
                },
            },
            position: { line: 1, column: 1 },
        });
    }, CASE_TIMEOUT_MS);
});
