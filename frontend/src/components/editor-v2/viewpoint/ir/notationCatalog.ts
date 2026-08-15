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

/**
 * Le famiglie semantiche delle sezioni del catalogo (D24): cosa si modella,
 * non lo standard di provenienza. L'ordine qui e' l'ordine delle sezioni.
 */
export type CatalogFamily = 'Base' | 'Process' | 'Data (ER)' | 'Flowchart';

export const CATALOG_FAMILIES: readonly CatalogFamily[] =
    ['Base', 'Process', 'Data (ER)', 'Flowchart'];

export interface SymbolPreset {
    readonly id: string;
    readonly label: string;
    readonly notation: string;
    /** Famiglia della sezione (D24). Opzionale perche' i preset sintetici
     *  (il valore corrente degli assi nella modale) non ne hanno una; ogni
     *  riga di tabella la dichiara. */
    readonly family?: CatalogFamily;
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
    // ---- Base: le forme pure del registry (D24) ----
    { id: 'base-rect', label: 'Rectangle', notation: 'Base', family: 'Base', keywords: ['rettangolo'], values: { form: 'rect' } },
    { id: 'base-rounded', label: 'Rounded rectangle', notation: 'Base', family: 'Base', keywords: ['arrotondato'], values: { form: 'rounded' } },
    { id: 'base-ellipse', label: 'Ellipse', notation: 'Base', family: 'Base', keywords: ['ellisse'], values: { form: 'ellipse' } },
    { id: 'base-circle', label: 'Circle', notation: 'Base', family: 'Base', keywords: ['cerchio'], values: { form: 'circle' } },
    { id: 'base-diamond', label: 'Diamond', notation: 'Base', family: 'Base', keywords: ['rombo'], values: { form: 'diamond' } },
    // ---- BPMN: eventi (cerchio; catch variant, vedi header) ----
    { id: 'bpmn-start-event', label: 'Start event', notation: 'BPMN', family: 'Process', keywords: ['evento iniziale', 'inizio'], values: { form: 'circle' } },
    { id: 'bpmn-intermediate-event', label: 'Intermediate event', notation: 'BPMN', family: 'Process', keywords: ['evento intermedio'], values: { form: 'circle', border: { style: 'double', width: 3 } } },
    { id: 'bpmn-end-event', label: 'End event', notation: 'BPMN', family: 'Process', keywords: ['evento finale', 'fine'], values: { form: 'circle', border: { style: 'solid', width: 3 } } },
    { id: 'bpmn-message-event', label: 'Message event', notation: 'BPMN', family: 'Process', keywords: ['messaggio', 'busta'], values: { form: 'circle', marker: 'envelope' } },
    { id: 'bpmn-timer-event', label: 'Timer event', notation: 'BPMN', family: 'Process', keywords: ['orologio', 'tempo'], values: { form: 'circle', marker: 'clock' } },
    { id: 'bpmn-signal-event', label: 'Signal event', notation: 'BPMN', family: 'Process', keywords: ['segnale'], values: { form: 'circle', marker: 'triangle' } },
    { id: 'bpmn-error-event', label: 'Error event', notation: 'BPMN', family: 'Process', keywords: ['errore'], values: { form: 'circle', marker: 'lightning' } },
    // ---- BPMN: gateway (rombo) ----
    { id: 'bpmn-exclusive-gateway', label: 'Exclusive gateway', notation: 'BPMN', family: 'Process', keywords: ['gateway esclusivo', 'xor', 'decisione'], values: { form: 'diamond', marker: 'x' } },
    { id: 'bpmn-parallel-gateway', label: 'Parallel gateway', notation: 'BPMN', family: 'Process', keywords: ['gateway parallelo', 'and'], values: { form: 'diamond', marker: 'plus' } },
    { id: 'bpmn-inclusive-gateway', label: 'Inclusive gateway', notation: 'BPMN', family: 'Process', keywords: ['gateway inclusivo', 'or'], values: { form: 'diamond', marker: 'circle' } },
    { id: 'bpmn-complex-gateway', label: 'Complex gateway', notation: 'BPMN', family: 'Process', keywords: ['gateway complesso'], values: { form: 'diamond', marker: 'asterisk' } },
    // ---- BPMN: task (rounded) ----
    { id: 'bpmn-task', label: 'Task', notation: 'BPMN', family: 'Process', keywords: ['attivita'], values: { form: 'rounded' } },
    { id: 'bpmn-service-task', label: 'Service task', notation: 'BPMN', family: 'Process', keywords: ['servizio', 'ingranaggio'], values: { form: 'rounded', marker: 'gear' } },
    { id: 'bpmn-user-task', label: 'User task', notation: 'BPMN', family: 'Process', keywords: ['utente', 'persona'], values: { form: 'rounded', marker: 'person' } },
    { id: 'bpmn-script-task', label: 'Script task', notation: 'BPMN', family: 'Process', keywords: ['script', 'documento'], values: { form: 'rounded', marker: 'document' } },
    { id: 'bpmn-loop-task', label: 'Loop task', notation: 'BPMN', family: 'Process', keywords: ['ciclo'], values: { form: 'rounded', marker: 'loop' } },
    { id: 'bpmn-multi-instance-task', label: 'Multi-instance task', notation: 'BPMN', family: 'Process', keywords: ['multi istanza'], values: { form: 'rounded', marker: 'bars' } },
    // ---- UML: state machine e activity ----
    { id: 'uml-state', label: 'State', notation: 'UML', family: 'Process', keywords: ['stato'], values: { form: 'rounded' } },
    { id: 'uml-initial-state', label: 'Initial pseudostate', notation: 'UML', family: 'Process', keywords: ['stato iniziale', 'inizio'], values: { form: 'circle', fill: INK } },
    { id: 'uml-final-state', label: 'Final state', notation: 'UML', family: 'Process', keywords: ['stato finale', 'fine', 'bullseye'], values: { form: 'circle', marker: 'dot' } },
    { id: 'uml-shallow-history', label: 'Shallow history', notation: 'UML', family: 'Process', keywords: ['storia', 'history h'], values: { form: 'circle', marker: 'history' } },
    { id: 'uml-deep-history', label: 'Deep history', notation: 'UML', family: 'Process', keywords: ['storia profonda', 'h*'], values: { form: 'circle', marker: 'history-deep' } },
    { id: 'uml-choice', label: 'Choice', notation: 'UML', family: 'Process', keywords: ['scelta', 'decisione'], values: { form: 'diamond' } },
    { id: 'uml-flow-final', label: 'Flow final', notation: 'UML', family: 'Process', keywords: ['fine flusso', 'activity'], values: { form: 'circle', marker: 'x' } },
    { id: 'uml-fork-join', label: 'Fork/Join', notation: 'UML', family: 'Process', keywords: ['barra', 'concorrenza'], values: { form: 'rect', fill: INK } },
    { id: 'uml-use-case', label: 'Use case', notation: 'UML', family: 'Process', keywords: ['caso d\'uso'], values: { form: 'ellipse' } },
    // ---- Flowchart (ISO 5807) ----
    { id: 'flow-process', label: 'Process', notation: 'Flowchart', family: 'Flowchart', keywords: ['processo'], values: { form: 'rect' } },
    { id: 'flow-decision', label: 'Decision', notation: 'Flowchart', family: 'Flowchart', keywords: ['decisione'], values: { form: 'diamond' } },
    // ---- Reti di Petri ----
    { id: 'petri-place', label: 'Place', notation: 'Petri net', family: 'Process', keywords: ['posto'], values: { form: 'circle' } },
    { id: 'petri-marked-place', label: 'Marked place', notation: 'Petri net', family: 'Process', keywords: ['posto marcato', 'token'], values: { form: 'circle', marker: 'dot' } },
    { id: 'petri-transition', label: 'Transition', notation: 'Petri net', family: 'Process', keywords: ['transizione', 'barra'], values: { form: 'rect', fill: INK } },
    // ---- ER (Chen) ----
    { id: 'er-entity', label: 'Entity', notation: 'ER', family: 'Data (ER)', keywords: ['entita'], values: { form: 'rect' } },
    { id: 'er-weak-entity', label: 'Weak entity', notation: 'ER', family: 'Data (ER)', keywords: ['entita debole'], values: { form: 'rect', border: { style: 'double', width: 3 } } },
    { id: 'er-relationship', label: 'Relationship', notation: 'ER', family: 'Data (ER)', keywords: ['relazione'], values: { form: 'diamond' } },
    { id: 'er-identifying-relationship', label: 'Identifying relationship', notation: 'ER', family: 'Data (ER)', keywords: ['relazione identificante'], values: { form: 'diamond', border: { style: 'double', width: 3 } } },
    { id: 'er-attribute', label: 'Attribute', notation: 'ER', family: 'Data (ER)', keywords: ['attributo'], values: { form: 'ellipse' } },
    { id: 'er-derived-attribute', label: 'Derived attribute', notation: 'ER', family: 'Data (ER)', keywords: ['attributo derivato'], values: { form: 'ellipse', border: { style: 'dashed', width: 1 } } },
    { id: 'er-multivalued-attribute', label: 'Multivalued attribute', notation: 'ER', family: 'Data (ER)', keywords: ['attributo multivalore'], values: { form: 'ellipse', border: { style: 'double', width: 3 } } },
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

/**
 * A derived catalog section (D18): the notation, the presets matching the
 * query, and the full cardinality of the section (query-independent).
 */
export interface CatalogSection {
    readonly notation: string;
    /** The presets of this notation matching the query ('' = all of them). */
    readonly presets: readonly SymbolPreset[];
    /** Full cardinality of the section, independent of the query. */
    readonly total: number;
}

/**
 * Derived section index over the catalog (D18): one section per notation, in
 * CATALOG_NOTATIONS order (order of first appearance in the table). The table
 * stays the single source; sections left empty by the query are NOT filtered
 * here, hiding them is a UI choice, not a property of the index.
 */
export function catalogSections(query: string): CatalogSection[] {
    return CATALOG_NOTATIONS.map((notation) => ({
        notation,
        presets: filterCatalog(notation, query),
        total: NOTATION_CATALOG.reduce((n, p) => n + (p.notation === notation ? 1 : 0), 0),
    }));
}

/** Id lookup, built once over the table (resolves the D18 recents strip). */
const PRESET_BY_ID: ReadonlyMap<string, SymbolPreset> =
    new Map(NOTATION_CATALOG.map((p) => [p.id, p]));

/** The table row for an id, or undefined: unknown ids are the caller's to drop. */
export function getCatalogPreset(id: string): SymbolPreset | undefined {
    return PRESET_BY_ID.get(id);
}

/**
 * A derived family section (D24): the semantic family, the presets matching
 * BOTH filters, and the full cardinality of the family (filter-independent).
 */
export interface CatalogFamilySection {
    readonly family: CatalogFamily;
    /** The presets of this family matching query AND notation ('' = all). */
    readonly presets: readonly SymbolPreset[];
    /** Full cardinality of the family, independent of the filters. */
    readonly total: number;
}

/**
 * Derived family-section index over the catalog (D24): one section per
 * family, in CATALOG_FAMILIES order (a declared order, not first appearance:
 * the families are a closed vocabulary). `notation` is the chip filter and
 * narrows the presets exactly like the query does, never the totals; the two
 * filters compose. Sections left empty by the filters are NOT dropped here,
 * hiding them is a UI choice, not a property of the index (same contract as
 * catalogSections, D18).
 */
export function catalogFamilySections(query: string, notation: string): CatalogFamilySection[] {
    const matches = filterCatalog(notation, query);
    return CATALOG_FAMILIES.map((family) => ({
        family,
        presets: matches.filter((p) => p.family === family),
        total: NOTATION_CATALOG.reduce((n, p) => n + (p.family === family ? 1 : 0), 0),
    }));
}
