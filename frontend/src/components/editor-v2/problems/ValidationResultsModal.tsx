/**
 * La superficie di lettura delle violazioni (R-VAL, Step 3).
 *
 * Pattern canonico per la UI trasversale (CLAUDE.md §8.7, come `ImportSummaryModal` e
 * `SymbolEditorModal`): montata una volta sola alla radice dell'app, dispatcher
 * `CustomEvent` piu' `useState` locale, nessuno stato Redux.
 *
 * ── TRE NUMERI, SEMPRE, ANCHE QUANDO SONO ZERO (R-VAL-14) ───────────────────
 *
 * L'elenco non basta. La superficie dichiara sempre:
 *   1. le violazioni, che sono le voci;
 *   2. quante regole sono INATTIVE, guardia di R-VAL-5 — una validazione che si spegne
 *      in silenzio non e' affidabile, e un progetto che valida contro tre regole su
 *      undici deve dirlo da solo;
 *   3. quante valutazioni sono risultate NON VALUTABILI.
 *
 * Il terzo chiude l'ultima strada silenziosa, e non e' un'ipotesi: lo Step 2 ha misurato
 * che sullo **stesso** modello rotto il corpo scritto nella forma del libro
 * (`forall t in coll: pred`) produce **zero violazioni e tre non valutabili**, mentre la
 * forma con `.all(...)` ne produce una. Senza quel numero l'autore della prima forma
 * vedrebbe silenzio, che e' indistinguibile da un modello valido.
 *
 * E' un CONTATORE, non un elenco: le non valutabili non diventano voci del registro dei
 * problemi (R-VAL-14), e non si elencano qui una per una.
 *
 * ── LA QUARTA RIGA, E PERCHE' NON E' UN QUARTO NUMERO ───────────────────────
 *
 * Quando una regola non compila, la riga in fondo lo dice. Non e' un quarto numero nella
 * fila delle statistiche, e non e' un elenco di difetti: quello e' il canale di
 * authoring (R-VAL-7), che arrivera' con lo Step 4. E' una riga sola perche' l'unica
 * alternativa, oggi che quel canale non esiste, sarebbe il silenzio — cioe' esattamente
 * il difetto che R-VAL-14 chiude per le non valutabili. Quando l'authoring esistera',
 * questa riga si toglie.
 *
 * ── LA QUINTA RIGA: LA REGOLA CHE NON TROVA ISTANZE (R-VAL-17) ──────────────
 *
 * Stessa forma e stesso posto della riga sul difetto di compilazione, e per la stessa
 * ragione. Una regola attiva, che compila e scritta bene, ma il cui contesto e' una
 * classe senza istanze nel modello, produce zero violazioni e zero non valutabili: e'
 * indistinguibile da un modello sano, ed e' il quarto modo di non aver girato. La riga di
 * riepilogo qui sotto — «N rules over M instances» — e' proprio il posto dove la cosa si
 * nasconde meglio, perche' somma.
 *
 * Nemmeno questo e' un quarto numero: i tre di R-VAL-14 restano tre. La copertura per
 * regola, cioe' su quante istanze ciascuna e' stata valutata, e' la forma completa e
 * appartiene alla fetta 1; quando arrivera' assorbira' anche questa riga.
 *
 * ── IL SALTO ────────────────────────────────────────────────────────────────
 *
 * Cliccare una voce seleziona l'elemento e chiude. Il gesto e' quello dell'albero
 * (`TreeViewContent.tsx:1020-1029`): `_lastSelected` piu' `SELECT_NODE` con l'id
 * dell'ELEMENTO. Limite dichiarato e non aggirato: il canvas confronta l'id del nodo
 * React Flow, che e' quello del DVertex, quindi la centratura sul canvas non e' garantita
 * mentre il pannello delle proprieta' segue sempre. Lo scheletro non mette indicatori sul
 * canvas, e l'ancoraggio doppio di `ConformanceProblemSync` resta fuori di proposito.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { JjodelEvents } from '../../../events/registry';
import { SetRootFieldAction, store } from '../../../joiner';
import type { ValidationRunResult } from '../../../model/validation/validationContext';
import './ValidationResultsModal.scss';

/** Quello che il comando manda alla superficie. `null` significa «non ho potuto
 *  guardare», che non e' «va tutto bene». */
export interface ValidationResultsDetail extends ValidationRunResult {
    modelId: string;
    modelName: string;
}

/** Il nome leggibile di un elemento, o il suo id se non ne ha uno. Lettura secca di
 *  `idlookup`: qui serve un'etichetta, non una proxy. */
function elementLabel(id: string): string {
    try {
        const d = (store.getState() as any)?.idlookup?.[id];
        const n = d?.name;
        return typeof n === 'string' && n ? n : id;
    } catch { return id; }
}

function jumpTo(elementId: string, modelId: string): void {
    try {
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '', view: '', modelElement: elementId,
        }, '', false);
    } catch { /* la selezione e' una cortesia, non deve far cadere il pannello */ }
    window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, {
        detail: { nodeId: elementId, modelId },
    }));
}

export function ValidationResultsModal(): React.ReactElement | null {
    const [result, setResult] = useState<ValidationResultsDetail | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as ValidationResultsDetail | null;
            setResult(detail ?? null);
            setOpen(true);
        };
        window.addEventListener(JjodelEvents.VALIDATION_RESULTS, handler);
        return () => window.removeEventListener(JjodelEvents.VALIDATION_RESULTS, handler);
    }, []);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        // Fase di cattura: Monaco ferma i keydown in fase di bolla (CLAUDE.md §15.1).
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open]);

    if (!open) return null;

    // «Non ho potuto guardare»: nessun progetto, modello inesistente, contesto non
    // costruibile. Dichiarato invece che reso come un modello valido.
    if (!result) {
        return (
            <div className="validation-results-backdrop" onClick={close} role="presentation">
                <div className="validation-results" onClick={e => e.stopPropagation()}
                     role="dialog" aria-modal="true" aria-labelledby="validation-results-title">
                    <div className="validation-results__header">
                        <i className="bi bi-question-circle validation-results__header-icon" aria-hidden="true" />
                        <h2 id="validation-results-title" className="validation-results__title">Validation</h2>
                        <button className="validation-results__close" onClick={close} aria-label="Close">
                            <i className="bi bi-x-lg" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="validation-results__body">
                        <p className="validation-results__empty">
                            Nothing to validate: no open model, or its context could not be built.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const violations = result.violations ?? [];
    const clean = violations.length === 0;

    return (
        <div className="validation-results-backdrop" onClick={close} role="presentation">
            <div className={`validation-results validation-results--${clean ? 'clean' : 'violated'}`}
                 onClick={e => e.stopPropagation()}
                 role="dialog" aria-modal="true" aria-labelledby="validation-results-title">

                <div className="validation-results__header">
                    <i className={`bi ${clean ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} validation-results__header-icon`}
                       aria-hidden="true" />
                    <h2 id="validation-results-title" className="validation-results__title">
                        Validation — {result.modelName}
                    </h2>
                    <button className="validation-results__close" onClick={close} aria-label="Close">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                {/* I tre numeri di R-VAL-14. Sempre tutti e tre, anche a zero. */}
                <div className="validation-results__stats">
                    <div className="validation-results__stat">
                        <span className="validation-results__stat-value">{violations.length}</span>
                        <span className="validation-results__stat-label">
                            {violations.length === 1 ? 'violation' : 'violations'}
                        </span>
                    </div>
                    <div className="validation-results__stat">
                        <span className="validation-results__stat-value">{result.disabledRuleCount}</span>
                        <span className="validation-results__stat-label">
                            {result.disabledRuleCount === 1 ? 'rule inactive' : 'rules inactive'}
                        </span>
                    </div>
                    <div className="validation-results__stat">
                        <span className="validation-results__stat-value">{result.notEvaluable.length}</span>
                        <span className="validation-results__stat-label">not evaluable</span>
                    </div>
                </div>

                <div className="validation-results__meta">
                    {result.ruleCount} {result.ruleCount === 1 ? 'rule' : 'rules'} over{' '}
                    {result.instanceCount} {result.instanceCount === 1 ? 'instance' : 'instances'}
                    {' · '}{result.elapsedMs} ms
                </div>

                <div className="validation-results__body">
                    {clean ? (
                        <p className="validation-results__empty">
                            <i className="bi bi-check2" aria-hidden="true" /> No violations.
                        </p>
                    ) : (
                        <ul className="validation-results__list">
                            {violations.map(v => (
                                <li key={`${v.instanceId}:${v.ruleId}`} className="validation-results__item">
                                    <button
                                        className="validation-results__item-btn"
                                        onClick={() => { jumpTo(v.instanceId, result.modelId); close(); }}
                                        title="Select the element"
                                    >
                                        <span className="validation-results__item-element">
                                            {elementLabel(v.instanceId)}
                                        </span>
                                        <span className="validation-results__item-message">{v.message}</span>
                                        <span className="validation-results__item-rule">{v.ruleName}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {result.notEvaluable.length > 0 && (
                    <div className="validation-results__note">
                        <i className="bi bi-info-circle" aria-hidden="true" />{' '}
                        {result.notEvaluable.length} {result.notEvaluable.length === 1 ? 'evaluation' : 'evaluations'}
                        {' '}could not produce a verdict. A rule body must return a boolean:
                        {' '}<code>coll.all(x =&gt; pred)</code>, not <code>forall x in coll: pred</code>.
                    </div>
                )}

                {result.defects.length > 0 && (
                    <div className="validation-results__note validation-results__note--defect">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />{' '}
                        {result.defects.length} {result.defects.length === 1 ? 'rule does' : 'rules do'} not compile
                        {' '}and did not run.
                    </div>
                )}

                {result.unmatchedRuleCount > 0 && (
                    <div className="validation-results__note">
                        <i className="bi bi-info-circle" aria-hidden="true" />{' '}
                        {result.unmatchedRuleCount} {result.unmatchedRuleCount === 1 ? 'rule' : 'rules'}
                        {' '}found no instance to apply to:
                        {' '}{result.unmatchedRuleCount === 1
                            ? 'its context class has'
                            : 'their context classes have'} no instances in this model.
                    </div>
                )}
            </div>
        </div>
    );
}

export default ValidationResultsModal;
