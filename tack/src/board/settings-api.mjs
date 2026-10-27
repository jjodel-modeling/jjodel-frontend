// The board's settings and load endpoints. GET /api/settings shows every key with its effective value and the
// level it comes from; POST /api/settings writes one key to the user file or to the repository's
// tack.local.json, never to tack.json: a project key is read-only in the board (403). GET /api/load serves the
// sampler's ring with the threshold and the lane starts and ends inside it.
import { existsSync } from 'node:fs';
import { git } from '../collectors/git/run.mjs';
import { CATALOGUE } from '../notify/notifier.mjs';
import { SAMPLE_MS, laneTicks } from '../host/load.mjs';
import { effectiveSettings, keyInfo, repoSettingsPaths, settingsResolver, writeSetting } from '../settings/settings.mjs';

const pick = (node) => Object.fromEntries(['type', 'enum', 'minimum', 'maximum', 'pattern'].filter((k) => node[k] !== undefined).map((k) => [k, node[k]]));

/** Whether tack.local.json is git-ignored in a work tree: true, false, or null outside one. */
export function localIgnored(toplevel) {
  if (!toplevel || !existsSync(toplevel)) return null;
  try {
    const r = git(['-C', toplevel, 'check-ignore', '-q', 'tack.local.json']);
    return r.ok;
  } catch { return null; }
}

export function settingsApi(db, { repo = null, user }) {
  const toplevel = repo ? settingsResolver(db, { user })(repo).toplevel : null;
  const s = effectiveSettings({ user, ...repoSettingsPaths(toplevel) });
  const ignored = localIgnored(toplevel);
  return {
    repo, toplevel,
    files: { ...s.files, local: { ...s.files.local, ignored } },
    warning: toplevel && ignored === false ? `tack.local.json is not git-ignored in ${toplevel}: add it to .gitignore before writing personal overrides` : null,
    keys: s.entries.map((e) => ({ ...e, schema: pick(keyInfo(e.key).node) })),
    catalogue: CATALOGUE,
    violations: s.violations,
  };
}

/** One write: { target: 'user' | 'local', key, value } or { target, key, op: 'reset' }. Resolves to { status, body }. */
export function settingsWrite(db, body, { user }) {
  const { target, key, value, op, repo = null } = body ?? {};
  if (target === 'project') return { status: 403, body: { error: 'tack.json is versioned: the board never writes it; edit the file and commit it' } };
  if (target !== 'user' && target !== 'local') return { status: 400, body: { error: 'target is user or local' } };
  const k = keyInfo(String(key));
  if (!k) return { status: 400, body: { error: `${key} is not a key of the settings schema` } };
  if (!k.levels.includes(target)) {
    const projectOnly = k.levels.length === 1 && k.levels[0] === 'project';
    return { status: projectOnly ? 403 : 400, body: { error: `${key} is allowed at ${k.levels.join(', ')}, not in a ${target} file` } };
  }
  let path = user;
  if (target === 'local') {
    const toplevel = repo ? settingsResolver(db, { user })(repo).toplevel : null;
    if (!toplevel) return { status: 400, body: { error: 'a local override needs a repository with a work tree on disk: pick one' } };
    path = repoSettingsPaths(toplevel).local;
  }
  try {
    writeSetting(path, target, k.key, value, { reset: op === 'reset' });
  } catch (err) {
    return { status: err.code === 'unreadable' ? 409 : 400, body: { error: err.message } };
  }
  return { status: 200, body: { written: path, ...settingsApi(db, { repo, user }) } };
}

/** The load strip: the ring, the threshold (raw), the core count, the user's normalisation and the lane ticks. */
export function loadApi(db, sampler, { repo = null, user }) {
  const samples = sampler ? sampler.samples() : [];
  const s = settingsResolver(db, { user })(repo);
  const to = samples.length ? samples.at(-1).t : Date.now();
  const from = samples.length ? samples[0].t - SAMPLE_MS : to;
  return {
    samples, threshold: s.value('load.threshold'), normalised: s.value('appearance.loadNormalised'),
    cores: samples.at(-1)?.cores ?? null, ticks: laneTicks(db, from, to),
  };
}

/** The attributes of <html> for the user's appearance: theme, density, motion and font scale. */
export function htmlAttributes(user) {
  const s = effectiveSettings({ user });
  const esc = (x) => String(x).replace(/[^A-Za-z0-9.-]/g, '');
  return `data-theme="${esc(s.value('appearance.theme'))}" data-density="${esc(s.value('appearance.density'))}" data-motion="${esc(s.value('appearance.reducedMotion'))}" style="--font-scale:${Number(s.value('appearance.fontScale')) || 1}"`;
}
