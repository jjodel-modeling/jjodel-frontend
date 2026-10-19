// Commit linkage: which unit a commit belongs to.
// Canonical form is the trailer `Unit: <id>`; the subject suffix ` (<id>)` is read as an alias.
import { UNIT_PATTERN } from './validate.mjs';

const ID = UNIT_PATTERN.source.slice(1, -1);
const TRAILER = new RegExp(`^Unit:[ \\t]*(${ID})[ \\t]*$`, 'm');
const SUBJECT_SUFFIX = new RegExp(`\\((${ID})\\)[ \\t]*$`);

/** The unit id a commit message links to and the form that matched ('trailer' or 'suffix'), or null. */
export function unitLinkFromCommit(message) {
  const trailer = TRAILER.exec(message);
  if (trailer) return { unit: trailer[1], form: 'trailer' };
  const subject = message.split('\n', 1)[0];
  const suffix = SUBJECT_SUFFIX.exec(subject);
  return suffix ? { unit: suffix[1], form: 'suffix' } : null;
}

/** Returns the unit id a commit message links to, or null. The trailer wins over the suffix. */
export function unitFromCommit(message) {
  return unitLinkFromCommit(message)?.unit ?? null;
}
