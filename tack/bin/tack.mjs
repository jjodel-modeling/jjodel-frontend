#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateText } from '../src/contract/validate.mjs';

const USAGE = `usage: tack <command>

commands:
  check [file]   validate a JSON Lines log against contract v1 (default: .tack/log.jsonl)
`;

function check(args) {
  if (args.length > 1) {
    process.stderr.write(USAGE);
    return 2;
  }
  const file = args[0] ?? '.tack/log.jsonl';
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`tack check: cannot read ${file}: ${err.code ?? err.message}\n`);
    return 2;
  }
  const { entries, violations } = validateText(text);
  for (const v of violations) process.stdout.write(`${file}:${v.line} ${v.field} ${v.rule}: ${v.message}\n`);
  if (violations.length === 0) {
    process.stdout.write(`${file}: ${entries} entries, no violations\n`);
    return 0;
  }
  return 1;
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'check') {
  process.exitCode = check(rest);
} else {
  process.stderr.write(USAGE);
  process.exitCode = 2;
}
