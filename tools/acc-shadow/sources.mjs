import { readFileSync, realpathSync, openSync, fstatSync, closeSync, constants } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const MAX_BYTES = 2_000_000;
export const sha256 = value => createHash('sha256').update(value).digest('hex');

// Exact file capabilities, never directory traversal or input-selected root expansion.
export function readAuthorized(file, allowedFiles, budget = { bytes: 0, documents: 0 }) {
  const requested = resolve(file);
  if (!allowedFiles.includes(requested)) throw new Error('unauthorized_path');
  if (realpathSync(requested) !== requested) throw new Error('symlink_path');
  const fd = openSync(requested, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error('not_regular_file');
    if (budget.bytes + stat.size > MAX_BYTES) throw new Error('byte_limit');
    const buffer = readFileSync(fd);
    if (budget.bytes + buffer.length > MAX_BYTES) throw new Error('byte_limit');
    budget.bytes += buffer.length;
    budget.documents += 1;
    return buffer;
  } finally { closeSync(fd); }
}

export function resolveSources(sources, allowedFiles = [], budget = { bytes: 0, documents: 0 }) {
  const documents = new Map();
  const problems = [];
  for (const source of [...sources].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    try {
      const inline = typeof source.text === 'string';
      const buffer = inline ? Buffer.from(source.text) : readAuthorized(source.path, allowedFiles, budget);
      if (inline) {
        if (budget.bytes + buffer.length > MAX_BYTES) throw new Error('byte_limit');
        budget.bytes += buffer.length;
        budget.documents += 1;
      }
      if (sha256(buffer) !== source.sha256) throw new Error('hash_mismatch');
      documents.set(source.id, buffer.toString('utf8'));
    } catch (error) {
      const code = ['unauthorized_path', 'symlink_path', 'not_regular_file', 'byte_limit', 'hash_mismatch'].includes(error.message)
        ? error.message : 'unresolved_source';
      problems.push({ source: source.id, code });
    }
  }
  return { documents, problems };
}

export function resolveReference(reference, documents) {
  if (!reference || typeof reference.source !== 'string' || typeof reference.quote !== 'string' || !reference.quote.length) return null;
  const text = documents.get(reference.source);
  if (text === undefined) return null;
  const start = reference.start;
  if (!Number.isInteger(start) || start < 0 || text.slice(start, start + reference.quote.length) !== reference.quote) return null;
  return { source: reference.source, start, quote: reference.quote };
}
