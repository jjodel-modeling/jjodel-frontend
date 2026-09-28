/**
 * L'ambiente di authoring delle regole di validazione (R-VAL, Step 4).
 *
 * Pattern canonico per la UI trasversale (CLAUDE.md §8.7): montato una volta alla radice,
 * `CustomEvent` piu' `useState` locale, nessuno stato Redux proprio.
 *
 * ── NON NEL RAIL DI DESTRA (R-VAL-1, R-VAL-11) ──────────────────────────────
 *
 * Il pannello delle proprieta' della classe **non** ospita le regole e non le segnala.
 * Non e' una preferenza di layout: il viewpoint e' il meccanismo con cui Jjodel separa
 * gli aspetti specificati in funzione di un metamodello, e tenere le regole accanto alle
 * proprieta' aumenta il carico cognitivo di chi sta facendo un'altra cosa. Una riga in
 * sola lettura nel rail sarebbe poi il precedente per cui ogni concern che tocca la
 * classe ne chiede una, e il rail tornerebbe a essere un indice di tutto.
 *
 * La forma e' quella che la spec §7 descrive — le classi da un lato, le regole
 * dall'altro, il corpo in Monaco — nella versione piu' piccola che cammina.
 *
 * ── PROPRIE ED EREDITATE (R-VAL-12) ─────────────────────────────────────────
 *
 * Le ereditate si vedono, distinte, e **in sola lettura**: si modificano dove sono state
 * scritte, e ciascuna dichiara da quale superclasse arriva. Mostrarle e' necessario —
 * senza, il designer riscrive un vincolo che esisteva gia' piu' su — e renderle
 * modificabili sarebbe peggio che nasconderle, perche' suggerirebbe un override che
 * R-VAL-12 esclude: le regole si accumulano, nessuna sovrascrive nessuna, e un nome
 * uguale non crea eccezione. L'asimmetria con i viewpoint di sintassi, dove la
 * sottoclasse vince, va dichiarata proprio perche' per analogia ci si aspetta il
 * contrario.
 *
 * ── IL CONTESTO E' DICHIARATO, NON DEDOTTO ──────────────────────────────────
 *
 * Sopra il corpo c'e' sempre `self: <Classe>`. Il contesto e' parte del significato della
 * regola, non della selezione corrente: chi rilegge la regola domani deve vedere su cosa
 * predica senza ricostruirlo da dove si trovava quando l'ha scritta.
 *
 * ── COSA NON C'E', E NON PER DIMENTICANZA ───────────────────────────────────
 *
 * Niente controllo statico dei nomi di feature, niente avviso sui nomi riservati, niente
 * controesempi dal vivo, nessun segnaposto nel messaggio, nessuna severita', nessuna
 * gestione di piu' viewpoint. Tutta fetta 1, dichiarata fuori dallo scheletro. Le
 * diagnostiche del corpo, oggi, si leggono dove il verdetto le mostra (spec §8.3).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { compactMonacoOptions } from '../editors/monacoConfig';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { JjodelEvents } from '../../events/registry';
import { collectValidationRules } from '../../model/validation/validationContext';
import { VALIDATION_VIEWPOINT_ID } from '../../model/validation/validationTypes';
import {
    createValidationRule, deleteValidationRule, updateValidationRule,
} from '../../model/validation/validationAuthoring';
import { partitionRulesByClass } from '../../model/validation/validationRuleSets';
import './ValidationRulesModal.scss';

/** Il dettaglio dell'evento di apertura: il metamodello di cui mostrare le classi. */
export interface ValidationRulesOpenDetail {
    metamodelId: string;
    metamodelName?: string;
}

interface ClassRow { id: string; name: string; superIds: string[] }

/**
 * Le classi del metamodello e, per ciascuna, la catena delle superclassi.
 *
 * Lettura secca di `idlookup` dentro una `useSelector`, e non della proxy L: serve una
 * riga per classe con gli id, e la firma che ne esce e' una stringa — cosi' il modale non
 * si ridisegna a ogni scrittura non correlata. La catena e' ricostruita risalendo
 * `extends`, con un tetto di salti che chiude sia le gerarchie profonde sia un ciclo
 * introdotto a mano.
 */
function useMetamodelClasses(metamodelId: string): ClassRow[] {
    const signature = useSelector((state: any) => {
        const idlookup = state?.idlookup ?? {};
        const mm = idlookup[metamodelId];
        if (!mm) return '';
        const parts: string[] = [];
        for (const id in idlookup) {
            const e = idlookup[id];
            if (e?.className !== 'DClass') continue;
            parts.push(id + ':' + (e.name ?? '') + ':' + (e.extends ?? []).join(','));
        }
        return parts.sort().join('|');
    });

    return useMemo(() => {
        if (!signature) return [];
        const idlookup = (window as any).store?.getState?.()?.idlookup ?? {};
        const inMetamodel = (id: string): boolean => {
            let cur: any = idlookup[id];
            for (let hops = 0; cur && hops < 64; hops++) {
                if (cur.className === 'DModel') return cur.id === metamodelId;
                cur = idlookup[cur.father];
            }
            return false;
        };
        const rows: ClassRow[] = [];
        for (const id in idlookup) {
            const e = idlookup[id];
            if (e?.className !== 'DClass') continue;
            if (!inMetamodel(id)) continue;
            const superIds: string[] = [];
            const walk = (cid: string, hops: number) => {
                if (hops > 32) return;
                for (const s of (idlookup[cid]?.extends ?? [])) {
                    if (typeof s !== 'string' || superIds.includes(s)) continue;
                    superIds.push(s);
                    walk(s, hops + 1);
                }
            };
            walk(id, 0);
            rows.push({ id, name: e.name ?? id, superIds });
        }
        rows.sort((a, b) => a.name.localeCompare(b.name));
        return rows;
    }, [signature, metamodelId]);
}

/**
 * Le regole del viewpoint, rilette a ogni cambio della loro firma.
 *
 * La firma comprende **la collezione `rules` del viewpoint** oltre alle regole stesse, e
 * non e' ridondanza: `collectValidationRules` itera quella collezione, mentre gli oggetti
 * regola compaiono in `idlookup` con la propria creazione. Le due scritture arrivano in
 * commit distinti (`DValidationRule.new` crea, poi una `SetFieldAction` aggancia), quindi
 * una firma costruita sui soli oggetti cambia al primo commit — quando la collezione non
 * li contiene ancora — e NON cambia al secondo, lasciando la regola nuova invisibile
 * finche' non succede altro. Misurato: con la firma senza `rules`, «New rule» creava la
 * regola nel D-layer e il riquadro restava vuoto.
 */
function useValidationRules() {
    const signature = useSelector((state: any) => {
        const idlookup = state?.idlookup ?? {};
        const parts: string[] = [(idlookup[VALIDATION_VIEWPOINT_ID]?.rules ?? []).join(',')];
        for (const id in idlookup) {
            const e = idlookup[id];
            if (e?.className !== 'DValidationRule') continue;
            parts.push(`${id}:${e.name}:${e.context}:${e.enabled}:${(e.body ?? '').length}:${e.message}`);
        }
        return parts.join('|');
    });
    return useMemo(() => collectValidationRules(), [signature]);
}

export function ValidationRulesModal(): React.ReactElement | null {
    const [open, setOpen] = useState(false);
    const [target, setTarget] = useState<ValidationRulesOpenDetail | null>(null);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as ValidationRulesOpenDetail | null;
            setTarget(detail ?? null);
            setSelectedClassId('');
            setSelectedRuleId('');
            setOpen(true);
        };
        window.addEventListener(JjodelEvents.VALIDATION_RULES_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.VALIDATION_RULES_OPEN, handler);
    }, []);

    const close = useCallback(() => { setOpen(false); setPendingDelete(null); }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            // Solo quando nessun dialogo di conferma e' aperto: li' l'ESC e' suo.
            if (e.key === 'Escape' && !pendingDelete) setOpen(false);
        };
        // Fase di cattura: Monaco ferma i keydown in fase di bolla (CLAUDE.md §15.1), e
        // questo modale ne ospita uno.
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open, pendingDelete]);

    const classes = useMetamodelClasses(target?.metamodelId ?? '');
    const rules = useValidationRules();

    const selectedClass = classes.find(c => c.id === selectedClassId) ?? null;
    const partition = useMemo(
        () => partitionRulesByClass(rules, selectedClass?.id ?? '', selectedClass?.superIds ?? []),
        [rules, selectedClass],
    );
    const selectedRule = partition.own.find(r => r.id === selectedRuleId) ?? null;

    /** Quante regole (proprie) porta una classe: il numero accanto al nome nella colonna
     *  di sinistra, che e' l'unica traccia delle regole fuori da questo ambiente. */
    const ownCount = useMemo(() => {
        const m = new Map<string, number>();
        for (const r of rules) m.set(r.context, (m.get(r.context) ?? 0) + 1);
        return m;
    }, [rules]);

    const onCreate = useCallback(() => {
        if (!selectedClassId) return;
        const created = createValidationRule(selectedClassId);
        // L'id e' noto subito; la regola compare nella lista al commit differito
        // (CLAUDE.md §9.2), e la selezione la aspetta senza bisogno di un timer.
        if (created) setSelectedRuleId(created.id);
    }, [selectedClassId]);

    if (!open) return null;

    /**
     * PORTALE SU `document.body`, e non e' cerimonia: misurato il 2026-09-09 che senza,
     * il rail delle Properties **dipinge sopra** questo modale nella fascia di destra —
     * il bottone di cancellazione, che sta a x≈1251, finiva coperto da una riga
     * dell'albero, e il click ci moriva sopra. La misura e' il pixel, non il numero: il
     * `z-index` calcolato del fondale (1050) e' gia' maggiore di quello del rail (900), e
     * ciononostante `elementsFromPoint` su quel punto restituiva solo elementi
     * dell'albero. `EdgeMarkerEditorModal` usa lo stesso portale, per la stessa ragione.
     *
     * Il modale degli ESITI non ne ha bisogno perche' e' largo 620px e non arriva mai
     * sotto il rail: e' la larghezza a fare la differenza, non il componente.
     */
    return createPortal((
        <div className="validation-rules-backdrop" onClick={close} role="presentation">
            <div className="validation-rules" onClick={e => e.stopPropagation()}
                 role="dialog" aria-modal="true" aria-labelledby="validation-rules-title">

                <div className="validation-rules__header">
                    <i className="bi bi-list-check validation-rules__header-icon" aria-hidden="true" />
                    <h2 id="validation-rules-title" className="validation-rules__title">
                        Validation rules{target?.metamodelName ? ` — ${target.metamodelName}` : ''}
                    </h2>
                    <button className="validation-rules__close" onClick={close} aria-label="Close">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="validation-rules__body">
                    {/* Le classi del metamodello */}
                    <div className="validation-rules__classes">
                        <div className="validation-rules__pane-title">Classes</div>
                        {classes.length === 0 ? (
                            <p className="validation-rules__empty">This metamodel has no classes yet.</p>
                        ) : (
                            <ul className="validation-rules__class-list">
                                {classes.map(c => (
                                    <li key={c.id}>
                                        <button
                                            className={`validation-rules__class${c.id === selectedClassId ? ' validation-rules__class--selected' : ''}`}
                                            onClick={() => { setSelectedClassId(c.id); setSelectedRuleId(''); }}
                                        >
                                            <span className="validation-rules__class-name">{c.name}</span>
                                            {(ownCount.get(c.id) ?? 0) > 0 && (
                                                <span className="validation-rules__class-count">{ownCount.get(c.id)}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Le regole della classe scelta */}
                    <div className="validation-rules__rules">
                        {!selectedClass ? (
                            <p className="validation-rules__empty">Select a class to see and write its rules.</p>
                        ) : (
                            <>
                                <div className="validation-rules__pane-title">
                                    Rules of {selectedClass.name}
                                    <button className="validation-rules__new" onClick={onCreate}>
                                        <i className="bi bi-plus-lg" aria-hidden="true" /> New rule
                                    </button>
                                </div>

                                <ul className="validation-rules__rule-list">
                                    {partition.own.map(r => (
                                        <li key={r.id}>
                                            <button
                                                className={`validation-rules__rule${r.id === selectedRuleId ? ' validation-rules__rule--selected' : ''}`}
                                                onClick={() => setSelectedRuleId(r.id)}
                                            >
                                                <span className="validation-rules__rule-name">{r.name}</span>
                                                {!r.enabled && <span className="validation-rules__rule-off">off</span>}
                                            </button>
                                        </li>
                                    ))}
                                    {partition.own.length === 0 && (
                                        <li className="validation-rules__empty">No rules on this class yet.</li>
                                    )}
                                </ul>

                                {/* Le ereditate: visibili, distinte, in sola lettura. */}
                                {partition.inherited.length > 0 && (
                                    <div className="validation-rules__inherited">
                                        <div className="validation-rules__inherited-title">
                                            Inherited — read-only, and they apply as well
                                        </div>
                                        <ul className="validation-rules__rule-list">
                                            {partition.inherited.map(({ rule, fromClassId }) => (
                                                <li key={rule.id} className="validation-rules__rule validation-rules__rule--inherited">
                                                    <span className="validation-rules__rule-name">{rule.name}</span>
                                                    <span className="validation-rules__rule-from">
                                                        from {classes.find(c => c.id === fromClassId)?.name ?? fromClassId}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Il corpo della regola scelta */}
                    <div className="validation-rules__editor">
                        {!selectedRule ? (
                            <p className="validation-rules__empty">Select a rule to edit it.</p>
                        ) : (
                            <RuleEditor
                                key={selectedRule.id}
                                ruleId={selectedRule.id}
                                className={selectedClass?.name ?? ''}
                                name={selectedRule.name}
                                body={selectedRule.body}
                                message={selectedRule.message}
                                enabled={selectedRule.enabled}
                                onDelete={() => setPendingDelete({ id: selectedRule.id, name: selectedRule.name })}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!pendingDelete}
                title="Delete rule"
                message={`«${pendingDelete?.name ?? ''}» will be removed from the validation viewpoint.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    if (pendingDelete) deleteValidationRule(pendingDelete.id);
                    setSelectedRuleId('');
                    setPendingDelete(null);
                }}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    ), document.body);
}

interface RuleEditorProps {
    ruleId: string;
    className: string;
    name: string;
    body: string;
    message: string;
    enabled: boolean;
    onDelete: () => void;
}

/**
 * Il riquadro di una regola.
 *
 * Le scritture partono alla PERDITA DEL FUOCO e non a ogni tasto: `updateValidationRule`
 * scrive un `SetFieldAction` per campo, e uno per battuta riempirebbe la storia dell'undo
 * di passi lunghi un carattere. Lo stato locale e' seminato dalla regola e la `key` sul
 * componente lo risemina quando si passa a un'altra regola, che e' il modo in cui questo
 * codebase evita di sincronizzare a mano un form con la sua sorgente.
 */
function RuleEditor({ ruleId, className, name, body, message, enabled, onDelete }: RuleEditorProps): React.ReactElement {
    const [draftName, setDraftName] = useState(name);
    const [draftBody, setDraftBody] = useState(body);
    const [draftMessage, setDraftMessage] = useState(message);

    return (
        <div className="validation-rules__form">
            <div className="validation-rules__form-row">
                <label className="validation-rules__label" htmlFor={`vr-name-${ruleId}`}>Name</label>
                <input
                    id={`vr-name-${ruleId}`}
                    className="validation-rules__input"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onBlur={() => updateValidationRule(ruleId, { name: draftName })}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <div className="validation-rules__switch">
                    <span id={`vr-active-${ruleId}`}>Active</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-labelledby={`vr-active-${ruleId}`}
                        className={`jjodel-switch${enabled ? ' active' : ''}`}
                        onClick={() => updateValidationRule(ruleId, { enabled: !enabled })}
                    />
                </div>
                <button className="validation-rules__delete" onClick={onDelete} title="Delete rule">
                    <i className="bi bi-trash" aria-hidden="true" />
                </button>
            </div>

            {/* Il contesto dichiarato: parte del significato della regola, non della
                selezione corrente. Non e' modificabile qui di proposito. */}
            <div className="validation-rules__context">self: {className}</div>

            <div className="validation-rules__monaco">
                <Editor
                    height="100%"
                    value={draftBody}
                    onChange={v => setDraftBody(v ?? '')}
                    onMount={editor => { editor.onDidBlurEditorText(() => {
                        updateValidationRule(ruleId, { body: editor.getValue() });
                    }); }}
                    defaultLanguage="plaintext"
                    options={compactMonacoOptions}
                    theme="vs"
                />
            </div>

            <div className="validation-rules__form-row">
                <label className="validation-rules__label" htmlFor={`vr-msg-${ruleId}`}>Message</label>
                <input
                    id={`vr-msg-${ruleId}`}
                    className="validation-rules__input validation-rules__input--wide"
                    value={draftMessage}
                    placeholder="Shown when the rule is violated"
                    onChange={e => setDraftMessage(e.target.value)}
                    onBlur={() => updateValidationRule(ruleId, { message: draftMessage })}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
            </div>

            <div className="validation-rules__hint">
                The body must return a boolean. <code>coll.all(x =&gt; pred)</code> does;
                {' '}<code>forall x in coll: pred</code> returns a set and produces no verdict.
            </div>
        </div>
    );
}

export default ValidationRulesModal;
