export const VERSION = '1';
export const VERDICTS = Object.freeze(['consistent', 'incompatible', 'incomplete', 'indeterminate', 'not_applicable']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.length > 0;

export function validateRecord(record) {
  const errors = [];
  if (!object(record)) return ['record'];
  if (record.schema_version !== VERSION) errors.push('schema_version');
  if (!['applicable', 'not_applicable'].includes(record.activation)) errors.push('activation');
  if (record.activation === 'not_applicable') {
    if (!nonempty(record.reason)) errors.push('reason');
    return errors;
  }
  for (const field of ['requirement', 'strategy', 'counterexample', 'expected_result']) {
    if (!object(record[field])) errors.push(field);
  }
  if (!Array.isArray(record.sources) || !record.sources.length || record.sources.length > 32) errors.push('sources');
  else {
    const ids = new Set();
    for (const source of record.sources) {
      if (!object(source) || !nonempty(source.id) || ids.has(source.id) ||
          !/^[a-f0-9]{64}$/.test(source.sha256 ?? '') ||
          (typeof source.text === 'string') === (typeof source.path === 'string') ||
          !nonempty(source.origin)) errors.push('source_descriptor');
      if (object(source)) ids.add(source.id);
    }
  }
  if (!object(record.rule) || !nonempty(record.rule.name)) errors.push('rule');
  if (record.identity_refs !== undefined && !object(record.identity_refs)) errors.push('identity_refs');
  if (record.contamination !== undefined && !['unknown', 'contaminated', 'declared_unexposed'].includes(record.contamination)) errors.push('contamination');
  return [...new Set(errors)].sort();
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const serialize = value => JSON.stringify(canonical(value));
