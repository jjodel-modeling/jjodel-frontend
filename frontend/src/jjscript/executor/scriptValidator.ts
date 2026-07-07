/**
 * JjScript integrity validator — defense-in-depth against truncated AI-generated scripts.
 *
 * Jjodie generates JjScript with an LLM. When the model's output-token limit is reached
 * mid-generation the script is cut off, sometimes leaving a dangling command
 * (`set x.name =`) and sometimes an unterminated string (`... = "Foo`). Executing such a
 * script command-by-command leaves the model in a half-built state (the incident that
 * motivated this module: 218 of ~230 commands applied, a partial UART model left behind).
 *
 * This module validates the WHOLE script BEFORE the first command runs, so a truncated
 * script is refused with zero commands executed.
 *
 * Safety guarantee — no false positives: the parse check below uses the SAME `parse()`
 * the executor calls per command (`executor.ts` → `execute()` → `parse()`). Any line this
 * validator rejects is a line the executor would itself have failed on; the validator only
 * moves that failure earlier (before command 1) instead of mid-run. It never rejects a
 * script that would have executed cleanly.
 *
 * It additionally detects unterminated string literals, which the lexer silently tolerates
 * (`lexer.ts` `readString` stops at end-of-input without raising), so `parse()` alone would
 * not catch them.
 *
 * Known limitation: a truncation that happens to land on a syntactically- and
 * semantically-complete command is indistinguishable from an intentional command and is
 * NOT flagged. The canonical example is `create instance of Conn` — the instance handle is
 * optional and auto-generated, so this parses and executes as a valid command. Detecting it
 * would require a heuristic that also rejects legitimate auto-named-instance scripts, which
 * is why it is intentionally left uncaught.
 */

import { parse } from '../parser/parser';

export interface ScriptValidationIssue {
    /** 1-based line number in the original script. */
    line: number;
    /** The offending (trimmed) command text. */
    command: string;
    /** Human-readable cause. */
    reason: string;
}

export interface ScriptValidationResult {
    valid: boolean;
    /** Present only when `valid === false` — the first issue found (execution is refused). */
    issue?: ScriptValidationIssue;
}

/**
 * Detect a string literal that opens but never closes on the same line. Mirrors the lexer's
 * escaping rule (a backslash escapes the next character) but, unlike the lexer, reports the
 * unterminated case instead of silently closing it at end-of-input.
 */
function hasUnterminatedString(line: string): boolean {
    let i = 0;
    const n = line.length;
    while (i < n) {
        const ch = line[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let closed = false;
            while (i < n) {
                if (line[i] === '\\') { i += 2; continue; } // escape: skip escaped char
                if (line[i] === quote) { closed = true; i++; break; }
                i++;
            }
            if (!closed) return true; // reached end-of-line still inside the string
        } else {
            i++;
        }
    }
    return false;
}

/**
 * Validate an entire JjScript script for integrity before execution. Returns the first
 * problem found (execution should be refused entirely) or `{ valid: true }`.
 *
 * The executable-line filter mirrors `ScriptBlock`'s exactly (skip blank lines, `//` and `#`
 * comments, and `target ...` directives) so validation covers precisely the lines that would
 * be executed.
 */
export function validateScriptIntegrity(script: string): ScriptValidationResult {
    const lines = script.split('\n');

    for (let idx = 0; idx < lines.length; idx++) {
        const trimmed = lines[idx].trim();

        // Skip non-executable lines — must match ScriptBlock's command filter.
        if (!trimmed) continue;
        if (trimmed.startsWith('//')) continue;
        if (trimmed.startsWith('#')) continue;
        if (trimmed.toLowerCase().startsWith('target ')) continue;

        const line = idx + 1; // 1-based, original line number

        // 1) Unterminated string — the lexer swallows this, so parse() would not flag it.
        if (hasUnterminatedString(trimmed)) {
            return {
                valid: false,
                issue: {
                    line,
                    command: trimmed,
                    reason: 'unterminated string literal (a quote is opened but never closed)',
                },
            };
        }

        // 2) Incomplete / malformed command — same parser the executor uses, so any failure
        //    here is a line the executor would also have rejected.
        const result = parse(trimmed);
        if (!result.success) {
            const parserMsg = result.errors?.[0]?.message || 'could not be parsed as a complete command';
            return {
                valid: false,
                issue: { line, command: trimmed, reason: parserMsg },
            };
        }
    }

    return { valid: true };
}
