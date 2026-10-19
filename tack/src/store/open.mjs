import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA_VERSION = 3;

// Schema file per version: a store at version n is brought forward by the files above n.
const SCHEMA_FILES = { 1: './schema.sql', 2: './schema-2.sql', 3: './schema-3.sql' };

/** One store per user, outside every scanned repository: --store, then TACK_STORE, then ~/.tack/store.db. */
export function storePath(flag) {
  return flag ?? (process.env.TACK_STORE || join(homedir(), '.tack', 'store.db'));
}

export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > SCHEMA_VERSION) {
    db.close();
    throw new Error(`store ${path} has schema version ${version}, this tack reads ${SCHEMA_VERSION}`);
  }
  if (version < SCHEMA_VERSION) {
    db.exec('BEGIN');
    for (let v = version + 1; v <= SCHEMA_VERSION; v++) {
      db.exec(readFileSync(new URL(SCHEMA_FILES[v], import.meta.url), 'utf8'));
    }
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.exec('COMMIT');
  }
  return db;
}
