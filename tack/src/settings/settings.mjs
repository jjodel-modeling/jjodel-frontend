// Tack settings: one schema (contract/v1/settings.json), three files. ~/.tack/settings.json is the user
// level (TACK_SETTINGS overrides the path), <repo>/tack.json the project level (versioned), <repo>/tack.local.json
// the local level (personal, git-ignored). A key is a schema node carrying x-tack-levels; it is one merge unit,
// and the later level replaces it whole: default < user < project < local. A key at a level it does not allow
// is an error, and so is a credential-shaped string in a project or local file: that is what keeps channel
// credentials out of versioned files. The validator is hand-written for the subset of JSON Schema the file uses.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';

export const SETTINGS_SCHEMA = JSON.parse(readFileSync(new URL('../../contract/v1/settings.json', import.meta.url), 'utf8'));
export const LEVELS = ['user', 'project', 'local'];

/** The level a settings file name stands for, or null for any other file. */
export const levelOfFile = (path) => ({ 'settings.json': 'user', 'tack.json': 'project', 'tack.local.json': 'local' })[basename(path)] ?? null;

/** The user file: TACK_SETTINGS, else ~/.tack/settings.json. */
export const userSettingsPath = () => process.env.TACK_SETTINGS || join(homedir(), '.tack', 'settings.json');

/** The project and local files of a work tree. */
export const repoSettingsPaths = (toplevel) => (toplevel ? { project: join(toplevel, 'tack.json'), local: join(toplevel, 'tack.local.json') } : { project: null, local: null });

const resolve = (node) => (node && node.$ref ? { ...SETTINGS_SCHEMA.$defs[node.$ref.replace('#/$defs/', '')], ...node, $ref: undefined } : node);

/** Every key of the schema in document order: { key, levels, node, default, secret }. */
export const KEYS = (function walk(node, prefix, out) {
  for (const [name, child] of Object.entries(node.properties ?? {})) {
    if (name === '$schema') continue;
    const key = prefix ? `${prefix}.${name}` : name;
    if (child['x-tack-levels']) out.push({ key, levels: child['x-tack-levels'], node: resolve(child), default: child.default, secret: !!child['x-tack-secret'] });
    else walk(child, key, out);
  }
  return out;
})(SETTINGS_SCHEMA, '', []);

const BY_KEY = new Map(KEYS.map((k) => [k.key, k]));
export const keyInfo = (key) => BY_KEY.get(key) ?? null;

// Credential-shaped strings: an ntfy URL with a topic, Slack and Discord webhooks, ntfy access tokens.
const SECRET = [
  /https?:\/\/[^\s"]*ntfy[^\s"/]*\/[A-Za-z0-9_-]+/i,
  /hooks\.slack\.com\/services\//i,
  /discord(app)?\.com\/api\/webhooks\//i,
  /\btk_[A-Za-z0-9]{8,}/,
];
export const looksSecret = (s) => typeof s === 'string' && SECRET.some((re) => re.test(s));

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const fits = (t, v) => { const a = typeOf(v); return t === a || (t === 'number' && a === 'integer'); };

/** Violations of value against a schema node: { key, rule, message }. */
export function validateValue(node, value, key) {
  node = resolve(node);
  const out = [];
  const bad = (rule, message) => out.push({ key, rule, message });
  if (node.enum) {
    if (!node.enum.some((e) => e === value)) bad('settings-enum', `must be one of ${node.enum.join(', ')}, got ${JSON.stringify(value)}`);
    return out;
  }
  const types = node.type === undefined ? null : [].concat(node.type);
  if (types && !types.some((t) => fits(t, value))) {
    bad('settings-type', `must be ${types.join(' or ')}, got ${typeOf(value)}`);
    return out;
  }
  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) bad('settings-range', `must be at least ${node.minimum}, got ${value}`);
    if (node.maximum !== undefined && value > node.maximum) bad('settings-range', `must be at most ${node.maximum}, got ${value}`);
  }
  if (typeof value === 'string' && node.pattern && !new RegExp(node.pattern).test(value)) bad('settings-pattern', `does not match ${node.pattern}`);
  if (typeOf(value) === 'array' && node.items) value.forEach((x, i) => out.push(...validateValue(node.items, x, `${key}[${i}]`)));
  if (typeOf(value) === 'object') {
    for (const r of node.required ?? []) if (!(r in value)) bad('settings-type', `misses ${r}`);
    for (const [k, v] of Object.entries(value)) {
      const child = node.properties?.[k];
      if (!child) { if (node.additionalProperties === false) out.push({ key: `${key}.${k}`, rule: 'settings-unknown-key', message: 'not a key of the settings schema' }); }
      else out.push(...validateValue(child, v, `${key}.${k}`));
    }
  }
  return out;
}

function stringsUnder(value, key, out) {
  if (typeof value === 'string') out.push([key, value]);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) stringsUnder(v, Array.isArray(value) ? `${key}[${k}]` : key ? `${key}.${k}` : k, out);
  return out;
}

/** Violations of a parsed settings document at a level: unknown keys, keys out of their level, bad values, secrets. */
export function validateSettings(doc, level) {
  if (typeOf(doc) !== 'object') return [{ key: '-', rule: 'settings-not-object', message: 'a settings file is one JSON object' }];
  const out = [];
  (function walk(node, obj, prefix) {
    for (const [name, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${name}` : name;
      if (!prefix && name === '$schema') continue;
      const child = node.properties?.[name];
      if (!child) { out.push({ key, rule: 'settings-unknown-key', message: 'not a key of the settings schema' }); continue; }
      if (child['x-tack-levels']) {
        if (!child['x-tack-levels'].includes(level)) out.push({ key, rule: 'settings-level', message: `allowed at ${child['x-tack-levels'].join(', ')}, not in a ${level} file` });
        else out.push(...validateValue(child, v, key));
      } else if (typeOf(v) !== 'object') out.push({ key, rule: 'settings-type', message: `must be object, got ${typeOf(v)}` });
      else walk(child, v, key);
    }
  })(SETTINGS_SCHEMA, doc, '');
  if (level !== 'user') {
    for (const [key, s] of stringsUnder(doc, '', [])) {
      if (looksSecret(s)) out.push({ key, rule: 'settings-secret', message: `a credential-shaped string in a ${level} file: credentials belong in the user file` });
    }
  }
  return out;
}

/** Parses and validates the text of a settings file: { doc, violations }; doc is null on a syntax error. */
export function checkSettingsText(text, level) {
  let doc;
  try { doc = JSON.parse(text); } catch (err) { return { doc: null, violations: [{ key: '-', rule: 'settings-json-syntax', message: err.message }] }; }
  return { doc, violations: validateSettings(doc, level) };
}

export function getPath(obj, key) {
  let cur = obj;
  for (const p of key.split('.')) { if (cur === null || typeof cur !== 'object' || !(p in cur)) return undefined; cur = cur[p]; }
  return cur;
}

/**
 * Reads one level's file: { path, exists, doc, values: Map key -> value (only the keys allowed at the level with a
 * valid value), violations }. A missing file is an empty level, not an error.
 */
export function readLevel(path, level) {
  const out = { path, level, exists: false, doc: null, values: new Map(), violations: [] };
  if (!path || !existsSync(path)) return out;
  out.exists = true;
  let text;
  try { text = readFileSync(path, 'utf8'); } catch (err) { out.violations.push({ key: '-', rule: 'settings-json-syntax', message: `cannot read: ${err.code ?? err.message}` }); return out; }
  const { doc, violations } = checkSettingsText(text, level);
  out.doc = doc;
  out.violations = violations;
  if (typeOf(doc) !== 'object') return out;
  const badKeys = new Set(violations.map((v) => v.key));
  for (const k of KEYS) {
    if (!k.levels.includes(level)) continue;
    const v = getPath(doc, k.key);
    if (v === undefined) continue;
    if ([...badKeys].some((b) => b === k.key || b.startsWith(k.key + '.') || b.startsWith(k.key + '['))) continue;
    out.values.set(k.key, v);
  }
  return out;
}

/**
 * The effective settings over the three files ({ user, project, local } paths, null for a level not in play):
 * { value(key), entries: [{ key, value, source, levels, default, secret }], files, violations: [{ file, key, rule, message }] }.
 */
export function effectiveSettings({ user = userSettingsPath(), project = null, local = null } = {}) {
  const files = { user: readLevel(user, 'user'), project: readLevel(project, 'project'), local: readLevel(local, 'local') };
  const entries = KEYS.map((k) => {
    let value = k.default, source = 'default';
    for (const level of LEVELS) if (k.levels.includes(level) && files[level].values.has(k.key)) { value = files[level].values.get(k.key); source = level; }
    return { key: k.key, value, source, levels: k.levels, default: k.default, secret: k.secret };
  });
  const map = new Map(entries.map((e) => [e.key, e.value]));
  return {
    value: (key) => map.get(key),
    entries,
    files: Object.fromEntries(LEVELS.map((l) => [l, { path: files[l].path, exists: files[l].exists }])),
    violations: LEVELS.flatMap((l) => files[l].violations.map((v) => ({ file: files[l].path, ...v }))),
  };
}

/** The settings of a repository of the store: its first present toplevel gives tack.json and tack.local.json. */
export function settingsResolver(db, { user = userSettingsPath() } = {}) {
  const cache = new Map();
  const top = db.prepare('SELECT toplevels FROM repos WHERE key = ?');
  return (repoKey) => {
    if (cache.has(repoKey ?? '')) return cache.get(repoKey ?? '');
    let toplevel = null;
    if (repoKey) {
      const tops = JSON.parse(top.get(repoKey)?.toplevels ?? '[]');
      toplevel = tops.find((t) => existsSync(join(t, 'tack.json'))) ?? tops.find((t) => existsSync(t)) ?? null;
    }
    const s = effectiveSettings({ user, ...repoSettingsPaths(toplevel) });
    s.toplevel = toplevel;
    cache.set(repoKey ?? '', s);
    return s;
  };
}

/**
 * Writes one key into a user or local file, atomically (a temporary file renamed over it). value undefined with
 * reset true removes the key. Throws { code: 'level' | 'invalid' | 'unreadable' | 'unknown' } without writing.
 */
export function writeSetting(path, level, key, value, { reset = false } = {}) {
  const fail = (code, message) => { const e = new Error(message); e.code = code; throw e; };
  const k = keyInfo(key);
  if (!k) fail('unknown', `${key} is not a key of the settings schema`);
  if (!k.levels.includes(level)) fail('level', `${key} is allowed at ${k.levels.join(', ')}, not in a ${level} file`);
  if (!reset) {
    const v = validateValue(k.node, value, key);
    if (v.length) fail('invalid', `${v[0].key} ${v[0].rule}: ${v[0].message}`);
    if (level !== 'user' && stringsUnder(value, key, []).some(([, s]) => looksSecret(s))) fail('invalid', `${key} settings-secret: credentials belong in the user file`);
  }
  let doc = {};
  if (existsSync(path)) {
    try { doc = JSON.parse(readFileSync(path, 'utf8')); } catch { fail('unreadable', `${path} is not valid JSON: fix it by hand, Tack does not overwrite it`); }
    if (typeOf(doc) !== 'object') fail('unreadable', `${path} is not a JSON object`);
  }
  const parts = key.split('.');
  const chain = [doc];
  for (const p of parts.slice(0, -1)) {
    const cur = chain.at(-1);
    if (typeOf(cur[p]) !== 'object') { if (reset) return { path, changed: false }; cur[p] = {}; }
    chain.push(cur[p]);
  }
  const leaf = parts.at(-1);
  if (reset) {
    delete chain.at(-1)[leaf];
    for (let i = chain.length - 1; i > 0; i--) if (Object.keys(chain[i]).length === 0) delete chain[i - 1][parts[i - 1]];
  } else chain.at(-1)[leaf] = value;
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(doc, null, 2) + '\n');
  renameSync(tmp, path);
  return { path, changed: true };
}
