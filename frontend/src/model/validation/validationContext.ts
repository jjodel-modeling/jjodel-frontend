/**
 * Il ponte fra il modello vivo e il valutatore puro (R-VAL, Step 3).
 *
 * `validationEvaluator.ts` non conosce il D-layer di proposito, e non deve conoscerlo:
 * e' quello che gli permette di girare nella suite. Qualcuno pero' deve leggere il
 * modello aperto e consegnargli i dati. Quel qualcuno e' questo modulo, ed e' l'unico
 * pezzo della validazione che importa `joiner`.
 *
 * ── IL CONTESTO NON SE LO COSTRUISCE ────────────────────────────────────────
 *
 * Le istanze e le classi arrivano da `buildEvalContext`
 * (`jjscript/executor/commands/eval.ts`), lo stesso costruttore che alimentano la
 * console JjEL, il comando `eval` di JjScript e Jjodie. **Non ne esiste una seconda
 * copia, e non deve esistere**: quel modulo risolve cose che si scoprono solo
 * sbagliandole — le reference multivalore che sono sempre array, quelle singole vuote
 * che valgono `null` e non «assente», gli attributi vuoti che prendono il default
 * dichiarato, l'identita' condivisa fra `Classe.instances` e il pool globale perche'
 * `==` fra istanze funzioni. Riscriverlo qui vorrebbe dire riscoprire quella lista un
 * difetto alla volta, e con verdetti autorevoli calcolati sopra.
 *
 * Il precedente di questo riuso e' `components/Jodie/jodieJjelContext.ts`, che fa
 * esattamente la stessa cosa da fuori di JjScript: sintetizza un `ExecutionContext`
 * minimo e chiama `buildEvalContext`. Qui si copia quel gesto.
 *
 * ── IL PERIMETRO E' IL MODELLO APERTO, E ANCHE L'ESTENSIONE (R-VAL-14, R-VAL-16) ──
 *
 * Due cose diverse, e per un giorno solo sono state diverse per sbaglio.
 *
 * Le **istanze validate** sono quelle del modello aperto: la validazione dell'intero
 * progetto e' un comando a se', fuori dalla prima fetta. Questo e' sempre stato giusto.
 *
 * L'**estensione** — l'insieme che una quantificazione attraversa dentro il corpo di una
 * regola, cioe' `State.instances` — deve coincidere con lo stesso perimetro, e non lo
 * faceva. Misurato il 2026-09-09
 * (`docs/discovery/harness/probe_2026-09-09_estensione_perimetro_validato.mts`): su un
 * progetto con due macchine a stati sane, una regola di cardinalita' ne contava quattro
 * stati e dichiarava violate entrambe le macchine. La restrizione passa ora dal parametro
 * `extentModelId` di `buildEvalContext` (R-VAL-16) e non da un filtro applicato qui:
 * l'estensione ricompare in cinque posti dentro quel modulo, e un filtro a valle
 * duplicherebbe fuori una conoscenza che e' del modulo.
 *
 * Il **resto del contesto** resta di progetto — le classi del metamodello, la risoluzione
 * dei nomi — ed e' voluto: una regola deve poter nominare una classe.
 *
 * ── IL COSTO, DICHIARATO ────────────────────────────────────────────────────
 *
 * `buildEvalContext` e' O(oggetti x feature) e non ha cache: gira **una volta per
 * comando**, e il comando e' esplicito (nessun debounce, nessun `AFTER_TRANSACTION`).
 * La spec §9 chiede di misurarlo prima di renderlo automatico; finche' resta a comando
 * quella misura non e' bloccante, e il numero sta nel referto della sonda.
 */

import { buildEvalContext } from '../../jjscript';
import type { ExecutionContext } from '../../jjscript/types';
import type { JjelValue } from '../../jjel';
import {
    DUser, L, LUser, LProject, LPointerTargetable, store,
    type LClass, type LModel, type LObject,
} from '../../joiner';
import {
    evaluateValidation,
    type ValidationInput, type ValidationInstanceInput, type ValidationRuleInput,
    type ValidationReport,
} from './validationEvaluator';
import { VALIDATION_VIEWPOINT_ID } from './validationTypes';

// ============================================
// LE REGOLE
// ============================================

/**
 * Le regole del viewpoint di validazione, nella forma che il valutatore vuole.
 *
 * Lettura diretta di `idlookup` e non della proxy L: qui serve il **puntatore** di
 * `context`, e sulla proxy quel campo torna la `LClass` gia' avvolta
 * (`validationTypes.ts`, commento del campo). E' la stessa asimmetria di
 * `pkg.uri` / `pkg.__raw.uri` (CLAUDE.md §3.7), e va nella stessa direzione: per
 * confrontare identita' si usa il grezzo.
 *
 * Le regole spente NON sono filtrate qui: le porta il valutatore, che le conta e le
 * dichiara (guardia di R-VAL-5, spec §6). Filtrarle prima le renderebbe invisibili.
 */
export function collectValidationRules(state?: any): ValidationRuleInput[] {
    const st = state ?? store.getState();
    const idlookup = st?.idlookup ?? {};
    const vp = idlookup[VALIDATION_VIEWPOINT_ID];
    if (!vp || vp.className !== 'DValidationViewpoint') return [];
    const out: ValidationRuleInput[] = [];
    for (const rid of (vp.rules ?? [])) {
        const r = idlookup[rid];
        if (!r || r.className !== 'DValidationRule') continue;
        out.push({
            id: r.id,
            name: r.name ?? '',
            context: r.context ?? '',
            body: r.body ?? '',
            message: r.message ?? '',
            enabled: r.enabled !== false,
        });
    }
    return out;
}

// ============================================
// LE ISTANZE
// ============================================

function minimalExecutionContext(): ExecutionContext {
    let projectId = '';
    try {
        const user: LUser = L.fromPointer(DUser.current);
        projectId = (user?.project as LProject | undefined)?.id ?? '';
    } catch { /* nessun progetto: il contesto esce vuoto e non si valida niente */ }
    return { projectId, history: [], variables: new Map() };
}

/**
 * La catena di classi di un'istanza: la sua classe e tutte le superclassi (R-VAL-12).
 *
 * `allSuperClasses` **include gia' la classe stessa** (`get_allSuperClasses` chiama
 * `get_superclasses(c, true)`, cioe' `orEqual`), ma l'id proprio si mette comunque in
 * testa e il risultato si deduplica: la catena e' usata come insieme, e dipendere da
 * quel `true` significherebbe rompersi in silenzio se un giorno cambia.
 */
function classChainOf(obj: LObject): string[] {
    const chain: string[] = [];
    const push = (id: unknown) => {
        if (typeof id === 'string' && id && !chain.includes(id)) chain.push(id);
    };
    let cls: LClass | undefined;
    try { cls = obj?.instanceof as unknown as LClass; } catch { cls = undefined; }
    if (!cls) return chain;
    push(cls.id);
    try { for (const s of (cls.allSuperClasses ?? [])) push(s?.id); } catch { /* catena troncata */ }
    return chain;
}

/**
 * L'ingresso del valutatore per il modello aperto, oppure `null` se non c'e' niente da
 * validare (nessun progetto, modello inesistente, contesto non costruibile).
 *
 * `null` e non un ingresso vuoto: «non ho potuto guardare» e «ho guardato e va tutto
 * bene» sono due cose diverse, e la superficie deve poterle distinguere.
 */
export function buildValidationInput(modelid: string): ValidationInput | null {
    if (!modelid) return null;
    const rules = collectValidationRules();

    let lmodel: LModel | undefined;
    try { lmodel = LPointerTargetable.fromPointer(modelid) as unknown as LModel; } catch { lmodel = undefined; }
    if (!lmodel) return null;

    // Il contesto dal costruttore condiviso, con l'ESTENSIONE ristretta al modello aperto
    // (R-VAL-16). Il resto resta di progetto — le classi del metamodello, la risoluzione
    // dei nomi — e a coincidere con il perimetro validato e' solo l'insieme che una
    // quantificazione attraversa. Senza il parametro, misurato il 2026-09-09, una regola
    // di cardinalita' contava le istanze di TUTTI i modelli del progetto e dichiarava
    // violate due macchine a stati sane.
    const globals = buildEvalContext(minimalExecutionContext(), { extentModelId: modelid });

    // Gli handle sono indicizzati per id: il pool e' di progetto, le istanze da validare
    // sono quelle del modello aperto (R-VAL-14).
    const handleById = new Map<string, JjelValue>();
    const pool = (globals as any).instances;
    if (Array.isArray(pool)) {
        for (const h of pool) {
            const id = (h as any)?.id;
            if (typeof id === 'string' && id) handleById.set(id, h as JjelValue);
        }
    }

    let objects: LObject[] = [];
    try { objects = (lmodel.allSubObjects ?? lmodel.objects ?? []) as LObject[]; } catch { objects = []; }

    const instances: ValidationInstanceInput[] = [];
    for (const obj of objects) {
        let id = '';
        try { id = obj?.id ?? ''; } catch { continue; }
        if (!id) continue;
        const handle = handleById.get(id);
        // Un'istanza senza handle non si valuta a occhio: si salta. Succede se il pool
        // e' costruito da un metamodello diverso da quello del modello aperto, ed e' un
        // caso che si vede nel conto — le istanze saltate non compaiono in nessuno dei
        // tre numeri, e non devono comparire come «soddisfatte».
        if (!handle || typeof handle !== 'object') continue;
        instances.push({
            id,
            classChain: classChainOf(obj),
            self: handle,
            // Le feature appiattite: le proprieta' dell'handle, che `fillInstanceSlots`
            // ha gia' messo sotto il nome nudo. Stessa forma di
            // `JjtlExecutor.createInstanceContext`.
            bindings: { ...(handle as Record<string, JjelValue>) },
        });
    }

    return { rules, instances, globals };
}

/** Il conto delle istanze del modello aperto che non hanno un handle nel pool, cioe'
 *  quelle che il comando non ha potuto guardare. Serve alla superficie per non
 *  spacciare un silenzio per un modello valido. */
export interface ValidationRunResult extends ValidationReport {
    instanceCount: number;
    ruleCount: number;
    /** ms impiegati, comprensivi della costruzione del contesto. Misura, non decorazione:
     *  la spec §9 chiede il numero prima di rendere la rivalutazione automatica. */
    elapsedMs: number;
}

/** Il comando: costruisce l'ingresso e valuta. Non scrive niente da nessuna parte. */
export function runValidationOnModel(modelid: string): ValidationRunResult | null {
    const t0 = Date.now();
    const input = buildValidationInput(modelid);
    if (!input) return null;
    const report = evaluateValidation(input);
    return {
        ...report,
        instanceCount: input.instances.length,
        ruleCount: input.rules.length,
        elapsedMs: Date.now() - t0,
    };
}
