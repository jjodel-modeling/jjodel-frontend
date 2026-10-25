/**
 * generatorTabs — the generator tab's rules that hold no React (slice G3, P-2026-10-24-0003; R-GEN-35, R-GEN-36,
 * R-GEN-40, R-GEN-41).
 *
 * - The dock tab id of a generator: `codegen_tpl_<metamodelId>` for the default, as the Template Editor's tab was, so
 *   an open tab and the opener keep working; `codegen_tpl_<metamodelId>_<generatorId>` for the others.
 * - The generator the pill opens: the one last used on that metamodel while it exists, else the default. The memory
 *   is this module's, per session, never persisted.
 * - A Save of one generator's templates: one patch through `generatorsPatch` (G1), the other generators as stored.
 * - Check is offered only on a generator whose target is `js` (R-GEN-35).
 * - Run likewise: it calls `main()` of the generator's `js` file; a `none` target produces text, not a program (R-GEN-35).
 * - «Go to template»: the template a fragment names, while the list holds it.
 * - A generator with no template is empty, not wrong: nothing is generated (P-2026-10-24-0318).
 * - The Properties/Tree rail collapses when an opened generator tab sits beside the canvas, and comes back as it was
 *   when none does; a reopen by the user is kept (P-2026-10-25-0925).
 *
 * Pure but for the session memory: no React, no store.
 */

import { DEFAULT_GENERATOR_ID, generatorsPatch } from '../engine/generatorCodec';
import type { GeneratorRecord, GeneratorTarget } from '../engine/generatorCodec';
import type { TemplateRecord } from '../engine/templates';
import type { TemplateTarget } from './codeOrigins';

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

/**
 * What a Save of the generator `generatorId` writes: the decoded `generators` with that one's templates replaced,
 * through `generatorsPatch`; `null` when nothing changes or the generator is gone.
 */
export function saveGeneratorTemplates(
    rawTemplates: string | null | undefined,
    rawGenerators: string | null | undefined,
    generators: readonly GeneratorRecord[],
    generatorId: string,
    next: readonly TemplateRecord[],
): Record<string, string> | null {
    if (!generators.some(g => g.id === generatorId)) return null;
    return generatorsPatch(rawTemplates, rawGenerators, generators.map(g => (g.id === generatorId ? { ...g, templates: next } : g)));
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
