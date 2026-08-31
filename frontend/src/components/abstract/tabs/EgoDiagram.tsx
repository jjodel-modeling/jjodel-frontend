import React, { useMemo } from 'react';
import {
    type Ego,
    type EgoNode,
    egoDispatch,
    egoLabel,
    egoLayout,
    egoShowAll,
    egoSummary,
} from '../../../jjform/egoNeighborhood';
import './egoDiagram.scss';

/**
 * EgoDiagram — il vicinato a un salto DENTRO la riga espansa della tabella (FL5).
 *
 * ── Non e' il canvas, e non e' nemmeno il riquadro di 13a ─────────────────────
 *
 * Il canvas esiste, e' a un click, e questo nastro ci porta da tre punti diversi
 * («open in canvas», «show all», il nodo «+n more»). Qui non c'e' nessun gesto
 * spaziale: niente pan, niente zoom, niente drag, nessun layout persistito.
 * L'unica interazione e' il click su un nodo, ed e' la STESSA azione della riga
 * di tabella — espande e carica la form.
 *
 * Il riquadro di 13a (`NeighborhoodPanel`, in `InstanceManagerTab.tsx`) e' l'altro
 * disegno dello stesso dato: un pannello alto, con una colonna di OWNER sopra il
 * soggetto. Questo e' un nastro largo quanto una riga, con tre colonne e senza
 * owner — il contenimento e' dell'outline, che ha la profondita' per mostrarlo.
 * I due convivono; fonderli darebbe a uno dei due un campo che l'altro non rende.
 *
 * ── Un motore in meno ─────────────────────────────────────────────────────────
 *
 * Nessuna regola vive qui. La proiezione, il cap, i conteggi, le posizioni e
 * l'instradamento del click sono `jjform/egoNeighborhood`, puro e testato sotto
 * node; questo file e' markup piu' due `useMemo`. In particolare il click passa
 * SEMPRE da `egoDispatch`: senza jsdom nella suite, un `onClick` scritto a mano
 * qui sarebbe l'unica parte interattiva della slice a non essere verificabile.
 *
 * ── Perche' importa `jjform/egoNeighborhood` e non `jjform` ───────────────────
 *
 * Perche' `jjform/index.ts` e' dichiarato conteso con la slice FL4, in corso in
 * parallelo, e la lezione di FL2/FL3 e' che un commit che ingloba il barrel di
 * un'altra sessione lascia HEAD a esportare da un file non tracciato. L'export nel
 * barrel e' un punto aperto, dichiarato nel referto: quando arriva, questo import
 * torna alla forma delle sue sorelle.
 *
 * ── Che cosa NON importa ──────────────────────────────────────────────────────
 *
 * Niente da `editor-v2/`. Non e' pulizia: e' cio' che permette al test di
 * renderizzare il componente sotto node — quel barrel arriva a monaco, che
 * dereferenzia `window` al momento dell'import. E' un vincolo sul componente,
 * asserito in `__tests__/egoDiagram.test.ts`.
 */
export interface EgoDiagramProps {
    /** Il vicinato gia' proiettato: `egoNeighborhood(input)`. */
    ego: Ego;
    /** La stessa azione della riga di tabella: seleziona quell'istanza. */
    onSelect: (instanceId: string) => void;
    /** Apre il canvas del modello con questa istanza selezionata. */
    onOpenInCanvas: () => void;
}

/** Il titolo di una scatola: cosa dice il tooltip, che e' l'unico posto dove le
 *  chiavi di feature stanno per intero. */
function nodeTitle(node: EgoNode): string {
    if (node.kind === 'more') return 'Show the rest on the canvas';
    if (node.kind === 'broken') return `Dangling pointer: ${node.id}`;
    const via = node.featureKeys.length > 0 ? ` — via ${node.featureKeys.join(', ')}` : '';
    return `${egoLabel(node)} : ${node.cls || 'unknown metaclass'}${via}`;
}

export function EgoDiagram({ ego, onSelect, onOpenInCanvas }: EgoDiagramProps) {
    const layout = useMemo(() => egoLayout(ego), [ego]);
    const handlers = useMemo(() => ({ onSelect, onOpenInCanvas }), [onSelect, onOpenInCanvas]);
    const summary = egoSummary(ego.counts);
    const isolated = ego.counts.incoming === 0
        && ego.counts.outgoing === 0
        && ego.counts.referencedBy === 0;

    /** Una scatola vicina. Il soggetto ha la sua, sotto: due rese perche' dicono
     *  due cose diverse — un vicino dice «nome / metaclasse», il soggetto dice
     *  «sei qui». */
    const neighbour = (node: ReturnType<typeof egoLayout>['incoming'][number]) => {
        const clickable = node.kind !== 'broken';
        const activate = () => egoDispatch(node, handlers, ego.subject.id);
        return (
            <div
                key={node.side + ':' + node.id}
                className={
                    'ego-diagram__node'
                    + (node.kind === 'more' ? ' ego-diagram__node--more' : '')
                    + (node.kind === 'broken' ? ' ego-diagram__node--broken' : '')
                }
                style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
                title={nodeTitle(node)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? activate : undefined}
                onKeyDown={clickable ? e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
                } : undefined}
            >
                <span className="ego-diagram__node-name">{egoLabel(node)}</span>
                {node.kind === 'broken' ? (
                    <span className="ego-diagram__node-broken">
                        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                        broken
                    </span>
                ) : node.cls ? (
                    <span className="ego-diagram__node-cls">{node.cls}</span>
                ) : null}
            </div>
        );
    };

    return (
        <div className="ego-diagram">
            <div className="ego-diagram__head">
                <span className="ego-diagram__eyebrow">Neighborhood · 1 hop</span>
                {/* Le due affordance in chiaro, perche' il nastro non ha nessun
                    altro segnale: non si trascina, non si ingrandisce, e senza
                    questa riga la sola cosa che si puo' fare non si vede. */}
                <span className="ego-diagram__hint">
                    click a node to select it ·{' '}
                    <button type="button" className="ego-diagram__link" onClick={onOpenInCanvas}>
                        open in canvas
                    </button>
                </span>
            </div>

            {/* Il disegno scorre DENTRO la sua scatola: con quattro uscenti e
                quattro entranti il nastro e' piu' largo di molte tabelle, e far
                scorrere la tabella di lato sarebbe il difetto che la riga
                espansa esiste per evitare. */}
            <div className="ego-diagram__scroll">
                <div
                    className="ego-diagram__frame"
                    style={{ width: layout.width, height: layout.height }}
                >
                    <svg
                        className="ego-diagram__arrows"
                        width={layout.width}
                        height={layout.height}
                        aria-hidden="true"
                    >
                        <defs>
                            {/* Punta PIENA: il nastro non ha etichette sugli archi,
                                quindi il verso e' l'unica cosa che la freccia dice,
                                e deve dirlo a 8px. */}
                            <marker
                                id="ego-diagram-arrow"
                                markerWidth="7"
                                markerHeight="7"
                                refX="6"
                                refY="3"
                                orient="auto"
                            >
                                <path className="ego-diagram__arrow-head" d="M0,0 L6,3 L0,6 Z" />
                            </marker>
                        </defs>
                        {layout.arrows.map(a => (
                            <path
                                key={a.side + ':' + a.nodeId}
                                className="ego-diagram__arrow"
                                d={a.d}
                                markerEnd="url(#ego-diagram-arrow)"
                            />
                        ))}
                    </svg>

                    {layout.incoming.map(neighbour)}
                    {layout.outgoing.map(neighbour)}

                    {/* Il soggetto: cyan perche' e' il vocabolario della SELEZIONE
                        sul canvas, non quello della cornice. Non e' cliccabile —
                        e' gia' selezionato. */}
                    <div
                        className="ego-diagram__subject"
                        style={{
                            left: layout.subject.x,
                            top: layout.subject.y,
                            width: layout.subject.w,
                            height: layout.subject.h,
                        }}
                        title={nodeTitle(layout.subject)}
                    >
                        <span className="ego-diagram__subject-name">
                            {egoLabel(ego.subject)}
                            {ego.subject.cls && ` : ${ego.subject.cls}`}
                        </span>
                        <span className="ego-diagram__subject-here">this object</span>
                    </div>
                </div>
            </div>

            <div className="ego-diagram__foot">
                <span className="ego-diagram__counts">{summary}</span>
                {/* «show all» apre il canvas filtrato, non espande il diagramma:
                    due salti dentro una riga sono un grafo che nessuno legge.
                    Assente su un'istanza isolata, dove non c'e' nessun resto. */}
                {!isolated && (
                    <button
                        type="button"
                        className="ego-diagram__link"
                        title="Open the canvas filtered on this instance"
                        onClick={() => egoShowAll(handlers)}
                    >
                        show all
                    </button>
                )}
            </div>
        </div>
    );
}

export default EgoDiagram;
