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
 * (P5). Gli esclusi (event-based gateway, predefined process, ...) NON sono
 * approssimati: entrano quando arriva il contorno o l'ornamento che li esprime
 * davvero. Stadio, parallelogramma, esagono e cilindro sono usciti da questa
 * lista il 2026-08-15: i quattro primitivi corrispondenti sono arrivati nel
 * registry, quindi i preset che li usano sono forme vere e non approssimazioni.
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
export type CatalogFamily = 'Base' | 'Process' | 'Data (ER)' | 'Flowchart' | 'Goal';

export const CATALOG_FAMILIES: readonly CatalogFamily[] =
    ['Base', 'Process', 'Data (ER)', 'Flowchart', 'Goal'];

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
    { id: 'base-stadium', label: 'Stadium', notation: 'Base', family: 'Base', keywords: ['stadio', 'pillola', 'terminator'], values: { form: 'stadium' } },
    { id: 'base-ellipse', label: 'Ellipse', notation: 'Base', family: 'Base', keywords: ['ellisse'], values: { form: 'ellipse' } },
    { id: 'base-circle', label: 'Circle', notation: 'Base', family: 'Base', keywords: ['cerchio'], values: { form: 'circle' } },
    { id: 'base-diamond', label: 'Diamond', notation: 'Base', family: 'Base', keywords: ['rombo'], values: { form: 'diamond' } },
    { id: 'base-parallelogram', label: 'Parallelogram', notation: 'Base', family: 'Base', keywords: ['parallelogramma', 'input', 'output'], values: { form: 'parallelogram' } },
    { id: 'base-hexagon', label: 'Hexagon', notation: 'Base', family: 'Base', keywords: ['esagono'], values: { form: 'hexagon' } },
    { id: 'base-cylinder', label: 'Cylinder', notation: 'Base', family: 'Base', keywords: ['cilindro', 'database', 'storage', 'disco'], values: { form: 'cylinder' } },
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
    // ---- Goal modeling: i*, GRL, KAOS (D6) ----
    // Una notazione per riga, come gia' fanno BPMN e UML. i* copre i sette
    // elementi del suo nucleo; Belief va a GRL perche' i* 2.0 non lo tiene piu'
    // fra gli elementi standard mentre GRL si'; Obstacle e' di KAOS.
    //
    // Obstacle e' un PARALLELOGRAMMA e non un rombo: `diamond` con bordo semplice
    // e' gia' il punto della relationship ER nello spazio degli assi, e la modale
    // titola il simbolo con `matches[0]`, quindi un Obstacle a rombo si
    // presenterebbe all'autore come «Relationship». Il parallelogramma e' insieme
    // il disegno KAOS e un punto libero.
    { id: 'goal-goal', label: 'Goal', notation: 'i*', family: 'Goal', keywords: ['obiettivo', 'hardgoal'], values: { form: 'stadium' } },
    { id: 'goal-softgoal', label: 'Softgoal', notation: 'i*', family: 'Goal', keywords: ['soft goal', 'quality', 'qualita', 'nuvola'], values: { form: 'cloud' } },
    { id: 'goal-task', label: 'Task', notation: 'i*', family: 'Goal', keywords: ['compito', 'operazionalizzazione'], values: { form: 'hexagon' } },
    { id: 'goal-resource', label: 'Resource', notation: 'i*', family: 'Goal', keywords: ['risorsa'], values: { form: 'rect' } },
    { id: 'goal-actor', label: 'Actor', notation: 'i*', family: 'Goal', keywords: ['attore'], values: { form: 'circle' } },
    { id: 'goal-agent', label: 'Agent', notation: 'i*', family: 'Goal', keywords: ['agente'], values: { form: 'circle', marker: 'bar-top' } },
    { id: 'goal-role', label: 'Role', notation: 'i*', family: 'Goal', keywords: ['ruolo'], values: { form: 'circle', marker: 'bar-bottom' } },
    { id: 'goal-belief', label: 'Belief', notation: 'GRL', family: 'Goal', keywords: ['credenza', 'assunzione'], values: { form: 'ellipse' } },
    { id: 'goal-obstacle', label: 'Obstacle', notation: 'KAOS', family: 'Goal', keywords: ['ostacolo'], values: { form: 'parallelogram' } },
];

/** Le notazioni presenti, nell'ordine di prima apparizione nel catalogo. */
export const CATALOG_NOTATIONS: readonly string[] = NOTATION_CATALOG
    .map(p => p.notation)
    .filter((n, i, a) => a.indexOf(n) === i);

/**
 * Un asse condizionale e' l'unico oggetto che un asse puo' contenere: ogni asse
 * confrontato qui e' un primitivo, quindi «object» significa `{when,then}` o
 * `{rules}`. Stessa convenzione, e stessa riga, della sentinella `scalarOf` di
 * `symbolRecognition.ts`: le due funzioni sono l'una lo specchio dell'altra e
 * devono leggere la condizionalita' allo stesso modo.
 */
const isConditionalAxis = (v: unknown): boolean => v !== null && typeof v === 'object';

export interface ApplyPresetOptions {
    /**
     * D7 — «un preset sovrascrive un asse scalare e mai uno condizionale».
     *
     * Con `keepRules`, un asse che l'autore ha reso `Conditional` (`fill`, `marker`,
     * `border.width`, `border.style`) resta INTATTO, e nessun valore del preset
     * finisce nel suo `default`. Quest'ultima meta' non e' un dettaglio: iniettare
     * un `default` persisterebbe un default che l'utente non ha mai scelto (vietato
     * da D2) e cambierebbe in silenzio cio' che disegna ogni istanza che non matcha
     * nessuna regola — su un'azione la cui casella promette di conservare le regole
     * dell'autore. Gli assi scalari seguono il preset come sempre.
     *
     * Assente o `false`: comportamento identico a oggi.
     */
    keepRules?: boolean;
}

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
 *
 * `form` non e' fra gli assi che `keepRules` protegge (D7 non lo elenca): scegliere
 * una forma dal catalogo e' esattamente la richiesta di cambiare forma.
 */
export function applyPresetToShape(
    shape: ShapeSpec,
    preset: SymbolPreset,
    opts: ApplyPresetOptions = {},
): ShapeSpec {
    const prevBorder = shape.border;
    /** L'asse va lasciato dov'e': l'autore l'ha reso condizionale e la casella e' accesa. */
    const keep = (v: unknown): boolean => opts.keepRules === true && isConditionalAxis(v);
    const next: ShapeSpec = {
        ...shape,
        form: preset.values.form,
        border: {
            color: prevBorder?.color ?? INK,
            width: keep(prevBorder?.width) ? prevBorder!.width : (preset.values.border?.width ?? 1),
            style: keep(prevBorder?.style) ? prevBorder!.style : (preset.values.border?.style ?? 'solid'),
        },
    };
    // Un marker condizionale sopravvive anche a un preset che non ne dichiara alcuno:
    // e' la rimozione, non solo la sovrascrittura, che `keepRules` deve trattenere.
    if (!keep(shape.marker)) {
        if (preset.values.marker) next.marker = preset.values.marker;
        else delete next.marker;
    }
    if (!keep(shape.fill) && preset.values.fill !== undefined) next.fill = preset.values.fill;
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
