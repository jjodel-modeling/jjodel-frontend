import { describe, test, expect } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HOOKS_DIR } from './hookRunner.ts';

// The parts of lib.mjs that the two hooks lean on, called directly. The hooks'
// own behaviour is tested through their child processes (bashGuard.test.ts,
// criticalZone.test.ts); these pin the reader on shapes that a commit or a probe
// can produce.

const load = () => import(pathToFileURL(resolve(HOOKS_DIR, 'lib.mjs')).href);
const words = (cmd: { words: { text: string }[] }) => cmd.words.map((w) => w.text);

describe('lib: stripPromptIdSuffix', () => {
    test('drops one trailing " (P-YYYY-MM-DD-HHmm)" and nothing else', async () => {
        const { stripPromptIdSuffix } = await load();
        expect(stripPromptIdSuffix('docs: x (P-2026-09-21-1620)')).toBe('docs: x');
        expect(stripPromptIdSuffix('docs: x (P-2026-09-21-1620) tail')).toBe('docs: x (P-2026-09-21-1620) tail');
        expect(stripPromptIdSuffix('docs: x(P-2026-09-21-1620)')).toBe('docs: x(P-2026-09-21-1620)');
        expect(stripPromptIdSuffix('docs: x (P-2026-09-21-162)')).toBe('docs: x (P-2026-09-21-162)');
        expect(stripPromptIdSuffix('docs: x (T-2026-09-21-1620)')).toBe('docs: x (T-2026-09-21-1620)');
    });
});

describe('lib: parseShell', () => {
    test('separators split commands, quotes keep words whole, redirections leave no word behind', async () => {
        const { parseShell } = await load();
        const cmds = parseShell('echo "a b" && ls -la 2>&1 | tail -n 2; git status > out.txt');
        expect(cmds.map(words)).toEqual([['echo', 'a b'], ['ls', '-la'], ['tail', '-n', '2'], ['git', 'status']]);
    });

    test('a heredoc body with parentheses, quotes and its own terminator lookalikes stays data', async () => {
        const { parseShell } = await load();
        const src = "git commit -m \"$(cat <<'XEOF'\ns (a) 'b' \"c\"\nXEOFX\nXEOF\n)\" -- p";
        const cmds = parseShell(src);
        const commit = cmds.find((c: { words: { text: string }[] }) => c.words[0].text === 'git');
        expect(words(commit)).toEqual(['git', 'commit', '-m', "s (a) 'b' \"c\"\nXEOFX", '--', 'p']);
    });

    test('a substitution other than cat with a heredoc is opaque, and its commands are still returned', async () => {
        const { parseShell } = await load();
        const cmds = parseShell('echo "$(git stash list)"');
        expect(cmds.map(words)).toContainEqual(['git', 'stash', 'list']);
        const echo = cmds.find((c: { words: { text: string }[] }) => c.words[0].text === 'echo');
        expect(echo.words[1].opaque).toBe(true);
    });

    test('an unterminated quote or heredoc does not throw', async () => {
        const { parseShell } = await load();
        expect(() => parseShell('echo "unterminated')).not.toThrow();
        expect(() => parseShell("cat <<'EOF'\nno end")).not.toThrow();
    });

    test('a comment is not a command', async () => {
        const { parseShell } = await load();
        expect(parseShell('# git stash\necho ok').map(words)).toEqual([['echo', 'ok']]);
    });
});
