/**
 * generatorTabs — the generator tab's rules that hold no React (slice G3, P-2026-10-24-0003; R-GEN-35, R-GEN-36,
 * R-GEN-40, R-GEN-41).
 *
 * - The dock tab id of a generator: `codegen_tpl_<metamodelId>` for the default, as the Template Editor's tab was, so
 *   an open tab and the opener keep working; `codegen_tpl_<metamodelId>_<generatorId>` for the others.
 * - The generator the pill opens: the one last used on that metamodel while it exists, else the default. The memory
 *   is this module's, per session, never persisted.
 * - A Save of one generator's templates: one patch through `generatorsPatch` (G1), the other generators as stored; its
 *   root and files follow the renames and deletes of its templates (P-2026-10-31-1342).
 * - Check is offered only on a generator whose target is `js` (R-GEN-35).
 * - Run likewise: it calls `main()` of the generator's `js` file; a `none` target produces text, not a program (R-GEN-35).
 * - «Go to template»: the template a fragment names, while the list holds it.
 * - A generator with no template is empty, not wrong: nothing is generated (P-2026-10-24-0318).
 * - The Properties/Tree rail collapses when an opened generator tab sits beside the canvas, and comes back as it was
 *   when none does; a reopen by the user is kept (P-2026-10-25-0925).
 * - A generator tab is in its own dock group, so its tab bar shows; a new one goes beside a canvas of the metamodel, else
 *   beside the canvas the first panel shows (P-2026-10-25-1045); with no canvas docked it joins the first panel, listed
 *   in the app bar beside the project and model tabs (P-2026-10-25-1200).
 * - A hovered fragment longer than three lines highlights the hovered line only, its extent a gutter bar (P-2026-10-25-1045).
 *
 * Pure but for the session memory: no React, no store.
 */

import { DEFAULT_GENERATOR_ID, generatorsPatch } from '../engine/generatorCodec';
import type { GeneratorRecord, GeneratorTarget } from '../engine/generatorCodec';
import type { TemplateRecord } from '../engine/templates';
import type { TemplateTarget } from './codeOrigins';

/**
 * The dock group of a generator tab (P-2026-10-25-1045). Not `models`: the app bar hides the tab bar of every `models`
 * panel (navbar.scss) and lists only the tabs it resolves, so a generator tab there had no header at all. Beside the
 * canvas the app bar lists it too and its panel's bar is hidden in turn, the group scoping that rule and the divider's
 * (TemplateEditorTab.scss, P-2026-10-25-1510).
 */
export const GENERATOR_GROUP = 'codegen';

/**
 * The docked tab a new generator tab of `metamodelId` goes beside: the model asked for, else the metamodel, else a
 * docked model conforming to it, else the canvas the first panel shows (P-2026-10-25-1045). `null` when no canvas is
 * docked: the tab then joins the first panel and the app bar lists it, as it lists the model tabs (P-2026-10-25-1200).
 */
export function besideTarget(
    metamodelId: string,
    model: string | undefined,
    docked: readonly string[],
    shownFirst: string | undefined,
    lookup: Readonly<Record<string, any>>,
): string | null {
    if (model !== undefined && docked.includes(model)) return model;
    if (docked.includes(metamodelId)) return metamodelId;
    const conforming = docked.find(id => lookup[id]?.className === 'DModel' && lookup[id].instanceof === metamodelId);
    if (conforming !== undefined) return conforming;
    return shownFirst !== undefined && lookup[shownFirst]?.className === 'DModel' ? shownFirst : null;
}

/**
 * What a generator tab carries for the app bar (P-2026-10-25-1200), which is eager and imports no generator module:
 * its title, `<generator> · <metamodel>`, `null` once the metamodel or the generator is gone, and its close, which
 * asks before dropping unsaved drafts as the title's close does.
 */
export interface AppBarTabHooks {
    readonly appBarTitle: () => string | null;
    readonly requestClose: () => void;
}

/** The app-bar title of a generator tab: `<generator> · <metamodel>`, `null` when either is gone. */
export function generatorTabTitle(metamodelName: string | null, generators: readonly { readonly id: string; readonly name: string }[], generatorId: string): string | null {
    const generator = generators.find(g => g.id === generatorId);
    return metamodelName === null || !generator ? null : `${generator.name} · ${metamodelName}`;
}

/** The dock tab id of a generator of a metamodel. */
export function generatorTabId(metamodelId: string, generatorId: string = DEFAULT_GENERATOR_ID): string {
    return generatorId === DEFAULT_GENERATOR_ID ? `codegen_tpl_${metamodelId}` : `codegen_tpl_${metamodelId}_${generatorId}`;
}

const lastUsed = new Map<string, string>();

/** Records the generator a tab of the metamodel was last shown on. */
export function rememberGenerator(metamodelId: string, generatorId: string): void {
    lastUsed.set(metamodelId, generatorId);
}

/** Forgets every generator remembered (tests). */
export function forgetGenerators(): void {
    lastUsed.clear();
}

/** The generator the pill opens: the last used on the metamodel while listed, else the default. */
export function launchGenerator(metamodelId: string, generators: readonly { readonly id: string }[]): string {
    const last = lastUsed.get(metamodelId);
    return last !== undefined && generators.some(g => g.id === last) ? last : DEFAULT_GENERATOR_ID;
}

/** The root a generator reads when it declares none (R-GEN-33, as the codec's own): `main`, else the first template. */
const fallbackRootOf = (templates: readonly TemplateRecord[]): string | undefined => (templates.find(t => t.name === 'main') ?? templates[0])?.name;

/**
 * The generator `g` over its next template list (P-2026-10-31-1342): its root and its files' entries follow the
 * renames (`renames`, old name to new); then a root that names no template of `next` becomes the codec's fallback
 * root, and a file entry that names none becomes the root. A list with no template keeps root and files as they are.
 */
export function retargetGenerator(
    g: GeneratorRecord, next: readonly TemplateRecord[], renames: Readonly<Record<string, string>> = {},
): GeneratorRecord {
    if (next.length === 0) return { ...g, templates: next };
    const names = new Set(next.map(t => t.name));
    const follow = (name: string) => (Object.prototype.hasOwnProperty.call(renames, name) ? renames[name] : name);
    const followed = g.root !== undefined ? follow(g.root) : undefined;
    const root = followed !== undefined && names.has(followed) ? followed : fallbackRootOf(next)!;
    const files = g.files.map(f => {
        const entry = follow(f.entry);
        return { path: f.path, entry: names.has(entry) ? entry : root };
    });
    return { ...g, root, files, templates: next };
}

/**
 * What a Save of the generator `generatorId` writes: the decoded `generators` with that one's templates replaced,
 * through `generatorsPatch`; `null` when nothing changes or the generator is gone. The root and the files follow the
 * list (`retargetGenerator`, `renames` from the drafts), but for a default with no `genGenerators`: its metadata is
 * not stored, and resolves anew from the list.
 */
export function saveGeneratorTemplates(
    rawTemplates: string | null | undefined,
    rawGenerators: string | null | undefined,
    generators: readonly GeneratorRecord[],
    generatorId: string,
    next: readonly TemplateRecord[],
    renames: Readonly<Record<string, string>> = {},
): Record<string, string> | null {
    if (!generators.some(g => g.id === generatorId)) return null;
    const derived = generatorId === DEFAULT_GENERATOR_ID && (rawGenerators === undefined || rawGenerators === null);
    return generatorsPatch(rawTemplates, rawGenerators, generators.map(g => (
        g.id !== generatorId ? g : derived ? { ...g, templates: next } : retargetGenerator(g, next, renames)
    )));
}

/**
 * The name of a new template (P-2026-10-31-1342): `template<n>`, `n` one past the number of templates the tab lists
 * (the stored ones and the drafts whose template is gone), skipping a name a template or a draft holds. A draft that
 * renames its template counts once, so the names run template1, template2, ... with no gap.
 */
export function freshTemplateName(stored: readonly string[], drafts: Readonly<Record<string, { readonly name: string }>>): string {
    const listed = new Set([...stored, ...Object.keys(drafts)]);
    const taken = new Set([...listed, ...Object.values(drafts).map(d => d.name.trim())]);
    let n = listed.size + 1;
    while (taken.has(`template${n}`)) n++;
    return `template${n}`;
}

/** What Export asks first while the tab holds unsaved drafts (P-2026-10-31-1342); `null` with none: export at once. */
export function exportDraftsQuestion(dirty: number): string | null {
    if (dirty <= 0) return null;
    return `${dirty} template${dirty === 1 ? ' has' : 's have'} unsaved changes. The export holds the saved templates only.`;
}

/**
 * Why the tab's right pane generates nothing (P-2026-10-31-1342): the metamodel is gone, or the generator is; `null`
 * while both exist. The default generator of a gone metamodel still decodes, so `exists` is checked first.
 */
export function previewOffReason(exists: boolean, generator: unknown): string | null {
    if (!exists) return 'This metamodel is gone: nothing is generated.';
    if (!generator) return 'This generator is gone: nothing is generated.';
    return null;
}

/** The selector's entry of a gone generator: its last known name, else its id. */
export function goneGeneratorLabel(generatorId: string, knownName: string | null | undefined): string {
    return `${knownName || generatorId} (gone)`;
}

/** Check is offered only on a generator whose target is `js` (R-GEN-35). */
export function checkOffered(target: GeneratorTarget): boolean {
    return target === 'js';
}

/** Run is offered only on a generator whose target is `js`: it calls `main()` of its `js` file (R-GEN-35). */
export function runOffered(target: GeneratorTarget): boolean {
    return target === 'js';
}

/** A generator with no template yet: its pane shows the empty state, not an error (P-2026-10-24-0318). */
export function noTemplates(generator: { readonly templates: readonly unknown[] }): boolean {
    return generator.templates.length === 0;
}

/**
 * The pane's generation: `generate()` run on a generator with templates, `null` with none and nothing run. A missing
 * root over a non-empty list still runs, and reports its error.
 */
export function paneGeneration<T>(generator: { readonly templates: readonly unknown[] }, generate: () => T): T | null {
    return noTemplates(generator) ? null : generate();
}

/** The template «go to template» selects: the one the fragment names, while listed; `null` otherwise. */
export function templateToSelect(names: readonly string[], target: TemplateTarget | null): string | null {
    return target !== null && names.includes(target.template) ? target.template : null;
}

// ── The hover of a fragment in the generated text (P-2026-10-25-1045) ────────

/** The most lines a fragment spans and still highlights whole; a longer one highlights the hovered line only. */
export const FRAGMENT_WHOLE_LINES = 3;

/** The first and last line (1-based) a fragment writes text on. */
export interface FragmentExtent { readonly first: number; readonly last: number }

/** Every fragment's extent over the map's entries that write text (a zero-width entry writes nothing, codeLines.ts). */
export function fragmentExtents<F>(map: readonly { readonly fragment: F; readonly line: number; readonly start: number; readonly end: number }[]): Map<F, FragmentExtent> {
    const extents = new Map<F, FragmentExtent>();
    for (const e of map) {
        if (e.end <= e.start) continue;
        const x = extents.get(e.fragment);
        extents.set(e.fragment, x ? { first: Math.min(x.first, e.line), last: Math.max(x.last, e.line) } : { first: e.line, last: e.line });
    }
    return extents;
}

/**
 * What a hover on line `hoveredLine` of a fragment of extent `extent` highlights: the whole fragment when it spans at
 * most `FRAGMENT_WHOLE_LINES` lines, no bar; else that line only, and the extent as a bar in the gutter.
 */
export function hoverScope(extent: FragmentExtent | undefined, hoveredLine: number): { readonly lines: FragmentExtent; readonly bar: FragmentExtent | null } {
    if (!extent || extent.last - extent.first + 1 <= FRAGMENT_WHOLE_LINES) return { lines: extent ?? { first: hoveredLine, last: hoveredLine }, bar: null };
    return { lines: { first: hoveredLine, last: hoveredLine }, bar: extent };
}

// ── The rail beside a generator tab (P-2026-10-25-0925) ───────────────────────

/** A dock tab id of a generator, of any metamodel (`generatorTabId`). */
export function isGeneratorTabId(id: string): boolean {
    return id.startsWith('codegen_tpl_');
}

interface PanelShape { readonly tabs: readonly { readonly id?: string }[]; readonly activeId?: string }
interface BoxShape { readonly children?: readonly (BoxShape | PanelShape)[] }

/**
 * Whether a generator tab is on screen beside the canvas: it is the tab its dock panel shows, and another panel of
 * the dock box holds a tab that is not a generator's, the canvas's panel, its canvas in front or behind a generator
 * stacked on it. A generator tab moved into the canvas's panel is not beside it.
 */
export function generatorBeside(layout: { readonly dockbox?: BoxShape | PanelShape } | null | undefined): boolean {
    const panels: PanelShape[] = [];
    const walk = (node: BoxShape | PanelShape | undefined): void => {
        if (!node) return;
        if ('tabs' in node) panels.push(node);
        else (node.children ?? []).forEach(walk);
    };
    walk(layout?.dockbox);
    const holdsOther = (p: PanelShape) => p.tabs.some(t => t.id !== undefined && !isGeneratorTabId(t.id));
    return panels.some(p => {
        const shown = p.activeId ?? p.tabs[0]?.id;
        return shown !== undefined && isGeneratorTabId(shown) && panels.some(q => q !== p && holdsOther(q));
    });
}

/** The two zones of the Properties/Tree rail, true when shown. */
export interface RailZones { readonly tree: boolean; readonly inspector: boolean }

/** What the rail does: collapse as its own control collapses it, or come back to the zones it had. */
export type RailStep = { readonly kind: 'collapse' } | { readonly kind: 'restore'; readonly zones: RailZones } | null;

// Session memory, never persisted: an opening waiting to collapse the rail, and the zones the auto-collapse hid.
let railArmed = false;
let railBefore: RailZones | null = null;

/** An opening of a generator tab: the next time one is beside the canvas, the rail collapses. */
export function armRailCollapse(): void {
    railArmed = true;
}

/**
 * The rail's step for the dock as it is now. Beside the canvas after an opening: collapse, remembering the zones, when
 * the rail shows. No generator tab beside after an auto-collapse: restore the zones remembered. Otherwise nothing; an
 * opening not beside stays armed until one is.
 */
export function railStep(beside: boolean, rail: RailZones): RailStep {
    if (beside) {
        if (!railArmed) return null;
        railArmed = false;
        if (!rail.tree && !rail.inspector) return null;
        railBefore = rail;
        return { kind: 'collapse' };
    }
    if (railBefore === null) return null;
    const zones = railBefore;
    railBefore = null;
    return { kind: 'restore', zones };
}

/** The rail is on screen: when the auto-collapse hid it, the user reopened it, and it stays as they leave it. */
export function railShown(): void {
    railBefore = null;
}

/** Forgets the rail's memory (tests, and the last generator tab gone). */
export function forgetRail(): void {
    railArmed = false;
    railBefore = null;
}
