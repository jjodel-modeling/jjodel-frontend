/**
 * RowViewSmoke — the visual smoke fixture for the Row view library.
 *
 * Dev-only. Builds a project holding one metamodel and one model, shaped so a
 * SINGLE instance node shows all nine renderers at once, and opens the canvas
 * on it. The acceptance criteria of
 * `docs/design/design_handoff_instance_node/PROMPT_row_view_library.md` are
 * things you look at; this is the thing to look at them on.
 *
 * ── The creation path ───────────────────────────────────────────────────────
 *
 * Deliberately the same one the app uses, not a shortcut into Redux: the whole
 * point of a smoke fixture is that it exercises what a real model exercises.
 * It follows `createM2` / `createM1` (`pages/components/Navbar.tsx:70`, `:94`)
 * rather than the older `examples/StateMachine`, on two counts:
 *
 *   - no outer TRANSACTION around the creators. `DModel.new` and `DVertex.new`
 *     each open one of their own, and nesting them drops writes (CLAUDE.md
 *     §3.3). `StateMachine.loadM2` wraps them; `createM2`, the path a user
 *     actually takes, does not.
 *   - the M1 is created strictly AFTER the M2 is complete, which is what lets
 *     the singleton persist callback see the singleton classes — see below.
 *
 * ── Idempotence ────────────────────────────────────────────────────────────
 *
 * The project carries a FIXED id, and a re-run deletes the previous one before
 * building. Re-running replaces; it never accumulates a second copy. The fixed
 * id is also what makes the URL stable enough to bookmark.
 */

import {
    DModel,
    DObject,
    DProject,
    LClass,
    LModel,
    LObject,
    LPackage,
    LProject,
    LUser,
    SetFieldAction,
    store,
} from '../../joiner';
import DockManager from '../../components/abstract/DockManager';
import { ProjectsApi } from '../../api/persistance';
import { declareRowViewAnnotation } from '../../components/editor-v2/nodes/rowViewAnnotationsWrite';

/** Fixed, so the URL is stable and a re-run can find what to replace. */
export const SMOKE_PROJECT_ID = 'Pointer_RowViewSmokeProject';

/** The 7 values of `tags`: four chips, then `+3`, with `[7]` on the label. */
const TAGS = ['draft', 'review', 'urgent', 'v2', 'legacy', 'blocked', 'wip'];

const LONG_TEXT =
    'Rendered as a rounded rectangle with a hairline border and a header band that '
    + 'carries the instance name, the type, and nothing else worth the width';

/** What the fixture found while building. Returned so the caller can report it. */
export interface SmokeReport {
    projectId: string;
    url: string;
    /** Singleton instances the DModel persist callback created on its own. */
    autoSingletons: string[];
    /** Non-fatal observations worth reporting rather than working around. */
    findings: string[];
}

function buildMetamodel(project: LProject): {
    m2: LModel; allNine: LClass; config: LClass; attrIds: Map<string, string>; findings: string[];
} {
    const findings: string[] = [];

    // `createM2` without the DockManager.open2 and the activity log: the model
    // is opened at the end, once, on the M1.
    const dModel = DModel.new('Smoke', undefined, true);
    const m2: LModel = LModel.fromD(dModel);
    project.metamodels = [...project.metamodels, m2];
    project.graphs = [...project.graphs, m2.node as any];

    const pkg: LPackage = LPackage.fromD(m2.addChild('package'));
    pkg.name = 'default';

    // ── Enumerations ──
    //
    // `Palette` exists to make rung 3 of the colour ladder fire on evidence
    // rather than on the attribute's name: EVERY literal is a CSS colour, which
    // is the test that makes the rule safe. `Stroke` is the control — same
    // shape, literals that are not colours, so it must come out as an enumChip.
    const palette = pkg.addEnumerator('Palette');
    palette.addLiteral('Red', 0);
    palette.addLiteral('Green', 1);
    palette.addLiteral('Blue', 2);

    const stroke = pkg.addEnumerator('Stroke');
    stroke.addLiteral('SOLID', 0);
    stroke.addLiteral('DASHED', 1);
    stroke.addLiteral('DOTTED', 2);

    // ── Config, the reference target ──
    const config: LClass = LClass.fromD(pkg.addClass('Config'));
    config.addAttribute('name', 'Pointer_ESTRING');

    // ── The singleton colour set ──
    //
    // `Color` abstract with `Red`/`Green`/`Blue` as singleton subclasses is the
    // OTHER way a metamodel can express a closed set of colours — the one an
    // EEnum does not cover. It exercises `readSiblingSubclassNames`, so the pill
    // on the canvas gets its swatch from the same rung 3 the row does.
    const color: LClass = LClass.fromD(pkg.addClass('Color'));
    color.abstract = true;
    for (const name of ['Red', 'Green', 'Blue']) {
        const sub: LClass = LClass.fromD(pkg.addClass(name));
        sub.extends = [color];
        sub.isSingleton = true;
    }

    // ── AllNine: one attribute per renderer, in the order the rows will read ──
    const allNine: LClass = LClass.fromD(pkg.addClass('AllNine'));

    // By id, which is what the signature asks for. Until 2026-08-30 these three had
    // to pass the PROXY instead, with a cast: `Constructors.DTypedElement` honoured
    // only a canonical primitive pointer and an object, and silently downgraded an
    // id — `palette.id` left tint on `Pointer_ESTRING`, so the colour ladder never
    // reached rung 3 and `Stroke`, this fixture's control, was not a control at all;
    // `config.id` gave cfg the id of AllNine, its own father. The constructor now
    // resolves ids and names too, so the fixture states the type the plain way and
    // is a caller of the fixed path rather than a way around it.
    const tint = allNine.addAttribute('tint', palette.id);              // swatch
    const strokeAttr = allNine.addAttribute('stroke', stroke.id);       // enumChip
    const cfg = allNine.addReference('cfg', config.id);                 // refPill
    const visible = allNine.addAttribute('visible', 'Pointer_EBOOLEAN');// boolean, true
    const locked = allNine.addAttribute('locked', 'Pointer_EBOOLEAN');  // boolean, false
    const widthPx = allNine.addAttribute('widthPx', 'Pointer_EINT');
    // The point-3 control. Named after a unit on purpose: with no annotation it
    // must print no unit, or the handoff's rule is not actually implemented.
    const plainCount = allNine.addAttribute('plainCount', 'Pointer_EINT');
    const created = allNine.addAttribute('created', 'Pointer_EDATE');   // date
    const description = allNine.addAttribute('description', 'Pointer_ESTRING');
    const ratio = allNine.addAttribute('ratio', 'Pointer_EFLOAT');
    const guard = allNine.addAttribute('guard', 'Pointer_ESTRING');
    const notes = allNine.addAttribute('notes', 'Pointer_ESTRING');     // dash, left empty
    const tags = allNine.addAttribute('tags', 'Pointer_ESTRING');
    tags.upperBound = -1;                                         // collection

    // ── The metamodel declarations ──
    //
    // Bare calls, never inside a TRANSACTION: `DAnnotation.new` is a creator
    // (CLAUDE.md §3.3). These are the ONLY source for a unit, a pair of bounds
    // and the mono treatment — the fixture would be lying about the acceptance
    // criteria if it set them any other way.
    declareRowViewAnnotation(widthPx.id, 'unit', 'px');
    declareRowViewAnnotation(ratio.id, 'min', 0);
    declareRowViewAnnotation(ratio.id, 'max', 1);
    declareRowViewAnnotation(guard.id, 'renderer', 'code');

    // Captured now, while the returned proxies are in hand: `allNine.attributes`
    // reads 0 at this instant and only fills in later (measured below), so the
    // ids cannot be recovered from the class afterwards without another wait.
    const attrIds = new Map<string, string>();
    for (const [name, l] of ([
        ['tint', tint], ['stroke', strokeAttr], ['cfg', cfg], ['visible', visible],
        ['locked', locked], ['widthPx', widthPx], ['plainCount', plainCount],
        ['created', created], ['description', description], ['ratio', ratio],
        ['guard', guard], ['notes', notes], ['tags', tags],
    ] as Array<[string, any]>)) attrIds.set(name, l.id);

    return { m2, allNine, config, attrIds, findings };
}

/**
 * Create one instance of `klass`, named.
 *
 * `addObject`'s first argument is a MATCHING SCHEMA, not a bag of initial
 * values: it is fed to `getInstantiableClasses` to pick the tightest-fitting
 * subclass, and a schema naming a feature the class does not declare matches
 * nothing and returns null. Measured 2026-08-28 — `{name: 'Config_main'}`
 * produced «addObject(schema) could not find a valid subtype ... conforming to
 * that schema» and an undefined object.
 *
 * So the schema is empty and `forceCreation` is true, which is the same
 * argument the singleton persist callback passes (`joiner/classes.ts:942`) and
 * bypasses the match entirely. The name is then a normal `set_name` write.
 */
function newInstance(m1: LModel, klass: LClass, name: string): LObject {
    const o: LObject = LObject.fromD(m1.addObject({}, klass.id, true));
    o.name = name;
    return o;
}

/**
 * ── Why this is two-phase, and why that is the real path and not a workaround
 *
 * Measured 2026-08-28, in this order, each fixing the previous:
 *
 *   1. `addObject({name}, classId)` → «could not find a valid subtype
 *      conforming to that schema». The first argument is a MATCHING SCHEMA fed
 *      to `getInstantiableClasses`, not a bag of initial values.
 *   2. `addObject({}, classId, true)` creates the object, but `o.features` is
 *      `0` on the very next line and `o.name = x` does not stick either — the
 *      object still reads `AllNine_0`.
 *
 * (2) is the propagation lag CLAUDE.md §9.2 documents, and §9.1/§9.2 also give
 * the protocol for it: create with `DObject.new(classId, modelId, DModel, name)`
 * — which takes the name as a constructor argument, so it lands — accumulate
 * the wanted values BY NAME, and set them after Redux has propagated, resolving
 * each object through `lModel.objects.find(o => o.name === …)`.
 *
 * So the fixture follows the documented creation protocol rather than reaching
 * past it: no `SetFieldAction` onto `DValue.values`, no hand-built slots. The
 * lag is reported in the returned `findings` rather than hidden.
 */

interface PendingObject {
    name: string;
    single: Array<[string, string]>;
    many: Array<[string, string[]]>;
    /** Reference slots, by TARGET NAME — ids are not stable across the lag. */
    refs: Array<[string, string[]]>;
}

function applyPending(
    byName: Map<string, LObject>,
    attrIds: Map<string, string>,
    pending: PendingObject[],
    findings: string[],
): void {
    const write = (o: LObject, attr: string, values: unknown[], p: PendingObject): void => {
        const featureId = attrIds.get(attr);
        if (!featureId) { findings.push(`metamodel feature "${attr}" has no id`); return; }

        // Write into the slot that ALREADY EXISTS. Measured 2026-08-28: an
        // object created with its metaclass ends up with one slot per feature —
        // conformity does run, it is simply not visible on the synchronous read
        // that first suggested otherwise. Calling `addValue` here as well gave
        // the object 25 slots for 13 features, and ObjectNode dutifully rendered
        // both sets: the duplicate rows were this fixture's doing, not the
        // node's. The node's matching was verified correct at the same time —
        // first class attribute id and first covered id identical character for
        // character, zero attributes unmatched.
        for (const f of (o.features ?? []) as any[]) {
            let fInst: unknown;
            try { fInst = f?.__raw?.instanceof ?? f?.instanceof?.id; } catch { continue; }
            if (fInst !== featureId) continue;
            try { f.values = values; } catch (e) { findings.push(`could not write "${attr}" on ${p.name}: ${e}`); }
            return;
        }

        // No slot for a declared feature: report it rather than papering over
        // it with a second one, which is what produced the duplicates.
        findings.push(`no slot for "${attr}" on ${p.name}; value not written`);
    };

    for (const p of pending) {
        const o = byName.get(p.name);
        if (!o) { findings.push(`instance "${p.name}" never resolved by name after propagation`); continue; }
        for (const [attr, v] of p.single) write(o, attr, [v], p);
        for (const [attr, vs] of p.many) write(o, attr, vs, p);
        for (const [attr, targets] of p.refs) {
            write(o, attr, targets.map(t => byName.get(t)?.id).filter(Boolean), p);
        }
    }
}

const valuedInstance = (name: string, cfgTarget: string): PendingObject => ({
    name,
    single: [
        ['tint', 'Green'],
        ['stroke', 'DASHED'],
        ['visible', 'true'],
        ['locked', 'false'],
        ['widthPx', '240'],
        ['plainCount', '17'],
        ['created', '2026-08-28'],
        ['description', LONG_TEXT],
        ['ratio', '0.68'],
        ['guard', 'self.width > 0'],
        // `notes` is deliberately never written: it is the dash.
    ],
    many: [['tags', TAGS]],
    refs: [['cfg', [cfgTarget]]],
});

export function loadRowViewSmoke(): Promise<SmokeReport> {
    const findings: string[] = [];
    const user = LUser.getUser();

    // ── Idempotence: replace, never duplicate ──
    const existing = store.getState()?.idlookup?.[SMOKE_PROJECT_ID];
    if (existing) (LProject.fromPointer(SMOKE_PROJECT_ID) as LProject)?.delete();

    const dProject = DProject.new(
        'private', 'Row view smoke', undefined, undefined, undefined, SMOKE_PROJECT_ID,
    );
    const project: LProject = LProject.fromD(dProject);
    user.project = project;

    const { m2, allNine, config, attrIds, findings: mmFindings } = buildMetamodel(project);
    findings.push(...mmFindings);

    // What the metamodel actually holds the instant after it is written. The
    // M1's conformity reads exactly this, so if it is empty here nothing
    // downstream can produce a slot.
    const attrsAtOnce = ((allNine.attributes ?? []) as any[]).length;

    return new Promise<SmokeReport>((resolve) => setTimeout(() => {
    const attrsAfterGap = ((allNine.attributes ?? []) as any[]).length;
    findings.push(`AllNine.attributes: ${attrsAtOnce} synchronously, ${attrsAfterGap} after a propagation gap`);

    // ── The model, created only now ──
    //
    // Order is load-bearing. `DModel.new`'s persist callback walks the
    // metamodel's classes and creates one instance per singleton class
    // (`joiner/classes.ts:937-944`); a model created before those classes exist
    // would silently get none of them. It is also the exact spot §3.6 warns
    // about — `lmodel.classes` is a forward-link collection — so what the
    // callback actually produced is measured below rather than assumed.
    const dM1: DModel = DModel.new('smoke_model', m2.id, false, true);
    const m1: LModel = LModel.fromD(dM1);
    project.models = [...project.models, m1];
    project.graphs = [...project.graphs, m1.node as any];

    // ── Instances ──
    //
    // Created with their metaclass, then RE-BOUND to it in phase 2. That second
    // write is not redundant: it is the only thing that produces slots.
    // Measured 2026-08-28, four ways:
    //
    //   - `DObject.new(classId, …)` → object exists, `features` empty;
    //   - `addObject({name}, classId)` → rejected, the first argument is a
    //     matching schema and `{name}` conforms to nothing;
    //   - `addObject({}, classId, true)` → object exists, `features` STILL
    //     empty 1.2s later;
    //   - `addObject({}, undefined)` → rejected outright, an empty schema
    //     conforms to no type.
    //
    // In all three the metaclass reaches the object through `setPtr` on the
    // constructor chain, which never calls `_forceConformity`. Only the setter
    // `LObject.set_instanceof` does (`LModelElement.tsx:6448`), and that is what
    // the palette goes through when a class is dropped on the canvas. So the
    // fixture goes through it too.
    const order: Array<{ klass: LClass; name: string }> = [
        { klass: config, name: 'Config_main' },
        { klass: config, name: 'Config_old' },
        { klass: allNine, name: 'allNine_valued' },
        { klass: allNine, name: 'allNine_broken' },
    ];
    const createdIds: string[] = [];
    for (const { klass } of order) {
        const d: any = m1.addObject({}, klass.id, true);
        createdIds.push(typeof d === 'string' ? d : d?.id);
    }

    const pending: PendingObject[] = [
        valuedInstance('allNine_valued', 'Config_main'),
        valuedInstance('allNine_broken', 'Config_old'),
    ];

    {
        setTimeout(() => {
            // Phase 2: name, and bind the metaclass. The binding is what
            // creates the slots, so nothing may be written until it has run and
            // propagated in turn — hence the third phase below.
            for (let i = 0; i < order.length; i++) {
                const id = createdIds[i];
                const o = id ? (LObject.fromPointer(id) as LObject) : null;
                if (!o) { findings.push(`instance ${order[i].name} (${id}) did not resolve after propagation`); continue; }
                try { o.name = order[i].name; } catch { findings.push(`could not rename ${id} to ${order[i].name}`); }
                // The metaclass is NOT re-bound here. An earlier attempt cleared
                // `instanceof` and set it again, to make `_forceConformity` run:
                // the clear took, the re-set did not, and both instances came
                // out reading `allNine_broken : Orphan` on the canvas. The slots
                // are created explicitly by `addValue` below, so conformity is
                // not needed and the metaclass set at creation is left alone.
            }

            setTimeout(() => {
            // Addressed by the ids captured at creation, NOT by `m1.objects`.
            // Measured 2026-08-28: every instance resolves through
            // `LObject.fromPointer(id)` while `m1.objects` still does not list
            // it — the same §3.6 forward-link staleness, one collection over.
            const byName = new Map<string, LObject>();
            for (let i = 0; i < order.length; i++) {
                const id = createdIds[i];
                const o = id ? (LObject.fromPointer(id) as LObject) : null;
                if (o) byName.set(order[i].name, o);
            }
            if (((m1.objects ?? []) as LObject[]).length < order.length) {
                findings.push(
                    `m1.objects lists ${((m1.objects ?? []) as LObject[]).length} of ${order.length} `
                    + 'instances after propagation; the fixture addresses them by the ids captured at '
                    + 'creation instead (§3.6, forward-link collection).',
                );
            }

            applyPending(byName, attrIds, pending, findings);

            // What the persist callback managed on its own, measured after the
            // same propagation the slots needed.
            const autoSingletons = ((m1.objects ?? []) as LObject[])
                .filter(o => ['Red', 'Green', 'Blue'].includes(o?.name))
                .map((o: LObject) => o.name);
            if (autoSingletons.length === 0) {
                findings.push(
                    'The DModel persist callback created NO singleton instances for Red/Green/Blue. '
                    + 'It iterates `lmodel.classes` (joiner/classes.ts:940); those classes live in a '
                    + 'package, and a model-level forward-link collection does not reach them — the '
                    + '§3.6 staleness, in the one place that decides whether a singleton exists.',
                );
            }

            // ── Two defects this fixture currently exhibits, recorded here
            //    rather than papered over. Both are about the app, not the
            //    fixture, and both are what a smoke fixture is FOR.
            //
            // (1) Every attribute renders TWICE: once as the slot created
            //     below, once as a lazy co-evolution placeholder with a dash.
            //     `ObjectNode.liveFeatureNameSig` builds `coveredAttrIds` from
            //     `data.features`, and a slot created through `addValue` is not
            //     landing in it — measured 51 rows across 6 nodes where 25 are
            //     expected, and `DValue.instanceof` verified to be a plain
            //     string, so the string/array guard is NOT the cause.
            //
            // (2) The broken reference renders as a dash, not as `brokenRef`.
            //     Deleting `Config_old` leaves the `cfg` row empty rather than
            //     dangling, so either the cascade scrubs the referring slot
            //     after all, or the value never carried a resolvable pointer.
            //     `brokenRefMemory` and the `brokenRef` renderer are therefore
            //     NOT exercised by this fixture yet.
            // ── Open the canvas BEFORE breaking anything ──
            //
            // Order matters for what the broken row can say. `brokenRefMemory`
            // learns a target's name from the D→canvas transformer, so a target
            // deleted before the canvas has ever rendered was never seen, and
            // the row falls back to the shortened pointer id — correct, but the
            // weaker half of the design. Rendering once with the target alive is
            // what lets the row strike through `Config_old` by name, which is
            // the appearance Turno 5b specifies.
            ProjectsApi.isLoading = false;
            DockManager.open2(m1 as any);

            // The delete waits for the CANVAS, not for a timer.
            //
            // `brokenRefMemory` learns a name from the D→canvas transformer, so
            // the target has to have been rendered at least once while alive or
            // the row can only fall back to the shortened pointer id. `open2`
            // does not mount the editor by itself — the model is opened when the
            // user clicks it — so a fixed delay deleted too early every time,
            // measured: the row read `Pointer178…` rather than `Config_old`.
            //
            // Polling for the first `.mm-object` ties the delete to the thing it
            // actually depends on. If the model is never opened the delete is
            // simply skipped, and the fixture says so rather than producing a
            // broken row nobody can read.
            let waited = 0;
            const CANVAS_POLL_MS = 300;
            const CANVAS_TIMEOUT_MS = 120000;
            const url = `${window.location.origin}${window.location.pathname}`
                + `#/project?id=${SMOKE_PROJECT_ID}`;

            const breakWhenRendered = () => {
                const rendered = typeof document !== 'undefined'
                    && !!document.querySelector('.mm-object');
                if (!rendered) {
                    waited += CANVAS_POLL_MS;
                    if (waited >= CANVAS_TIMEOUT_MS) {
                        findings.push('the model was never opened, so Config_old was not deleted and '
                            + 'there is no broken reference to look at');
                        resolve({ projectId: SMOKE_PROJECT_ID, url, autoSingletons, findings });
                        return;
                    }
                    setTimeout(breakWhenRendered, CANVAS_POLL_MS);
                    return;
                }
                // Deleting the target leaves the pointer dangling in the
                // referring slot: measured 2026-08-28, `DValue.values` still
                // held the id afterwards and it resolved to nothing. The reducer
                // scrubs no inbound pointer, so the evidence survives and
                // `brokenRef` has both a state to render and a name to show.
                const doomed = byName.get('Config_old');
                if (doomed) doomed.delete();
                else findings.push('Config_old not found at deletion time; no broken reference');
                resolve({ projectId: SMOKE_PROJECT_ID, url, autoSingletons, findings });
            };
            setTimeout(breakWhenRendered, CANVAS_POLL_MS);
            }, 900);
        }, 1200);
    }
    }, 1500));
}
