/**
 * notationCatalog — i preset di simbolo del picker, come tabella dati (D10).
 *
 * Un preset e' un VALORE, non un tipo: scegliere «exclusive gateway» dal
 * catalogo produce esattamente i campi IR che produrrebbe il wizard scegliendo
 * rombo, bordo normale, marker x. Il catalogo e' un indice molti-a-molti per
 * notazione sopra l'unico spazio dei quattro assi; aggiungere un preset e' una
 * riga in piu' qui, zero codice nel motore. I primitivi restano nei registry a
 * codice (shapeRegistry, markerRegistry), come da D2.
 *
 * Perimetro v1: SOLO simboli esprimibili con i primitivi correnti, verificati
 * sulle specifiche in docs/discovery/discovery_2026-08-15_p5_verifica_preset_notazioni.md
 * (P5). Gli esclusi (stadio, parallelogramma, cilindro, event-based gateway,
 * predefined process, ...) NON sono approssimati: entrano quando arriva il
 * contorno o l'ornamento che li esprime davvero.
 *
 * I preset `double` dichiarano `width: 3` nei dati perche' sotto i 3px il
 * double CSS non mostra due linee: il vincolo sta nella riga, non nel motore.
 * I preset evento BPMN coprono la variante catch (glifi vuoti); le varianti
 * throw arriveranno come glifi campiti in markerRegistry.
 *
 * Modulo puro: nessun React, nessun Redux, nessun import a runtime da editor-v2.
 */

import type { ShapeForm, ShapeSpec } from './irTypes';

export interface SymbolPreset {
    readonly id: string;
    readonly label: string;
    readonly notation: string;
    /** Termini di ricerca aggiuntivi (minuscoli), oltre a label e notation. */
    readonly keywords?: readonly string[];
    /** Il punto nello spazio degli assi. Assenza di `border` = normale (solid 1);
     *  assenza di `marker` = nessuno; `fill` solo dove e' semantica del simbolo. */
    readonly values: {
        readonly form: ShapeForm;
        readonly border?: { readonly style: 'solid' | 'dashed' | 'dotted' | 'double'; readonly width: number };
        readonly marker?: string;
        readonly fill?: string;
    };
}

/** Slate-700 dei token: il pieno dei simboli campiti (stato iniziale, transizione Petri). */
const INK = '#334155';

export const NOTATION_CATALOG: readonly SymbolPreset[] = [
    // ---- BPMN: eventi (cerchio; catch variant, vedi header) ----
    { id: 'bpmn-start-event', label: 'Start event', notation: 'BPMN', keywords: ['evento iniziale', 'inizio'], values: { form: 'circle' } },
    { id: 'bpmn-intermediate-event', label: 'Intermediate event', notation: 'BPMN', keywords: ['evento intermedio'], values: { form: 'circle', border: { style: 'double', width: 3 } } },
    { id: 'bpmn-end-event', label: 'End event', notation: 'BPMN', keywords: ['evento finale', 'fine'], values: { form: 'circle', border: { style: 'solid', width: 3 } } },
    { id: 'bpmn-message-event', label: 'Message event', notation: 'BPMN', keywords: ['messaggio', 'busta'], values: { form: 'circle', marker: 'envelope' } },
    { id: 'bpmn-timer-event', label: 'Timer event', notation: 'BPMN', keywords: ['orologio', 'tempo'], values: { form: 'circle', marker: 'clock' } },
    { id: 'bpmn-signal-event', label: 'Signal event', notation: 'BPMN', keywords: ['segnale'], values: { form: 'circle', marker: 'triangle' } },
    { id: 'bpmn-error-event', label: 'Error event', notation: 'BPMN', keywords: ['errore'], values: { form: 'circle', marker: 'lightning' } },
    // ---- BPMN: gateway (rombo) ----
    { id: 'bpmn-exclusive-gateway', label: 'Exclusive gateway', notation: 'BPMN', keywords: ['gateway esclusivo', 'xor', 'decisione'], values: { form: 'diamond', marker: 'x' } },
    { id: 'bpmn-parallel-gateway', label: 'Parallel gateway', notation: 'BPMN', keywords: ['gateway parallelo', 'and'], values: { form: 'diamond', marker: 'plus' } },
    { id: 'bpmn-inclusive-gateway', label: 'Inclusive gateway', notation: 'BPMN', keywords: ['gateway inclusivo', 'or'], values: { form: 'diamond', marker: 'circle' } },
    { id: 'bpmn-complex-gateway', label: 'Complex gateway', notation: 'BPMN', keywords: ['gateway complesso'], values: { form: 'diamond', marker: 'asterisk' } },
    // ---- BPMN: task (rounded) ----
    { id: 'bpmn-task', label: 'Task', notation: 'BPMN', keywords: ['attivita'], values: { form: 'rounded' } },
    { id: 'bpmn-service-task', label: 'Service task', notation: 'BPMN', keywords: ['servizio', 'ingranaggio'], values: { form: 'rounded', marker: 'gear' } },
    { id: 'bpmn-user-task', label: 'User task', notation: 'BPMN', keywords: ['utente', 'persona'], values: { form: 'rounded', marker: 'person' } },
    { id: 'bpmn-script-task', label: 'Script task', notation: 'BPMN', keywords: ['script', 'documento'], values: { form: 'rounded', marker: 'document' } },
    { id: 'bpmn-loop-task', label: 'Loop task', notation: 'BPMN', keywords: ['ciclo'], values: { form: 'rounded', marker: 'loop' } },
    { id: 'bpmn-multi-instance-task', label: 'Multi-instance task', notation: 'BPMN', keywords: ['multi istanza'], values: { form: 'rounded', marker: 'bars' } },
    // ---- UML: state machine ----
    { id: 'uml-state', label: 'State', notation: 'UML', keywords: ['stato'], values: { form: 'rounded' } },
    { id: 'uml-initial-state', label: 'Initial pseudostate', notation: 'UML', keywords: ['stato iniziale', 'inizio'], values: { form: 'circle', fill: INK } },
    { id: 'uml-final-state', label: 'Final state', notation: 'UML', keywords: ['stato finale', 'fine', 'bullseye'], values: { form: 'circle', marker: 'dot' } },
    { id: 'uml-shallow-history', label: 'Shallow history', notation: 'UML', keywords: ['storia', 'history h'], values: { form: 'circle', marker: 'history' } },
    { id: 'uml-deep-history', label: 'Deep history', notation: 'UML', keywords: ['storia profonda', 'h*'], values: { form: 'circle', marker: 'history-deep' } },
    { id: 'uml-choice', label: 'Choice', notation: 'UML', keywords: ['scelta', 'decisione'], values: { form: 'diamond' } },
    { id: 'uml-use-case', label: 'Use case', notation: 'UML', keywords: ['caso d\'uso'], values: { form: 'ellipse' } },
    // ---- Flowchart (ISO 5807) ----
    { id: 'flow-process', label: 'Process', notation: 'Flowchart', keywords: ['processo'], values: { form: 'rect' } },
    { id: 'flow-decision', label: 'Decision', notation: 'Flowchart', keywords: ['decisione'], values: { form: 'diamond' } },
    // ---- Reti di Petri ----
    { id: 'petri-place', label: 'Place', notation: 'Petri net', keywords: ['posto'], values: { form: 'circle' } },
    { id: 'petri-marked-place', label: 'Marked place', notation: 'Petri net', keywords: ['posto marcato', 'token'], values: { form: 'circle', marker: 'dot' } },
    { id: 'petri-transition', label: 'Transition', notation: 'Petri net', keywords: ['transizione', 'barra'], values: { form: 'rect', fill: INK } },
    // ---- ER (Chen) ----
    { id: 'er-entity', label: 'Entity', notation: 'ER', keywords: ['entita'], values: { form: 'rect' } },
    { id: 'er-weak-entity', label: 'Weak entity', notation: 'ER', keywords: ['entita debole'], values: { form: 'rect', border: { style: 'double', width: 3 } } },
    { id: 'er-relationship', label: 'Relationship', notation: 'ER', keywords: ['relazione'], values: { form: 'diamond' } },
    { id: 'er-identifying-relationship', label: 'Identifying relationship', notation: 'ER', keywords: ['relazione identificante'], values: { form: 'diamond', border: { style: 'double', width: 3 } } },
    { id: 'er-attribute', label: 'Attribute', notation: 'ER', keywords: ['attributo'], values: { form: 'ellipse' } },
    { id: 'er-derived-attribute', label: 'Derived attribute', notation: 'ER', keywords: ['attributo derivato'], values: { form: 'ellipse', border: { style: 'dashed', width: 1 } } },
    { id: 'er-multivalued-attribute', label: 'Multivalued attribute', notation: 'ER', keywords: ['attributo multivalore'], values: { form: 'ellipse', border: { style: 'double', width: 3 } } },
];

/** Le notazioni presenti, nell'ordine di prima apparizione nel catalogo. */
export const CATALOG_NOTATIONS: readonly string[] = NOTATION_CATALOG
    .map(p => p.notation)
    .filter((n, i, a) => a.indexOf(n) === i);

/**
 * Applica un preset a una ShapeSpec esistente, immutabilmente.
 *
 * Un preset e' un punto COMPLETO nello spazio degli assi che governa, quindi:
 * `form` sempre scritto (scalare: sceglierlo sostituisce un eventuale
 * conditional); `border.style`/`width` sempre scritti (normale = solid 1 quando
 * il preset non dichiara), il COLORE del bordo resta quello dell'autore;
 * `marker` scritto o RIMOSSO (un preset senza marker toglie quello precedente,
 * altrimenti «task» dopo «service task» conserverebbe l'ingranaggio); `fill`
 * scritto solo se il preset lo dichiara (e' semantica del simbolo: stato
 * iniziale, transizione Petri), altrimenti resta quello dell'autore. Labels,
 * badges e tutto il resto della spec passano intatti.
 */
export function applyPresetToShape(shape: ShapeSpec, preset: SymbolPreset): ShapeSpec {
    const prevBorder = shape.border;
    const next: ShapeSpec = {
        ...shape,
        form: preset.values.form,
        border: {
            color: prevBorder?.color ?? INK,
            width: preset.values.border?.width ?? 1,
            style: preset.values.border?.style ?? 'solid',
        },
    };
    if (preset.values.marker) next.marker = preset.values.marker;
    else delete next.marker;
    if (preset.values.fill !== undefined) next.fill = preset.values.fill;
    return next;
}

/** Filtro del picker: notazione ('' = tutte) piu' ricerca su label, notation e keywords. */
export function filterCatalog(notation: string, query: string): SymbolPreset[] {
    const q = query.trim().toLowerCase();
    return NOTATION_CATALOG.filter(p => {
        if (notation && p.notation !== notation) return false;
        if (!q) return true;
        if (p.label.toLowerCase().includes(q) || p.notation.toLowerCase().includes(q)) return true;
        return (p.keywords ?? []).some(k => k.includes(q));
    });
}
