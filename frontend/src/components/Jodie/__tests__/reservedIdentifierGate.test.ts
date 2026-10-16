/**
 * The gate on Jjodie's replies (P-2026-10-10-0045): a reply whose JjScript declares a reserved
 * identifier gets one repair turn through the model, and a script that still declares one is
 * refused before command 1. The rendered system prompt lists every reserved word.
 *
 * Decisions of the GO: exact lowercase match (`copy` reserved, `Copy` not); primitive type names
 * checked, in any case, on class and enum declarations only; one repair round at most.
 */
import { describe, it, expect, vi } from 'vitest';
import {
    findReservedDeclarations,
    findReservedInReply,
    gateReply,
} from '../reservedIdentifierGate';
import { RESERVED_IDENTIFIERS } from '../../../jjscript/reservedIdentifiers';
import { TYPE_ALIASES } from '../../../jjscript/types';
import { DEFAULT_PROMPTS, DEFAULT_PROMPT_VERSIONS } from '../../../constants/defaultPrompts';

const script = (refName: string): string => [
    'create class Library',
    'create class Book',
    'create attribute title in Book type String',
    'create containment books in Library type Book [*]',
    'create class Loan',
    `create reference ${refName} in Loan type Book`,
    'create attribute dueDate in Loan type Date',
].join('\n');

const reply = (refName: string): string =>
    'Here is the metamodel.\n\n```jjscript\n' + script(refName) + '\n```\n';

const names = (script: string): string[] => findReservedDeclarations(script).map(d => d.name);

describe('findReservedDeclarations', () => {
    it('finds the reference named copy, on its editor line', () => {
        const found = findReservedDeclarations(script('copy'));
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({ name: 'copy', line: 6, reason: 'reserved-word' });
        expect(found[0].command).toBe('create reference copy in Loan type Book');
    });

    it('accepts the renamed script', () => {
        expect(findReservedDeclarations(script('bookCopy'))).toEqual([]);
    });

    it('matches the exact lowercase word only', () => {
        expect(names('create reference Copy in Loan type Book')).toEqual([]);
        expect(names('create class Class')).toEqual([]);
        expect(names('create attribute type in Field type String')).toEqual(['type']);
    });

    it('reads every declaring kind and the abstract class form', () => {
        expect(names('create class copy')).toEqual(['copy']);
        expect(names('create abstract class list')).toEqual(['list']);
        expect(names('create attribute show in Book type String')).toEqual(['show']);
        expect(names('create containment set in Library type Book [*]')).toEqual(['set']);
        expect(names('create enum default')).toEqual(['default']);
        expect(names('create literal true in Genre')).toEqual(['true']);
    });

    it('reads the new name of a rename, after to or as', () => {
        expect(names('rename class Book to copy')).toEqual(['copy']);
        expect(names('rename attribute title in Book as move')).toEqual(['move']);
        expect(names('rename attribute title in Book to heading')).toEqual([]);
    });

    it('checks class and enum names against the primitive type names, in any case', () => {
        const found = findReservedDeclarations('create class Date\ncreate enum string\ncreate abstract class OBJECT');
        expect(found.map(d => [d.name, d.reason])).toEqual([
            ['Date', 'primitive-type-name'],
            ['string', 'primitive-type-name'],
            ['OBJECT', 'primitive-type-name'],
        ]);
    });

    it('does not check feature names against the primitive type names', () => {
        expect(names('create attribute date in Loan type Date')).toEqual([]);
        expect(names('create reference Object in Loan type Book')).toEqual([]);
    });

    it('skips the lines the run skips', () => {
        expect(names('// create class copy\n# create class copy\n\ntarget MM\ncreate class Book')).toEqual([]);
    });

    it('does not read references, only declarations', () => {
        expect(names('create class Loan extends copy')).toEqual([]);
        expect(names('delete class copy')).toEqual([]);
    });
});

describe('findReservedInReply', () => {
    it('reads the jjscript blocks of a reply', () => {
        expect(findReservedInReply(reply('copy')).map(d => d.name)).toEqual(['copy']);
        expect(findReservedInReply(reply('bookCopy'))).toEqual([]);
    });

    it('ignores prose and single-line code', () => {
        expect(findReservedInReply('Do not name it `create reference copy in Loan type Book`.')).toEqual([]);
        expect(findReservedInReply('```jjscript\ncreate class copy\n```')).toEqual([]);
    });

    it('reads an untagged block the chat would offer to run', () => {
        const untagged = '```\ncreate class Loan\ncreate reference copy in Loan type Book\n```';
        expect(findReservedInReply(untagged).map(d => d.name)).toEqual(['copy']);
    });
});

describe('gateReply', () => {
    it('lets a clean reply through without calling the model', async () => {
        const ask = vi.fn(async () => reply('other'));
        const result = await gateReply(reply('bookCopy'), ask);
        expect(ask).not.toHaveBeenCalled();
        expect(result.content).toBe(reply('bookCopy'));
        expect(result.repairCalls).toBe(0);
        expect(result.remaining).toEqual([]);
    });

    it('asks once for a renamed script and shows only the repaired reply, naming the replaced identifiers', async () => {
        const ask = vi.fn(async (_request: string) => reply('bookCopy'));
        const result = await gateReply(reply('copy'), ask);
        expect(ask).toHaveBeenCalledTimes(1);
        const request = ask.mock.calls[0][0];
        expect(request).toContain('`copy`');
        expect(request).toContain('line 6');
        expect(result.repairCalls).toBe(1);
        expect(result.replaced).toEqual(['copy']);
        expect(result.remaining).toEqual([]);
        expect(result.content).toContain(script('bookCopy'));
        expect(result.content).not.toContain('create reference copy');
        const notice = result.content.split('\n')[0];
        expect(notice).toContain('`copy`');
        expect(findReservedInReply(result.content)).toEqual([]);
    });

    it('with a model that keeps answering copy, makes exactly one repair call and leaves the script refused', async () => {
        const ask = vi.fn(async () => reply('copy'));
        const result = await gateReply(reply('copy'), ask);
        expect(ask).toHaveBeenCalledTimes(1);
        expect(result.repairCalls).toBe(1);
        expect(result.replaced).toEqual([]);
        expect(result.remaining.map(d => d.name)).toEqual(['copy']);
        expect(result.content.split('\n')[0]).toContain('`copy`');
        // ScriptBlock refuses Run and Step on exactly this predicate, before command 1.
        expect(findReservedInReply(result.content).map(d => d.name)).toEqual(['copy']);
    });

    it('shows the first reply refused when the repair call fails', async () => {
        const ask = vi.fn(async () => { throw new Error('network'); });
        const result = await gateReply(reply('copy'), ask);
        expect(ask).toHaveBeenCalledTimes(1);
        expect(result.remaining.map(d => d.name)).toEqual(['copy']);
        expect(result.content).toContain(script('copy'));
        expect(result.content.split('\n')[0]).toContain('`copy`');
    });
});

describe('Jjodie system prompt, rule 8', () => {
    const chat = DEFAULT_PROMPTS.chat;

    it('lists every reserved word', () => {
        const missing = [...RESERVED_IDENTIFIERS].filter(word => !chat.includes('`' + word + '`'));
        expect(missing).toEqual([]);
    });

    it('lists every primitive type name of TYPE_ALIASES', () => {
        const missing = [...new Set(Object.keys(TYPE_ALIASES).map(k => k.toLowerCase()))]
            .filter(name => !chat.includes('`' + name + '`'));
        expect(missing).toEqual([]);
    });

    it('says lowercase, not case-insensitive', () => {
        const rule8 = chat.slice(chat.indexOf('8. **NEVER use JjScript reserved'), chat.indexOf('9. **Respect the editing context'));
        expect(rule8.length).toBeGreaterThan(0);
        expect(rule8).toContain('lowercase');
        expect(rule8).not.toContain('case-insensitive');
    });

    // Two lines each wrote a v6 (the #178 join on staging, rule 8 here): the merge of 2026-10-12 joins them as v7.
    it('bumps the chat prompt to version 7 with a changelog line', () => {
        const chatVersion = DEFAULT_PROMPT_VERSIONS.chat;
        expect(chatVersion.version).toBe(7);
        expect(chatVersion.changelog[chatVersion.changelog.length - 1].version).toBe(7);
    });
});
