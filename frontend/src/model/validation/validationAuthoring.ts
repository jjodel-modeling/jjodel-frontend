/**
 * Le scritture dell'authoring delle regole (R-VAL, Step 4).
 *
 * Creare, modificare, cancellare. Nient'altro: la classificazione fra proprie ed
 * ereditate sta in `validationRuleSets.ts`, che e' puro e quindi provabile; la lettura
 * delle regole sta in `validationContext.ts`; la valutazione in `validationEvaluator.ts`.
 * Qui ci sono solo le tre scritture, ed e' l'unico posto della corsia che ne fa.
 *
 * ── LE REGOLE DI §3.3, APPLICATE ────────────────────────────────────────────
 *
 * `DValidationRule.new` apre una TRANSACTION propria: **non si avvolge**, e infatti
 * `createRule` la chiama nuda. La cancellazione invece e' una TRANSACTION di sole azioni
 * — `SetFieldAction` piu' `DeleteElementAction`, nessun creatore — che CLAUDE.md §3.3
 * dichiara sicura, e serve che lo sia: togliere la regola dalla collezione e cancellarla
 * sono due meta' della stessa cosa, e una senza l'altra lascia un puntatore a un oggetto
 * che non c'e' piu' oppure un oggetto che nessuno raggiunge.
 *
 * ── COSA NON FA ────────────────────────────────────────────────────────────
 *
 * Non impedisce niente. Un nome duplicato, un corpo che non compila, un messaggio vuoto:
 * si scrivono e basta. R-VAL-4 vieta di bloccare una scrittura, e il controllo statico
 * dei nomi in authoring — che segnalerebbe il refuso e il nome riservato — e' fetta 1,
 * dichiarato fuori dallo scheletro.
 */

import { DeleteElementAction, SetFieldAction, TRANSACTION, store } from '../../joiner';
import {
    DValidationRule, VALIDATION_VIEWPOINT_ID, ensureValidationViewpoint,
} from './validationTypes';
import { nextRuleName } from './validationRuleSets';

/** I nomi gia' presi nel viewpoint, per `nextRuleName`. Lettura secca di `idlookup`. */
function existingRuleNames(state?: any): string[] {
    const idlookup = (state ?? store.getState())?.idlookup ?? {};
    const vp = idlookup[VALIDATION_VIEWPOINT_ID];
    if (!vp || vp.className !== 'DValidationViewpoint') return [];
    const out: string[] = [];
    for (const rid of (vp.rules ?? [])) {
        const n = idlookup[rid]?.name;
        if (typeof n === 'string' && n) out.push(n);
    }
    return out;
}

/**
 * Crea una regola sulla classe scelta e la restituisce.
 *
 * Materializza il viewpoint se non c'e' ancora: e' la PRIMA SCRITTURA, che e' esattamente
 * il momento in cui R-DMV-6 vuole che nasca. NESSUNA TRANSACTION ESTERNA qui o attorno a
 * una chiamata a questa funzione (CLAUDE.md §3.3): sia `ensureValidationViewpoint` sia
 * `DValidationRule.new` sono creatori e aprono la propria.
 *
 * Il corpo nasce vuoto e non con un esempio: un corpo vuoto non compila, e la superficie
 * lo dichiara (spec §8.3). Un esempio precompilato che valuta `true` sarebbe invece una
 * regola che passa senza che nessuno l'abbia scritta.
 */
export function createValidationRule(contextClassId: string): DValidationRule | null {
    if (!contextClassId) return null;
    const vp = ensureValidationViewpoint();
    if (!vp) return null;
    const name = nextRuleName(existingRuleNames());
    return DValidationRule.new(vp.id, name, contextClassId as any, '', '');
}

/** I campi che l'authoring dello scheletro puo' cambiare. `context` non c'e': spostare
 *  una regola da una classe a un'altra e' un'operazione sua, e cambiarla per sbaglio
 *  mentre si scrive sarebbe la peggiore delle scorciatoie. */
export interface ValidationRulePatch {
    name?: string;
    body?: string;
    message?: string;
    enabled?: boolean;
}

/**
 * Scrive i campi cambiati, uno `SetFieldAction` ciascuno, e **solo quelli davvero
 * cambiati**: la superficie scrive alla perdita del fuoco, quindi ogni giro di tab
 * riscriverebbe altrimenti lo stesso valore, sporcando la storia dell'undo di passi che
 * non cambiano niente.
 *
 * @returns quanti campi sono stati scritti.
 */
export function updateValidationRule(ruleId: string, patch: ValidationRulePatch): number {
    if (!ruleId) return 0;
    const current = store.getState()?.idlookup?.[ruleId] as any;
    if (!current || current.className !== 'DValidationRule') return 0;
    let written = 0;
    for (const key of ['name', 'body', 'message', 'enabled'] as const) {
        const next = patch[key];
        if (next === undefined) continue;
        if (current[key] === next) continue;
        // `ruleId as any` sul primo argomento: la firma inferisce `keyof D` da li', e con
        // un id nudo `D` collassa su `DPointerTargetable`, che non ha `body` ne' `message`.
        // E' lo stesso gesto di `DValidationRule.new` sulla collezione del viewpoint.
        SetFieldAction.new(ruleId as any, key, next as any, '', false);
        written++;
    }
    return written;
}

/**
 * Cancella una regola: la toglie dalla collezione del viewpoint e la rimuove da
 * `idlookup`, nella stessa TRANSACTION.
 *
 * TRANSACTION di sole azioni, senza creatori: sicura per §3.3, e necessaria — le due
 * meta' non devono poter esistere separate.
 */
export function deleteValidationRule(ruleId: string): void {
    if (!ruleId) return;
    const idlookup = store.getState()?.idlookup ?? {};
    const rule = idlookup[ruleId] as any;
    if (!rule || rule.className !== 'DValidationRule') return;
    const vpId = rule.father || VALIDATION_VIEWPOINT_ID;
    TRANSACTION('delete validation rule', () => {
        SetFieldAction.new(vpId, 'rules', ruleId as any, '-=', true);
        DeleteElementAction.new(ruleId);
    });
}
