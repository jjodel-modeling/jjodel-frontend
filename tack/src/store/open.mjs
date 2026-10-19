import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA_VERSION = 1;

/** One store per user, outside every scanned repository: --store, then TACK_STORE, then ~/.tack/store.db. */
export function storePath(flag) {
  return flag ?? (process.env.TACK_STORE || join(homedir(), '.tack', 'store.db'));
}

export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version === 0) {
    db.exec('BEGIN');
    db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.exec('COMMIT');
  } else if (version !== SCHEMA_VERSION) {
    db.close();
    throw new Error(`store ${path} has schema version ${version}, this tack reads ${SCHEMA_VERSION}`);
  }
  return db;
}
