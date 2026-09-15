/**
 * jjform/nav — the DEPTH rule and the breadcrumb (slice 12c).
 *
 * Pure, zero imports, same reason as `shape.ts` and `multi.ts`.
 *
 * ── The specification ─────────────────────────────────────────────────────────
 *
 * `docs/design/design_handoff_instance_node/Instance Node Proposal.dc.html`,
 * Turno 12, panel `12c` — «Ricorsione profonda — drill-in»:
 *
 *   «Level 3 of containment: Sensor -> Port -> Filter. Inline stops at 1 level;
 *    beyond, drill-in replaces the form body»
 *   «La regola di profondita': un livello di children inline (10a), dal secondo in
 *    poi drill-in — il corpo della form e' sostituito dal figlio e il breadcrumb
 *    tiene la strada del containment. Ogni segmento e' cliccabile; la stessa
 *    regola vale in drawer, modale e pannello.»
 *
 * Three things are being said, and they are separable:
 *
 *  1. A DEPTH RULE, which is arithmetic on one number: at depth 0 (the form's own
 *     subject) a contained child renders INLINE; at depth 1 and beyond it renders
 *     as a link that drills in. `INLINE_DEPTH_LIMIT` is that number, named once.
 *  2. A ROOT SWAP: drilling in does not open a second form, it replaces the body
 *     of the one that is open. That is why `NavState` carries a PATH and not a
 *     stack of forms — there is only ever one form.
 *  3. A BREADCRUMB that «tiene la strada del containment», every segment
 *     clickable. `breadcrumbOf` builds it from the path; `truncateTo` is the
 *     click, and it is a truncation rather than a pop so that clicking segment 0
 *     from depth 4 is one operation and not four.
 *
 * The last clause — «la stessa regola vale in drawer, modale e pannello» — is why
 * this is a module and not three pieces of component state: the rule cannot be
 * the same in three surfaces if each surface writes its own copy of it.
 */

/**
 * How many levels of contained children render inline before drill-in takes over.
 *
 * ONE, from the design. Named rather than inlined because it appears in two
 * places that must not disagree — the renderer's question («do I nest, or link?»)
 * and the navigator's («did that click mean drill-in?»).
 */
export const INLINE_DEPTH_LIMIT = 1;

/** One step of the containment road. `childKey` is the slot the step came
 *  through, and it is null only for the root: every other segment was reached by
 *  a containment feature, and a breadcrumb that forgets which one cannot be
 *  rebuilt from its own endpoints when two slots hold the same metaclass. */
export interface NavStep {
    /** Opaque instance handle. */
    id: string;
    /** Display name, for the segment's label. */
    name: string;
    /** Metaclass name — the design prints «p2: Port», name and class. */
    cls: string;
    /** The containment feature this step was reached through; null for the root. */
    childKey: string | null;
}

/** Where the form currently is. The path always starts at the root subject, so
 *  `path[0]` is the instance the form was opened on and `path.length - 1` is the
 *  current depth. */
export interface NavState {
    path: NavStep[];
}

/** One clickable breadcrumb segment. */
export interface Crumb extends NavStep {
    depth: number;
    /** The last segment is where the form already is: rendering it as a link
     *  would offer a navigation that does nothing. */
    isCurrent: boolean;
}

/** The form's root subject, or null for an empty navigation. */
export function rootOf(nav: NavState): NavStep | null {
    return nav.path.length > 0 ? nav.path[0] : null;
}

/** The instance whose fields the form body is showing. */
export function currentOf(nav: NavState): NavStep | null {
    return nav.path.length > 0 ? nav.path[nav.path.length - 1] : null;
}

/** How deep the form has drilled. 0 is the root subject. */
export function depthOf(nav: NavState): number {
    return Math.max(0, nav.path.length - 1);
}

/** A navigation rooted at one instance — what opening a form produces. */
export function navFor(step: NavStep): NavState {
    return { path: [step] };
}

/**
 * Whether a contained child at `depth` renders inline or as a drill-in link.
 *
 * `depth` is the depth of the child's OWNER, which is the form's current depth:
 * the subject at depth 0 shows its children inline (that child is then at depth
 * 1, the inline level the design allows), and a subject at depth 1 or beyond
 * shows links instead.
 *
 * Written as a comparison against the named limit rather than `depth === 0` so
 * that the rule and the number stay one thing.
 */
export function rendersInline(depth: number): boolean {
    return depth < INLINE_DEPTH_LIMIT;
}

/**
 * Drill into `step` from the current position.
 *
 * A step already on the path is a CYCLE, and it truncates instead of appending:
 * the containment tree cannot contain a cycle (the core refuses the write —
 * `LValue.setValueAtPosition`, measured), but a breadcrumb built from a corrupt
 * model would otherwise grow without bound. Truncating lands the form on the
 * instance the user asked for, which is also the right answer.
 */
export function drillInto(nav: NavState, step: NavStep): NavState {
    const at = nav.path.findIndex(s => s.id === step.id);
    if (at >= 0) return { path: nav.path.slice(0, at + 1) };
    return { path: [...nav.path, step] };
}

/** Click on a breadcrumb segment: keep the road up to `depth`, drop the rest.
 *  A truncation and not a pop, so segment 0 from depth 4 is one operation. Out of
 *  range values clamp instead of throwing — a stale click on a breadcrumb that
 *  has since shortened is a race, not a bug to crash on. */
export function truncateTo(nav: NavState, depth: number): NavState {
    if (nav.path.length === 0) return nav;
    const d = Math.min(Math.max(0, depth), nav.path.length - 1);
    return { path: nav.path.slice(0, d + 1) };
}

/** Up one level. At the root it is a no-op, not an empty path: a form always has
 *  a subject. */
export function drillOut(nav: NavState): NavState {
    return nav.path.length <= 1 ? nav : { path: nav.path.slice(0, -1) };
}

/** The breadcrumb, every segment but the last clickable. */
export function breadcrumbOf(nav: NavState): Crumb[] {
    const last = nav.path.length - 1;
    return nav.path.map((s, i) => ({ ...s, depth: i, isCurrent: i === last }));
}

/** The segment label the design prints: «p2: Port» — the instance's name, then
 *  its metaclass. An unnamed instance shows its metaclass alone rather than an
 *  empty prefix and a stray colon. */
export function crumbLabel(step: NavStep): string {
    const name = (step.name ?? '').trim();
    return name ? `${name}: ${step.cls}` : step.cls;
}
