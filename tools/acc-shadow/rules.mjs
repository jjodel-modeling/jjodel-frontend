import { performance } from 'node:perf_hooks';
import { VERSION, validateRecord, canonical, serialize } from './contract.mjs';
import { resolveSources, resolveReference, sha256 } from './sources.mjs';

const SUPPORTED = ['identity_text', 'line_occurrence_coverage'];
const normalize = text => text.split('\n').map(line => line.replace(/[ \t]+$/u, ''));
function counts(text) {
  const result = new Map();
  for (const line of normalize(text)) result.set(line, (result.get(line) ?? 0) + 1);
  return result;
}
export function project(text, projection, reference) {
  if (projection === 'identity_text') return text;
  if (projection !== 'line_occurrence_coverage') throw new Error('unsupported_projection');
  const baseline = counts(reference);
  const candidate = counts(text);
  return [...baseline.keys()].sort().map(line => [line, Math.min(baseline.get(line), candidate.get(line) ?? 0)]);
}

export function evaluate(record, { allowedFiles = [] } = {}) {
  const start = performance.now();
  const encodedInput = serialize(record) ?? 'null';
  const budget = { bytes: 0, documents: 0 };
  const semantic = {
    schema_version: VERSION, input_sha256: sha256(encodedInput),
    activation: 'applicable', capabilities_applied: ['L0'], verdict: 'incomplete',
    recommendation: null, finding: { rule: null, evidence: [], explanation: '' },
    temporal_status: 'unverified', prospective_eligible: false,
    contamination: 'unknown', identity_refs: {}, existing_control: 'unknown', incremental_value: 'unproven'
  };
  const finish = (verdict, explanation, evidence = []) => {
    semantic.verdict = verdict;
    semantic.finding.explanation = explanation;
    semantic.finding.evidence = evidence;
    return { result: canonical(semantic), overhead: {
      runtime_ms: performance.now() - start, bytes_read: budget.bytes, documents_read: budget.documents,
      input_bytes: Buffer.byteLength(encodedInput), human_preparation_seconds: null,
      human_adjudication_seconds: null, llm_usage: 0
    } };
  };
  const errors = validateRecord(record);
  if (errors.length) return finish('incomplete', 'invalid_contract', errors);
  semantic.activation = record.activation;
  if (record.activation === 'not_applicable') return finish('not_applicable', record.reason);
  semantic.identity_refs = record.identity_refs ?? {};
  semantic.contamination = record.contamination ?? 'unknown';
  const { documents, problems } = resolveSources(record.sources, allowedFiles, budget);
  if (problems.length) return finish('incomplete', 'source_integrity', problems);
  const ref = value => resolveReference(value, documents);
  const requiredRefs = [record.requirement.ref, record.strategy.ref, record.counterexample.ref, record.expected_result.ref];
  const resolved = requiredRefs.map(ref);
  if (resolved.some(value => value === null)) return finish('incomplete', 'unresolved_reference');
  semantic.finding.rule = record.rule.name;
  // Dates and assertions are evidence supplied by the caller, never proof of chronology.
  const temporal = record.temporal_evidence;
  if (temporal) {
    const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
    const acquired = timestamp(temporal.captured_at);
    const coding = timestamp(temporal.coding_started_at);
    if (Number.isFinite(acquired) && Number.isFinite(coding) && ref(temporal.ref)) {
      semantic.temporal_status = acquired < coding ? 'attested_pre_coding' : 'late';
    }
  }
  // Offline calibration is never automatically promoted into a prospective observation.
  if (record.rule.name !== 'projection_collision') {
    semantic.recommendation = 'L2_recommended';
    return finish('indeterminate', 'unsupported_rule');
  }
  const allowedRuleKeys = ['name', 'projection', 'valid', 'invalid', 'reference', 'support'];
  if (Object.keys(record.rule).some(key => !allowedRuleKeys.includes(key))) return finish('incomplete', 'unsupported_parameters');
  const projection = record.rule.projection;
  if (!SUPPORTED.includes(projection)) {
    semantic.recommendation = 'L2_recommended';
    return finish('indeterminate', 'unsupported_projection');
  }
  const valid = ref(record.rule.valid);
  const invalid = ref(record.rule.invalid);
  const baseline = projection === 'line_occurrence_coverage' ? ref(record.rule.reference) : null;
  if (!valid || !invalid || (projection === 'line_occurrence_coverage' && !baseline)) return finish('incomplete', 'projection_parameters');
  const support = record.rule.support;
  const claims = ['faithful_projection', 'different_expected_results', 'no_other_information'];
  if (!support || claims.some(key => support[key]?.status !== 'attested' || !ref(support[key]?.ref))) {
    semantic.recommendation = 'L2_recommended';
    return finish('indeterminate', 'unverified_strategy_conditions');
  }
  const expected = record.expected_result;
  if (typeof expected.valid !== 'string' || typeof expected.invalid !== 'string') return finish('incomplete', 'expected_results_missing');
  if (expected.valid === expected.invalid) return finish('indeterminate', 'expected_results_not_distinct');
  // Ensure the tested counterexample is the one declared in the input contract.
  if (serialize(invalid) !== serialize(resolved[2])) return finish('indeterminate', 'counterexample_binding_mismatch');
  semantic.capabilities_applied.push('L1');
  const left = serialize(project(valid.quote, projection, baseline?.quote));
  const right = serialize(project(invalid.quote, projection, baseline?.quote));
  const evidence = {
    projection, valid, invalid, reference: baseline,
    expected: { valid: expected.valid, invalid: expected.invalid },
    projection_sha256: { valid: sha256(left), invalid: sha256(right) },
    support: Object.fromEntries(claims.map(key => [key, ref(support[key].ref)])),
    condition_basis: 'explicit_attestations_not_automatic_semantic_verification'
  };
  return finish(left === right ? 'incompatible' : 'consistent',
    left === right ? 'projection_collision_under_attested_conditions' : 'no_incompatibility_demonstrated', evidence);
}
