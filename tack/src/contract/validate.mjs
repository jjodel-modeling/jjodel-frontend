// Contract v1 validator for the Tack log (JSON Lines). Hand-written, no schema engine:
// one function per rule, each returning an array of { line, field, rule, message }.
// Pass 1 is structural (one line at a time); pass 2 is referential (across lines and fields).

export const UNIT_PATTERN = /^P-\d{4}-\d{2}-\d{2}-\d{4}(-[a-z0-9]{1,8})?$/;
const FOUND_IN_PATTERN = /^[PC]-\d{4}-\d{2}-\d{2}-\d{4}/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const OUTCOMES = ['completed', 'partial', 'problems'];
const REGRESSIONS = ['yes', 'no', 'unknown'];
const CAUSES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const PRIORITIES = ['high', 'medium', 'low'];
const TYPES = ['task', 'ticket'];

const has = (entry, field) => entry[field] !== undefined;
const viol = (line, field, rule, message) => ({ line, field, rule, message });
const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

// Pass 1: structural rules --------------------------------------------------

function contractVersion(entry, line) {
  return entry.contract === 1 ? [] : [viol(line, 'contract', 'contract-version', 'must be the number 1')];
}

function typeEnum(entry, line) {
  return TYPES.includes(entry.type) ? [] : [viol(line, 'type', 'type-enum', 'must be "task" or "ticket"')];
}

function dateFormat(entry, line) {
  const m = typeof entry.date === 'string' ? DATE_PATTERN.exec(entry.date) : null;
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const probe = new Date(Date.UTC(y, mo - 1, d));
    if (probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d) return [];
  }
  return [viol(line, 'date', 'date-format', 'must be a real calendar date, YYYY-MM-DD')];
}

function titleLength(entry, line) {
  const t = entry.title;
  return typeof t === 'string' && t.length >= 1 && t.length <= 200
    ? []
    : [viol(line, 'title', 'title-length', 'must be a string of 1 to 200 characters')];
}

function unitRequired(entry, line) {
  return entry.type === 'task' && !has(entry, 'unit')
    ? [viol(line, 'unit', 'unit-required', 'a task entry must carry its unit id')]
    : [];
}

function unitFormat(entry, line) {
  if (!has(entry, 'unit')) return [];
  return typeof entry.unit === 'string' && UNIT_PATTERN.test(entry.unit)
    ? []
    : [viol(line, 'unit', 'unit-format', 'must match P-YYYY-MM-DD-HHmm with an optional -suffix')];
}

function notesLength(entry, line) {
  if (!has(entry, 'notes')) return [];
  return typeof entry.notes === 'string' && entry.notes.length <= 500
    ? []
    : [viol(line, 'notes', 'notes-length', 'must be a string of at most 500 characters')];
}

const TASK_KEYS = ['outcome', 'corrects', 'cause', 'regressions', 'out_of_scope'];
const TICKET_KEYS = ['priority', 'found_in'];

function fieldRequired(entry, line) {
  const out = [];
  const need = (field) => out.push(viol(line, field, 'field-required', `${entry.type} entry requires "${field}"`));
  if (entry.type === 'task') {
    if (!isNonEmptyString(entry.summary)) need('summary');
    for (const key of TASK_KEYS) if (!has(entry, key)) need(key);
  } else if (entry.type === 'ticket') {
    if (!isNonEmptyString(entry.finding)) need('finding');
    for (const key of TICKET_KEYS) if (!has(entry, key)) need(key);
  }
  return out;
}

const enumRule = (type, field, rule, values) => (entry, line) =>
  entry.type === type && has(entry, field) && !values.includes(entry[field])
    ? [viol(line, field, rule, `must be one of ${values.join(', ')}`)]
    : [];

const outcomeEnum = enumRule('task', 'outcome', 'outcome-enum', OUTCOMES);
const regressionsEnum = enumRule('task', 'regressions', 'regressions-enum', REGRESSIONS);
const priorityEnum = enumRule('ticket', 'priority', 'priority-enum', PRIORITIES);

function outOfScopeType(entry, line) {
  return entry.type === 'task' && has(entry, 'out_of_scope') && typeof entry.out_of_scope !== 'boolean'
    ? [viol(line, 'out_of_scope', 'out-of-scope-type', 'must be true or false')]
    : [];
}

function filesType(entry, line) {
  if (entry.type !== 'task' || !has(entry, 'files')) return [];
  return Array.isArray(entry.files) && entry.files.every((f) => typeof f === 'string')
    ? []
    : [viol(line, 'files', 'files-type', 'must be an array of strings')];
}

function correctsFormat(entry, line) {
  if (entry.type !== 'task' || !has(entry, 'corrects') || entry.corrects === null) return [];
  return typeof entry.corrects === 'string' && UNIT_PATTERN.test(entry.corrects)
    ? []
    : [viol(line, 'corrects', 'corrects-format', 'must be null or a unit id')];
}

function causeVocabulary(entry, line) {
  if (entry.type !== 'task' || !has(entry, 'cause') || entry.cause === null) return [];
  return CAUSES.includes(entry.cause)
    ? []
    : [viol(line, 'cause', 'cause-vocabulary', `must be null or one of ${CAUSES.join(', ')}`)];
}

function foundInFormat(entry, line) {
  if (entry.type !== 'ticket' || !has(entry, 'found_in')) return [];
  return typeof entry.found_in === 'string' && FOUND_IN_PATTERN.test(entry.found_in)
    ? []
    : [viol(line, 'found_in', 'found-in-format', 'must be a P-... or C-... id')];
}

function detailEmpty(entry, line) {
  if (entry.type !== 'ticket' || !has(entry, 'detail')) return [];
  return isNonEmptyString(entry.detail) ? [] : [viol(line, 'detail', 'detail-empty', 'must be a non-empty string when present')];
}

export const STRUCTURAL_RULES = [
  contractVersion, typeEnum, dateFormat, titleLength, unitRequired, unitFormat, notesLength,
  fieldRequired, outcomeEnum, regressionsEnum, outOfScopeType, filesType, correctsFormat,
  causeVocabulary, priorityEnum, foundInFormat, detailEmpty,
];

// Pass 2: referential rules -------------------------------------------------

// records: [{ line, entry, clean }] in file order; `clean` = no pass-1 violation on that line.
function unitDuplicate(records) {
  const seen = new Map();
  const out = [];
  for (const { line, entry } of records) {
    if (entry.type !== 'task' || typeof entry.unit !== 'string' || !UNIT_PATTERN.test(entry.unit)) continue;
    if (seen.has(entry.unit)) {
      out.push(viol(line, 'unit', 'unit-duplicate', `${entry.unit} already used on line ${seen.get(entry.unit)}`));
    } else {
      seen.set(entry.unit, line);
    }
  }
  return out;
}

function correctsUnresolved(records) {
  const earlier = new Set();
  const out = [];
  for (const { line, entry, clean } of records) {
    if (clean && entry.type === 'task' && typeof entry.corrects === 'string' && !earlier.has(entry.corrects)) {
      out.push(viol(line, 'corrects', 'corrects-unresolved', `${entry.corrects} is not the unit of an earlier task line`));
    }
    if (entry.type === 'task' && typeof entry.unit === 'string') earlier.add(entry.unit);
  }
  return out;
}

function causeRequired(records) {
  const out = [];
  for (const { line, entry, clean } of records) {
    if (!clean || entry.type !== 'task') continue;
    const demanded = entry.outcome !== 'completed' || entry.corrects !== null;
    if (demanded && entry.cause === null) {
      out.push(viol(line, 'cause', 'cause-required', 'cause is required when outcome is partial or problems, or corrects is set'));
    }
  }
  return out;
}

function causeForbidden(records) {
  const out = [];
  for (const { line, entry, clean } of records) {
    if (!clean || entry.type !== 'task') continue;
    const demanded = entry.outcome !== 'completed' || entry.corrects !== null;
    if (!demanded && entry.cause !== null) {
      out.push(viol(line, 'cause', 'cause-forbidden', 'cause must be null when outcome is completed and nothing is corrected'));
    }
  }
  return out;
}

export const REFERENTIAL_RULES = [unitDuplicate, correctsUnresolved, causeRequired, causeForbidden];

// Driver ----------------------------------------------------------------------

/** Validates the text of a JSON Lines log. Returns { entries, violations } sorted by line. */
export function validateText(text) {
  const violations = [];
  const records = [];
  let entries = 0;
  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === '') return;
    entries += 1;
    let entry;
    try {
      entry = JSON.parse(raw);
    } catch (err) {
      violations.push(viol(line, '-', 'json-syntax', `not valid JSON: ${err.message}`));
      return;
    }
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      violations.push(viol(line, '-', 'json-syntax', 'a log line must be a JSON object'));
      return;
    }
    const found = STRUCTURAL_RULES.flatMap((rule) => rule(entry, line));
    violations.push(...found);
    records.push({ line, entry, clean: found.length === 0 });
  });
  for (const rule of REFERENTIAL_RULES) violations.push(...rule(records));
  violations.sort((a, b) => a.line - b.line);
  return { entries, violations };
}
