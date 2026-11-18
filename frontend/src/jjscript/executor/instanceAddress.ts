/**
 * JjScript M1 instance addresses — where a `set` on a reference link looks for its target (#213)
 *
 *   set s.lead = p              the active model only; the run's handle registry may answer
 *   set s.lead = Other::p       the instance p of the M1 model Other, another model of the project
 *   set s.lead = "My Model::p"  the same, quoted because the model name holds a space
 *
 * One code path for the quoted and the unquoted form: the parser hands both to the handler
 * as a string (a QUALIFIED_NAME's `raw`, or a STRING literal's value), so the address is
 * decided at string level, split on the FIRST `::` — both halves verbatim. Extending the
 * lexer's identifier charset for unquoted names with spaces is a language-level change
 * (settled decision 3 of the issue's plan); the quoted form fully covers the need.
 *
 * Pure on purpose: the same rule as `referenceWrite.ts` — `commands/instance.ts` reads the
 * store and applies the decision, but it reaches monaco through `joiner` and does not load
 * under the bench's `environment: 'node'`.
 *
 * The handle registry is a data point, not a branch: `consultRegistry` is true exactly
 * when the address stays in the active model (a bare name, or a qualifier naming the active
 * model). A cross-model target is never a run-local handle, so the qualified path must not
 * ask the registry: `Other::p` must not silently resolve to the run-local p.
 */

/** The minimal shape of a model an address can name: id and name, both plain. */
export interface ModelRef {
    id: string;
    name: string;
}

/** A bare name (no `::`): one instance of the active model. */
export interface BareAddress {
    qualified: false;
    name: string;
}

/** A `<Model>::<instance>` address: the model and the instance, both verbatim. */
export interface QualifiedAddress {
    qualified: true;
    model: string;
    instance: string;
}

export type InstanceAddress = BareAddress | QualifiedAddress;

/**
 * Split an instance address on the FIRST `::`; both halves verbatim (either may contain
 * spaces or further `::`). No `::` at all is a bare name.
 */
export function parseInstanceAddress(raw: string): InstanceAddress {
    const i = raw.indexOf('::');
    if (i < 0) return { qualified: false, name: raw };
    return { qualified: true, model: raw.slice(0, i), instance: raw.slice(i + 2) };
}

/**
 * The verdict of picking the model a qualifier names:
 *  - `one` — exactly one model carries the name (exact, or a lone case-insensitive match);
 *  - `ambiguous` — two or more do;
 *  - `absent` — none; the project's models are the suggestion the caller lists.
 */
export type ModelPick =
    | { kind: 'one'; model: ModelRef }
    | { kind: 'ambiguous'; matches: readonly ModelRef[] }
    | { kind: 'absent'; models: readonly ModelRef[] };

/**
 * Pick the model a qualifier names: the exact (case-sensitive) name first, then a single
 * case-insensitive match. An exact hit wins over a case-insensitive one, so a model named
 * exactly `Other` is not shadowed by a sibling `other` listed before it.
 */
export function pickModel(models: readonly ModelRef[], qualifier: string): ModelPick {
    const exact = models.filter((m) => m.name === qualifier);
    if (exact.length === 1) return { kind: 'one', model: exact[0] };
    if (exact.length > 1) return { kind: 'ambiguous', matches: exact };
    const loose = models.filter((m) => m.name.toLowerCase() === qualifier.toLowerCase());
    if (loose.length === 1) return { kind: 'one', model: loose[0] };
    if (loose.length > 1) return { kind: 'ambiguous', matches: loose };
    return { kind: 'absent', models };
}

export type AddressResolution =
    /** A bare name, or a qualifier naming the active model: the committed path, registry included. */
    | { kind: 'local'; name: string; consultRegistry: true }
    /** The instance of another M1 model of the project: the registry must not answer. */
    | { kind: 'cross'; model: ModelRef; instance: string; consultRegistry: false }
    /** No model of the project carries the qualifier. */
    | { kind: 'model-absent'; qualifier: string; models: readonly ModelRef[] }
    /** Two or more models carry the qualifier. */
    | { kind: 'model-ambiguous'; qualifier: string; matches: readonly ModelRef[] };

/**
 * Decide where a link target lives, from its string address and the project's M1 models.
 *
 * A qualifier naming the active model is NOT cross-model (settled decision in the issue's
 * plan): the address keeps today's path exactly, the handle registry included. A script
 * cannot create instances outside the active model, so a `cross` verdict, and both model
 * refusals, are final the moment the handler runs — the waiter ends at once rather than
 * waiting for something that cannot arrive.
 */
export function resolveInstanceAddress(
    raw: string,
    activeModel: ModelRef,
    models: readonly ModelRef[],
): AddressResolution {
    const address = parseInstanceAddress(raw);
    if (!address.qualified) return { kind: 'local', name: address.name, consultRegistry: true };

    const pick = pickModel(models, address.model);
    if (pick.kind === 'absent') return { kind: 'model-absent', qualifier: address.model, models: pick.models };
    if (pick.kind === 'ambiguous') return { kind: 'model-ambiguous', qualifier: address.model, matches: pick.matches };
    if (pick.model.id === activeModel.id) return { kind: 'local', name: address.instance, consultRegistry: true };
    return { kind: 'cross', model: pick.model, instance: address.instance, consultRegistry: false };
}

/**
 * The suggestion a bare name earns when the active model does not hold it but one or more
 * other models of the project do: the qualified spellings, one per model, in the order
 * given. One model: `Found in 'Other': qualify as Other::p.`
 */
export function elsewhereSuggestion(instance: string, modelNames: readonly string[]): string {
    const where = modelNames.map((n) => `'${n}'`).join(', ');
    const as = modelNames.map((n) => `${n}::${instance}`).join(' or ');
    return `Found in ${where}: qualify as ${as}.`;
}
