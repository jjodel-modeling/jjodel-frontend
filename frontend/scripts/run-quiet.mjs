#!/usr/bin/env node
/**
 * run-quiet.mjs: runs a build, a test or a type-check and keeps its output out
 * of the context (P-2026-10-13-1930). The output budget hook
 * (hooks/output-budget.mjs) sends those commands here.
 *
 *   node frontend/scripts/run-quiet.mjs LABEL -- CMD [ARGS...]
 *
 * CMD runs in the current directory, with ARGS as given (no shell). The whole
 * stdout and stderr go to .agent-logs/LABEL-YYYYMMDD-HHMMSS.log at the
 * repository root; the terminal gets only the exit code, the log path, the
 * line count, up to 40 lines matching error|Error|FAIL|failed, and the last 25
 * lines. The runner exits with the command's exit code.
 *
 * Plain ES module, nothing outside node:*, nothing past node 16.
 */

import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { constants } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MATCH_MAX = 40;
const TAIL_LINES = 25;
const LINE_MAX_CHARS = 400;
const MATCH = /error|Error|FAIL|failed/;
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;

/** frontend/scripts -> the repository root */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function usage(message) {
    process.stderr.write('[run-quiet] ' + message + '\nusage: node frontend/scripts/run-quiet.mjs LABEL -- CMD [ARGS...]\n');
    process.exitCode = 2;
}

const pad = (n) => String(n).padStart(2, '0');

function stamp(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

/** A log path that does not exist yet: a second run in the same second gets a suffix. */
function logPath(label) {
    const dir = resolve(REPO_ROOT, '.agent-logs');
    mkdirSync(dir, { recursive: true });
    const base = resolve(dir, label + '-' + stamp(new Date()));
    let path = base + '.log';
    for (let k = 2; existsSync(path); k++) path = base + '-' + k + '.log';
    return path;
}

const clip = (line) => (line.length > LINE_MAX_CHARS ? line.slice(0, LINE_MAX_CHARS) + ' [...]' : line);

function report(path, code, signal) {
    let text = '';
    try {
        text = readFileSync(path, 'utf8');
    } catch {
        /* nothing was written */
    }
    const lines = text.replace(ANSI, '').split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    const matches = lines.filter((l) => MATCH.test(l));
    const out = [];
    out.push('[run-quiet] exit ' + code + (signal ? ' (signal ' + signal + ')' : ''));
    out.push('[run-quiet] log ' + path + ' (' + lines.length + ' lines)');
    if (matches.length > 0) {
        const shown = matches.slice(0, MATCH_MAX);
        out.push('[run-quiet] ' + matches.length + ' lines match /' + MATCH.source + '/, first ' + shown.length + ':');
        for (const l of shown) out.push(clip(l));
    } else out.push('[run-quiet] no line matches /' + MATCH.source + '/');
    out.push('[run-quiet] last ' + Math.min(TAIL_LINES, lines.length) + ' lines:');
    for (const l of lines.slice(-TAIL_LINES)) out.push(clip(l));
    process.stdout.write(out.join('\n') + '\n');
}

function main(argv) {
    const dd = argv.indexOf('--');
    if (dd !== 1) return usage('expected exactly one LABEL before --');
    const label = argv[0].replace(/[^A-Za-z0-9._-]/g, '-');
    const cmd = argv[dd + 1];
    if (!label || !cmd) return usage('missing LABEL or CMD');

    const path = logPath(label);
    const log = createWriteStream(path);
    log.write('$ ' + argv.slice(dd + 1).join(' ') + '\n# cwd ' + process.cwd() + '\n');

    const child = spawn(cmd, argv.slice(dd + 2), { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });

    let finished = false;
    const finish = (exit, signal, note) => {
        if (finished) return;
        finished = true;
        if (note) log.write(note);
        log.end(() => {
            report(path, exit, signal);
            process.exitCode = exit;
        });
    };
    child.on('error', (err) => {
        if (child.pid === undefined) finish(127, null, '[run-quiet] could not run ' + cmd + ': ' + err.message + '\n');
    });
    child.on('close', (code, signal) => {
        finish(code !== null ? code : 128 + (constants.signals[signal] || 0), signal);
    });
}

main(process.argv.slice(2));
