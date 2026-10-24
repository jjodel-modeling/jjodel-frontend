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
