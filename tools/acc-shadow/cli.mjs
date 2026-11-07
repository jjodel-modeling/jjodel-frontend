import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readAuthorized, MAX_BYTES } from './sources.mjs';
import { evaluate } from './rules.mjs';
import { serialize } from './contract.mjs';

export function runCli(args, write = text => process.stdout.write(text)) {
  try {
    const allowedFiles = [];
    let input;
    let caseName;
    let semanticOnly = false;
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (arg === '--semantic-only') semanticOnly = true;
      else if (['--input', '--allow-file', '--case'].includes(arg) && args[index + 1] && !args[index + 1].startsWith('--')) {
        const value = args[++index];
        if (arg === '--input') input = resolve(value);
        else if (arg === '--allow-file') allowedFiles.push(resolve(value));
        else caseName = value;
      } else throw new Error('invalid_arguments');
    }
    if (!input) throw new Error('input_required');
    // Choosing --input explicitly authorizes this one file, not its directory.
    const budget = { bytes: 0, documents: 0 };
    const buffer = readAuthorized(input, [...allowedFiles, input], budget);
    const parsed = JSON.parse(buffer.toString('utf8'));
    const record = caseName ? parsed.cases?.find(item => item.id === caseName)?.record : parsed;
    if (record === undefined) throw new Error('case_not_found');
    const output = evaluate(record, { allowedFiles });
    if (budget.bytes + output.overhead.bytes_read > MAX_BYTES) throw new Error('byte_limit');
    output.overhead.transport_bytes = budget.bytes;
    output.overhead.transport_documents = budget.documents;
    write(serialize(semanticOnly ? output.result : output) + '\n');
    return 0;
  } catch {
    write(serialize({ error: 'invalid_input_or_access', schema_version: '1' }) + '\n');
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runCli(process.argv.slice(2));
