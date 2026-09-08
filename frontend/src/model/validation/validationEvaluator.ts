/**
 * Il valutatore della validazione definita dall'utente — scheletro (R-VAL).
 *
 * Date le regole attive e le istanze di un modello M1, produce l'elenco delle violazioni.
 * Niente altro: non legge il modello, non scrive nel registro dei problemi, non decide
 * quando girare. Chi lo chiama gli porta i dati gia' nella forma che vuole.
 *
 * ── MODULO PURO, e la purezza e' una proprieta' verificabile ─────────────────
 *
 * Nessun import verso `joiner`, verso Redux o verso React. L'unica dipendenza e' JjEL,
 * che a sua volta non tocca `window`. Ne discende la cosa che serve davvero: questo
 * modulo **si importa in un test**, mentre `validationTypes.ts` no (la suite gira con
 * `environment: 'node'` e `joiner` scrive su `window` alla prima riga). E' il motivo per
 * cui il confine sta qui e non altrove.
 *
 * ── IL VERDETTO PRETENDE UN BOOLEANO (R-VAL-13) ──────────────────────────────
 *
 * `verdict()` qui sotto e' l'UNICA funzione che decide, e non converte niente. `true` e'
 * soddisfatta, `false` e' violata, **qualunque altra cosa non e' un verdetto**: e' un
 * difetto della regola, e va sul canale di authoring insieme agli errori di
 * compilazione (R-VAL-7).
 *
 * Non e' prudenza: e' misura. Lo Step 0
 * (`docs/discovery/discovery_2026-09-08_verdetto_booleano.md`, sonda 42/42) ha trovato
 * che `forall t in coll: pred` restituisce un ARRAY, che `[true,false,true]` risulta
 * **vero per tutte le vie** — `if`, `not`, `and`, `implies`, `Boolean()` — e che l'array
 * vuoto e' **falso** per la truthiness dell'evaluator. Cioe' i due difetti sono opposti:
 * una regola violata da ogni elemento verrebbe dichiarata soddisfatta, e un universale
 * vacuamente vero verrebbe dichiarato violato. In piu' i due convertitori che il sistema
 * gia' ha (`JjelEvaluator.isTruthy` e il `Boolean()` di JS usato da JjTL e JjScript)
 * divergono proprio su `[]`. Aggiungerne un terzo qui, nel sottosistema che meno puo'
 * permettersi un verdetto silenziosamente sbagliato, e' la cosa da non fare.
 *
 * La forma esplicita esiste, e' misurata e funziona: `coll.all(x => pred)` restituisce un
 * booleano. E' quella che l'authoring insegnera'.
 *
 * ── I TRE INGRESSI DEL NON VALUTABILE (R-VAL-13, spec §5.2) ──────────────────
 *
 * Catturare `JjelEvaluationError` non basta. Il tri-stato ha tre ingressi, e tutti e tre
 * danno «non valutabile», **mai** violazione:
 *
 *   1. `exception`          — la valutazione lancia. JjEL lancia sulla navigazione di un
 *                             assente (`a.b` con `a` null), che e' il caso ordinario di
 *                             un modello incompleto.
 *   2. `non-boolean`        — il corpo risponde, ma non con un booleano. Ci rientra
 *                             l'array vuoto che `forall` restituisce su un NON array,
 *                             cioe' l'istanza a cui manca del tutto la feature: misurato
 *                             allo Step 0 che quel caso **non lancia**, e senza questo
 *                             ingresso scivolerebbe dentro un verdetto.
 *   3. `absent-identifier`  — un identificatore o una proprieta' che non ci sono. Non
 *                             lancia e non altera il tipo del risultato: passa dai
 *                             warning, e senza guardarli si prenderebbe per buono un
 *                             `false` calcolato su un `null` silenzioso.
 *
 * CONSEGUENZA DA SAPERE, non un effetto collaterale: una regola scritta con la
 * navigazione sicura — `self.owner?.name != ""` su un'istanza senza `owner` — risponde
 * `false`, che sarebbe una violazione, ma emette il warning di assenza e finisce quindi
 * fra le non valutabili. E' voluto: un verdetto autorevole calcolato su un assente e' la
 * categoria di difetto peggiore per un validatore, e il `?.` dice come navigare, non che
 * il dato c'era.
 *
 * L'ordine di controllo e' eccezione, poi warning, poi tipo. Warning prima del tipo
 * perche' fra le due diagnosi quella che indica dove intervenire e' l'assenza.
 *
 * ── LE REGOLE SI ACCUMULANO (R-VAL-12) ──────────────────────────────────────
 *
 * Su un'istanza valgono le regole della sua classe **e tutte quelle ereditate**. Nessuna
 * ne annulla un'altra, un nome uguale non crea override, e ogni regola applicabile
 * produce la propria voce. La congiunzione sta nell'aggregato, non nelle regole: «il
 * modello e' valido» e' la derivata, non un verdetto che qualcuno calcola qui.
 *
 * Discende da R-VAL-6-bis: una view *seleziona* e il dispatch ne sceglie una vincente
 * perche' un'istanza si disegna in un modo solo; una regola *predica*, e un'istanza puo'
 * violarne piu' d'una.
 *
 * ── QUELLO CHE NON FA ────────────────────────────────────────────────────────
 *
 * Non ha severita' (nello scheletro ogni violazione e' un `error`), non valuta i
 * segnaposto del messaggio (stringa fissa), non conosce i viewpoint — l'attivazione del
 * viewpoint la applica il chiamante non passando quelle regole. Non ordina niente per
 * gravita': l'ordine dell'uscita e' quello dell'ingresso, che e' l'unico deterministico.
 */

import { parseExpression } from '../../jjel/parser';
import { EvaluationContext, JjelEvaluator } from '../../jjel/evaluator';
import type { JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelExpression } from '../../jjel/types/ast';

// ============================================
// INGRESSO
// ============================================

/** Una regola, nella forma minima che il valutatore usa. Volutamente NON e' una
 *  `DValidationRule`: il modulo non deve conoscere il D-layer. */
export interface ValidationRuleInput {
    id: string;
    name: string;
    /** Il puntatore alla classe M2 di contesto. Confrontato con `classChain`. */
    context: string;
    /** Sorgente JjEL. */
    body: string;
    message: string;
    enabled: boolean;
}

/** Un'istanza M1 da validare. */
export interface ValidationInstanceInput {
    id: string;
    /**
     * La classe dell'istanza **e tutte le sue superclassi**. E' il chiamante a
     * risolverla, perche' e' li' che vive la gerarchia; qui serve solo per sapere quali
     * regole si applicano (R-VAL-12). L'ordine non conta: si usa come insieme.
     */
    classChain: string[];
    /** L'istanza, come la vede JjEL. Legata al nome `self`. */
    self: JjelValue;
    /** Le feature dell'istanza appiattite a identificatori nudi, come le produce
     *  `extractAttributeValues` / `fillInstanceSlots`. */
    bindings: Record<string, JjelValue>;
}

export interface ValidationInput {
    rules: ValidationRuleInput[];
    instances: ValidationInstanceInput[];
    /** I nomi visibili a tutte le regole: le classi legate per nome (`State`,
     *  `Transition`, …), come fa `buildEvalContext`. I binding dell'istanza li
     *  sovrascrivono, e `self` vince su tutto. */
    globals?: Record<string, JjelValue>;
}

// ============================================
// USCITA
// ============================================

/** Perche' una regola non e' stata valutabile su un'istanza. Tre valori, i tre ingressi
 *  di R-VAL-13. */
export type NotEvaluableReason = 'exception' | 'non-boolean' | 'absent-identifier';

export interface Violation {
    instanceId: string;
    ruleId: string;
    ruleName: string;
    message: string;
}

export interface NotEvaluable {
    instanceId: string;
    ruleId: string;
    ruleName: string;
    reason: NotEvaluableReason;
    /** Il messaggio dell'eccezione, il nome mancante, o il tipo restituito. Per
     *  l'authoring, non per l'utente del modello. */
    detail: string;
}

/** Un difetto della REGOLA, non del modello: la regola non compila e non gira su
 *  nessuna istanza. Canale di authoring (R-VAL-7), mai fra le violazioni. */
export interface RuleDefect {
    ruleId: string;
    ruleName: string;
    kind: 'parse-error';
    detail: string;
}

export interface ValidationReport {
    violations: Violation[];
    notEvaluable: NotEvaluable[];
    defects: RuleDefect[];
    /**
     * Le regole non valutabili su **tutte** le istanze del proprio contesto — e che ne
     * hanno almeno una. Euristica della spec §5.2 per separare il modello incompleto
     * dalla regola rotta senza analisi statica: non valutabile su alcune e' soltanto non
     * valutabile, non valutabile su tutte e' sospetta e si segnala in authoring.
     */
    suspectRuleIds: string[];
    /** Quante regole sono state saltate perche' spente. La superficie delle violazioni
     *  deve poterlo dichiarare: una validazione che si spegne in silenzio non e'
     *  affidabile (spec §6). */
    disabledRuleCount: number;
}

// ============================================
// IL VERDETTO — funzione unica, nessuna conversione
// ============================================

/** Il verdetto di una regola su un'istanza. */
export type Verdict = 'satisfied' | 'violated' | 'not-boolean';

/**
 * L'UNICA funzione che trasforma un valore JjEL in un verdetto, e non converte niente.
 *
 * `true` -> soddisfatta. `false` -> violata. Tutto il resto -> **non e' un verdetto**:
 * `'not-boolean'`, che il chiamante mappa su non valutabile e sul canale di authoring.
 *
 * Non si aggiunga qui una regola di conversione, per quanto ragionevole sembri. Vedi
 * l'intestazione del modulo: il sistema ne ha gia' due e divergono; questa sarebbe la
 * terza, nel posto peggiore. R-VAL-13.
 */
export function verdict(value: JjelValue): Verdict {
    if (value === true) return 'satisfied';
    if (value === false) return 'violated';
    return 'not-boolean';
}

/** Il tipo del valore, come lo si scrive in una diagnostica. `null` e gli array non
 *  sono `'object'`: chi legge il referto deve vedere la differenza che conta. */
function describeType(value: JjelValue): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array(${value.length})`;
    return typeof value;
}

/** Il primo warning che segnala un'assenza, o `null`. `ambiguous-instance` NON e'
 *  un'assenza — il nome c'e', ce n'e' troppo — e non apre il terzo ingresso. */
function firstAbsence(warnings: JjelWarning[]): JjelWarning | null {
    for (const w of warnings) {
        if (w.kind === 'undefined-identifier' || w.kind === 'property-not-found') return w;
    }
    return null;
}

// ============================================
// LA VALUTAZIONE
// ============================================

/** Una regola gia' compilata, piu' il conto delle istanze su cui e' passata: serve
 *  all'euristica del sospetto. */
interface CompiledRule {
    rule: ValidationRuleInput;
    expr: JjelExpression;
    applied: number;
    notEvaluable: number;
}

/**
 * Valuta le regole sulle istanze e produce il referto.
 *
 * NESSUNA ECCEZIONE ESCE DA QUI. Un corpo che lancia diventa una voce fra le non
 * valutabili; un corpo che non compila diventa un difetto della regola. Un validatore
 * che si interrompe a meta' su un modello incompleto sarebbe inutile proprio quando
 * serve: un modello in costruzione e' normalmente invalido (R-VAL-4).
 */
export function evaluateValidation(input: ValidationInput): ValidationReport {
    const violations: Violation[] = [];
    const notEvaluable: NotEvaluable[] = [];
    const defects: RuleDefect[] = [];
    let disabledRuleCount = 0;

    // Compilazione: una volta per regola, non una per istanza. Il corpo che non compila
    // non gira su niente, ed e' un difetto della regola (R-VAL-7).
    const compiled: CompiledRule[] = [];
    for (const rule of input.rules) {
        if (!rule.enabled) { disabledRuleCount++; continue; }
        const parsed = parseExpression(rule.body);
        if (parsed.errors.length > 0 || !parsed.expression) {
            const e = parsed.errors[0];
            defects.push({
                ruleId: rule.id, ruleName: rule.name, kind: 'parse-error',
                detail: e ? `${e.line}:${e.column} ${e.message}` : 'nessuna espressione prodotta',
            });
            continue;
        }
        compiled.push({ rule, expr: parsed.expression, applied: 0, notEvaluable: 0 });
    }
    if (compiled.length === 0) {
        return { violations, notEvaluable, defects, suspectRuleIds: [], disabledRuleCount };
    }

    const evaluator = new JjelEvaluator();

    for (const instance of input.instances) {
        const chain = new Set(instance.classChain);
        // `self` vince su tutto: e' l'unico nome che il linguaggio della regola promette.
        const variables: Record<string, JjelValue> = {
            ...(input.globals ?? {}), ...instance.bindings, self: instance.self,
        };

        for (const c of compiled) {
            // R-VAL-12: si applicano la regola della classe e tutte le ereditate, e si
            // valutano TUTTE. Nessuna scelta, nessun override.
            if (!chain.has(c.rule.context)) continue;
            c.applied++;

            // Un contesto nuovo per ogni valutazione: `EvaluationContext` porta uno scope
            // a pila e un sink di diagnostiche, e riusarlo mescolerebbe i warning di due
            // istanze.
            const ctx = new EvaluationContext(variables);

            let value: JjelValue;
            let warnings: JjelWarning[];
            try {
                const out = evaluator.evaluateWithDiagnostics(c.expr, ctx);
                value = out.value;
                warnings = out.warnings;
            } catch (e: any) {
                // INGRESSO 1. Si cattura ogni eccezione, non la sola
                // `JjelEvaluationError`: quello che conta e' che il valutatore non si
                // fermi, e la classe dell'errore non cambia il verdetto — che non c'e'.
                c.notEvaluable++;
                notEvaluable.push({
                    instanceId: instance.id, ruleId: c.rule.id, ruleName: c.rule.name,
                    reason: 'exception',
                    detail: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`,
                });
                continue;
            }

            // INGRESSO 3, controllato PRIMA del tipo: fra le due diagnosi, quella che
            // dice dove intervenire e' l'assenza del nome.
            const absent = firstAbsence(warnings);
            if (absent) {
                c.notEvaluable++;
                notEvaluable.push({
                    instanceId: instance.id, ruleId: c.rule.id, ruleName: c.rule.name,
                    reason: 'absent-identifier',
                    detail: absent.suggestion
                        ? `'${absent.identifier}' non esiste; forse '${absent.suggestion}'`
                        : `'${absent.identifier}' non esiste`,
                });
                continue;
            }

            const v = verdict(value);
            if (v === 'satisfied') continue;
            if (v === 'violated') {
                violations.push({
                    instanceId: instance.id, ruleId: c.rule.id, ruleName: c.rule.name,
                    message: c.rule.message,
                });
                continue;
            }
            // INGRESSO 2.
            c.notEvaluable++;
            notEvaluable.push({
                instanceId: instance.id, ruleId: c.rule.id, ruleName: c.rule.name,
                reason: 'non-boolean',
                detail: `il corpo ha restituito ${describeType(value)}, non un booleano`,
            });
        }
    }

    const suspectRuleIds = compiled
        .filter(c => c.applied > 0 && c.notEvaluable === c.applied)
        .map(c => c.rule.id);

    return { violations, notEvaluable, defects, suspectRuleIds, disabledRuleCount };
}
