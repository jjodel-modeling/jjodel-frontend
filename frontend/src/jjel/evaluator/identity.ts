/**
 * Identity of model objects (P-2026-11-17-2219).
 *
 * One model object reaches an expression as several JavaScript objects: the pool
 * handle of `buildEvalContext`, the record of `wrapSelectedElement` behind
 * `self`/`data`, an L-layer proxy (a new one at every read), and in JjTL the
 * source object, its view and the handle of a `{ __ref: id }` reference value.
 * Equality between them cannot be JavaScript reference, and must not be a walk
 * of their keys: the keys differ from one shape to the other, and the handles
 * form cycles (`member.parent.father` is the member).
 *
 * `modelIdentityOf` is the single place that says which values are model objects
 * and what identifies them. `==`, `!=`, `contains`, `indexOf`, `distinct`,
 * `distinctBy` and `groupBy` all go through it.
 */

const own = (obj: object, key: string): unknown =>
    Object.prototype.hasOwnProperty.call(obj, key) ? (obj as Record<string, unknown>)[key] : undefined;

/**
 * The id of the model object `value` stands for, or `null` when `value` is not
 * a model object (a primitive, an array, a record, a bit-vector, a function, an
 * object a JjTL rule is still building).
 *
 *   - a reference value or its handle: the own string `__ref`;
 *   - a model element: a non-empty string `id`, on an object that also owns a
 *     string `__type` or `className`. Every builder writes one of the two (pool
 *     handles and `self` carry `__type`, JjTL source objects both, the target of
 *     an L proxy `className`); a record written in an expression has neither, so
 *     `{ id: "x", n: 1 }` stays a record even though it has an `id`.
 *
 * An object marked `__createdBy` is a target under construction: its `id`, if
 * any, is the value of an attribute the target class happens to call `id`.
 *
 * Own-property reads first: on an L proxy they go to the D record through the
 * default trap and never run a getter; only `id` is read through the object.
 */
export function modelIdentityOf(value: unknown): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;

    const ref = own(value, '__ref');
    if (typeof ref === 'string' && ref !== '') return ref;

    if (own(value, '__createdBy') !== undefined) return null;
    if (typeof own(value, '__type') !== 'string' && typeof own(value, 'className') !== 'string') return null;

    let id: unknown;
    try { id = (value as { id?: unknown }).id; } catch { return null; }
    return typeof id === 'string' && id !== '' ? id : null;
}

/**
 * Equality when at least one side is a model object: `true` or `false`; and
 * `undefined` when neither is, so the caller goes on with its own rules.
 * A model object equals another reference to the same object and nothing else.
 */
export function modelObjectsEqual(a: unknown, b: unknown): boolean | undefined {
    const idA = modelIdentityOf(a);
    const idB = modelIdentityOf(b);
    if (idA === null && idB === null) return undefined;
    return idA === idB;
}
