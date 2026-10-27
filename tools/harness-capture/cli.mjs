import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { acquire, verifySnapshot, encode } from './acquisition.mjs';

export function runCli(args, write = text => process.stdout.write(text)) {
  try {
    const [command, ...rest] = args;
    if (!['capture', 'verify'].includes(command)) throw new Error('invalid_command');
    const options = {};
    for (let index = 0; index < rest.length; index += 2) {
      const key = { '--source-root': 'sourceRoot', '--allow-historical-lane': 'allowHistoricalLane', '--lane': 'lane', '--destination': 'destination', '--manifest': 'manifestSha256', '--observation': 'observationSha256', '--retries': 'maxRetries' }[rest[index]];
      if (!key || options[key] !== undefined || !rest[index + 1] || rest[index + 1].startsWith('--')) throw new Error('invalid_arguments');
      options[key] = key === 'maxRetries' ? Number(rest[index + 1]) : rest[index + 1];
    }
    if (!options.destination || (command === 'capture' && (!options.sourceRoot || !options.lane || options.manifestSha256 || options.observationSha256)) ||
        (command === 'verify' && (!options.manifestSha256 || options.sourceRoot || options.lane || options.allowHistoricalLane || options.maxRetries !== undefined))) throw new Error('invalid_arguments');
    write(encode(command === 'capture' ? acquire(options) : verifySnapshot(options)) + '\n');
    return 0;
  } catch (error) {
    // Avoid leaking arbitrary path contents or operating-system error messages.
    const code = /^[a-z_]+$/.test(error.message) ? error.message : 'capture_failed';
    write(encode({ schema_version: 1, error: code }) + '\n'); return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runCli(process.argv.slice(2));
