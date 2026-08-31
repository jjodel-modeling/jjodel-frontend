/**
 * instanceTable — the collection table of the instance manager, as data.
 *
 * Turno 11a of the design handoff: «tabella = le righe del nodo in orizzontale
 * (colonne dai widget della precedenza — swatch, mono, toggle)». This module is
 * the "as data" half of that: it turns a `ClassShape` plus an `idlookup` into
 * columns and cells, each cell carrying the renderer the precedence chose. The
 * TSX that paints them decides nothing.
 *
 * ── The classification is NOT re-derived here ──────────────────────────────────
 *
 * `useFormWidgets.ts:9-15` records that its attribute / enum / reference /
 * composition classification is a COPY of `Info.value`'s, deliberate, and asks
 * that a third copy be extracted rather than written. This module is that
 * request obeyed: the classification comes in already made, from `ClassShape`
 * (`jjform/shape.ts`, produced by `shapeAdapter`), and the rendering comes from
 * `valueRenderer.detectValueRenderer`, which is pure and already owns the ladder.
 * Nothing between the two re-decides what a feature is.
 *
 * Pure: `idlookup` in, plain records out. The three modules it imports have zero
 * imports of their own (`irReadCtx`, `valueRenderer`, `rowViewAnnotations`), so
 * the whole chain stays loadable under the node test environment.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { readRowViewAnnotations } from '../../editor-v2/nodes/rowViewAnnotations';
import {
    detectValueRenderer,
    type RendererDecision,
    type SlotShape,
} from '../../editor-v2/nodes/valueRenderer';
import type { AttrShape, ClassShape, IncomingRef, MetamodelShape, RefShape } from '../../../jjform';
import { multiplicity, tableFeatures } from '../../../jjform';

type Idlookup = Record<string, any>;

export interface TableColumn {
    key: string;
    /** What the header prints. The feature name; the metamodel's own word. */
    label: string;
    kind: 'attr' | 'ref';
    typeName: string;
    /** `0..1`, `1..*` — shown in the header tooltip, not as a second line. */
    multiplicity: string;
    required: boolean;
    derived: boolean;
    readOnly: boolean;
    many: boolean;
}

export interface TableCell {
    /** One line of text, whatever the renderer. A table cell is one line: the
     *  drawer (`IRForm`) is where a value gets room. */
    text: string;
    decision: RendererDecision;
    /** How many values the slot holds. `> 1` is what the `collection` renderer
     *  reports, and the count is kept separately so the cell can print `+2`
     *  beside the first value rather than only a bare count. */
    count: number;
    broken: boolean;
    /** A REQUIRED feature holding no value at all. Not the same fact as `broken`,
     *  which is a pointer that does not resolve: this is the other half of what
     *  contract section 2 calls a broken ref ("missing id or empty"), and it is
     *  the state a dirty delete leaves behind. Measured 2026-08-30: the core's
     *  delete removes each incoming pointer BY VALUE, so the referrer is left with
     *  an empty slot, and without this flag the cell would print a dash - the
     *  silent emptiness ratified rule 2 of 12d forbids. */
    missingRequired: boolean;
}

export interface TableRow {
    id: string;
    name: string;
    cells: Record<string, TableCell>;
    /** Non-containment incoming pointers only — an owner is not a referrer.
     *  This is the delete preflight of 12d, computed here so the column and the
     *  future dialogue read one number. */
    referencedBy: IncomingRef[];
    /** Everything the search matches against, lowercased once per row rather
     *  than per keystroke. */
    haystack: string;
}

/** Columns of a metaclass: attributes then references, children excluded.
 *  A containment list is not a column — it is a sub-form (Turno 10a). */
export function tableColumns(cls: ClassShape): TableColumn[] {
    return tableFeatures(cls).map((f: AttrShape | RefShape) => ({
        key: f.key,
        label: f.key,
        kind: ('of' in f ? 'ref' : 'attr') as 'attr' | 'ref',
        typeName: 'of' in f ? f.of : f.typeName,
        multiplicity: multiplicity(f),
        required: f.required,
        derived: f.derived,
        readOnly: f.readOnly,
        many: f.many,
    }));
}

/** Display text of one raw slot value, for a table cell.
 *  A reference resolves to the target's NAME; an enum literal to its own name;
 *  anything else prints as it is stored. Returns null for a pointer that does
 *  not resolve — the caller turns that into brokenness, which is a different
 *  fact from an empty value. */
function displayValue(
    idlookup: Idlookup,
    raw: unknown,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): string | null {
    if (raw == null || raw === '') return '';
    if ('of' in feature) {
        const target = idlookup[String(raw)];
        if (!target) return null;                      // dangling pointer
        return String(target.name ?? target.initialName ?? '');
    }
    if (feature.type === 'enum' && feature.enum) {
        const literals = shape.enums[feature.enum]?.literals ?? [];
        const byId = literals.find(l => l.id === raw);
        if (byId) return byId.name;
        // The XMI importer writes the literal NAME where the editors write its
        // pointer (`useFormWidgets.normalizeEnumValues` reconciles the same two
        // writers). A name that matches a literal passes through as itself; one
        // that matches nothing passes through too — it may be a literal removed
        // from the enum, which is a conformance problem to report, not one to
        // silently rewrite.
        return String(raw);
    }
    return String(raw);
}

/** The `SlotShape` `valueRenderer` reads, built for one (instance, feature).
 *  Exported for the tests, which drive it on plain dictionaries. */
export function slotShapeFor(
    idlookup: Idlookup,
    instanceId: string,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): { slot: SlotShape; count: number; broken: boolean } {
    const dValue = findFeatureRaw(idlookup, instanceId, feature.key);
    const rawValues: unknown[] = Array.isArray(dValue?.values) ? dValue.values : [];
    // Holes are values that were cleared in place (`formWrite.clearSlotValue`
    // leaves one rather than shortening the array), and they are not values.
    const filled = rawValues.filter(v => v != null && String(v).trim() !== '');

    const texts: string[] = [];
    let broken = false;
    for (const raw of filled) {
        const t = displayValue(idlookup, raw, feature, shape);
        if (t === null) broken = true;
        else texts.push(t);
    }

    const isRef = 'of' in feature;
    const ann = readRowViewAnnotations(idlookup, feature.id);
    const enumLiteralNames = !isRef && feature.type === 'enum' && feature.enum
        ? (shape.enums[feature.enum]?.literals ?? []).map(l => l.name)
        : undefined;

    const slot: SlotShape = {
        value: texts[0] ?? '',
        values: texts,
        isReference: isRef,
        isMany: feature.many,
        typeName: isRef ? feature.of : feature.typeName,
        enumLiteralNames,
        featureName: feature.key,
        rendererOverride: ann.renderer ?? undefined,
        unit: ann.unit ?? undefined,
        min: ann.min ?? undefined,
        max: ann.max ?? undefined,
        // Brokenness is per SLOT, not per value: one dangling pointer among three
        // still makes the cell say so, because the row's job is to flag that the
        // model needs attention, not to hide it behind two good values.
        isBroken: broken,
        // `lower >= 1`, and not derived: a derived feature is computed rather than
        // held, so an empty one is not a model the user has to repair and flagging
        // it would put a warning on every row of a metamodel that declares one.
        //
        // Handed to the ladder rather than decided here: since R-FORM-15 the
        // `missingRequired` verdict is the ENGINE's, so this table and the canvas
        // node cannot classify the same empty slot differently.
        required: feature.required && !feature.derived,
    };
    return { slot, count: filled.length, broken };
}

/**
 * One row: every cell of one instance, plus what points at it.
 *
 * `referencedByAll` is passed in rather than computed, because the walk needs the
 * impure adapter (`shapeAdapter.referencedBy`) and this module is pure. Callers
 * that do not care pass `[]`.
 */
export function tableRow(
    idlookup: Idlookup,
    instanceId: string,
    cls: ClassShape,
    shape: MetamodelShape,
    referencedByAll: IncomingRef[] = [],
): TableRow {
    const ctx = makeDrawReadCtx(idlookup);
    const name = ctx.getName(instanceId) ?? '';
    const cells: Record<string, TableCell> = {};
    const bits: string[] = [name];

    for (const feature of tableFeatures(cls)) {
        const { slot, count, broken } = slotShapeFor(idlookup, instanceId, feature, shape);
        const decision = detectValueRenderer(slot);
        const text = slot.values?.join(', ') ?? '';
        cells[feature.key] = {
            text, decision, count, broken,
            // Read off the decision, not recomputed: the ladder already answered,
            // and a second copy of the rule here is exactly the divergence
            // R-FORM-15 exists to close. Kept as a field because the cell reads it
            // as a state, the way `broken` is read.
            missingRequired: decision.kind === 'missingRequired',
        };
        if (text) bits.push(text);
    }

    return {
        id: instanceId,
        name,
        cells,
        // An owner is not a referrer: counting containment here would put a 1 on
        // every contained instance in the model and make the column meaningless.
        referencedBy: referencedByAll.filter(r => !r.composition),
        haystack: bits.join('  ').toLowerCase(),
    };
}

/**
 * Filter rows by a free-text query.
 *
 * Matches the instance NAME and every string a cell prints — which is what
 * «Search…» in Turno 11a offers over a collection. Multi-word queries are ANDed
 * across the row, not matched as a phrase: typing two words the user saw in two
 * different columns should find the row.
 */
export function filterRows(rows: TableRow[], query: string): TableRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter(r => terms.every(t => r.haystack.includes(t)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 10c — la testata, il footer e le due riduzioni della tabella.
//
// Tutto quel che segue e' PURO, e sta qui e non nel TSX per una ragione misurata:
// `InstanceManagerTab.tsx` non e' importabile sotto l'ambiente `node` di vitest
// (arriva a monaco per il barrel di `editor-v2/`, e muore all'import prima del
// primo `it`, cfr. il docstring di `__tests__/instanceManagerFl6.test.ts`). Una
// regola scritta dentro il componente e' una regola che nessun test puo' eseguire:
// resterebbe provata solo per lettura del sorgente, che e' esattamente cio' che
// CLAUDE.md §5 vieta di chiamare verifica.
// ─────────────────────────────────────────────────────────────────────────────

/** Soglia della paginazione. Sotto questo numero di righe la paginazione non
 *  appare affatto — non «appare disabilitata»: un controllo inerte su una tabella
 *  di sei righe e' arredamento. */
export const PAGE_SIZE = 50;

/**
 * Filtro sul NOME, che non e' `filterRows`.
 *
 * `filterRows` cerca nell'intera riga (`haystack`), ed e' la «Search…» di 11a.
 * La board chiede «Filter by name…», che e' un'altra promessa: chi la legge si
 * aspetta che digitare `on` non gli restituisca ogni istanza che ha `on` in un
 * attributo qualunque. Due segnaposti diversi vogliono due predicati diversi.
 *
 * I termini sono in AND, come in `filterRows`: la differenza e' il CAMPO su cui
 * cercano, non il modo di comporre.
 */
export function filterRowsByName(rows: TableRow[], query: string): TableRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter(r => {
        const name = r.name.toLowerCase();
        return terms.every(t => name.includes(t));
    });
}

/** L'enum discriminante di una metaclasse, se ne ha uno. */
export interface Discriminant {
    /** Nome della feature — la chiave della cella su cui il segmented filtra. */
    key: string;
    /** Nome dell'enumerazione, per il tooltip. */
    enumName: string;
    /** I literal, NELL'ORDINE DELLA SHAPE. Nomi, non pointer: e' cio' che la
     *  cella stampa (`displayValue` risolve il pointer al nome del literal), e
     *  quindi cio' contro cui il segmented puo' confrontare senza una seconda
     *  risoluzione. */
    literals: string[];
}

/**
 * L'enum discriminante: il PRIMO attributo a valore singolo di tipo `enum` con
 * almeno due literal, nell'ordine in cui la shape li elenca.
 *
 * Letto dalla shape, mai cablato: il prompt di 10c nomina `All | normal | initial
 * | final` per `State` come ESEMPIO, e cablare quei quattro literal avrebbe reso
 * la barra muta su ogni altro metamodello.
 *
 * Perche' «a valore singolo»: un enum `many` puo' avere piu' literal per riga, e
 * un segmented a scelta unica su un valore multiplo e' una domanda a cui la riga
 * risponde piu' volte. Perche' «almeno due»: un enum di un literal partiziona
 * niente, e la barra direbbe `All | x` con le due voci sempre uguali.
 *
 * Restituisce `null` quando non ce n'e' — e allora il segmented non si rende.
 */
export function discriminantEnum(cls: ClassShape, shape: MetamodelShape): Discriminant | null {
    for (const a of cls.attrs) {
        if (a.type !== 'enum' || a.many || !a.enum) continue;
        const literals = (shape.enums[a.enum]?.literals ?? []).map(l => l.name);
        if (literals.length < 2) continue;
        return { key: a.key, enumName: a.enum, literals };
    }
    return null;
}

/**
 * Il segmented, applicato. `literal === ''` e' «All» e non filtra.
 *
 * Confronta sul TESTO della cella, che e' gia' il nome del literal: la
 * risoluzione pointer -> nome l'ha fatta `displayValue` una volta sola, in
 * `tableRow`. Rifarla qui sarebbe la seconda lettura della stessa convenzione,
 * e le due divergerebbero il giorno in cui l'importatore XMI ne scrive una terza.
 */
export function filterBySegment(rows: TableRow[], key: string, literal: string): TableRow[] {
    if (!literal) return rows;
    return rows.filter(r => r.cells[key]?.text === literal);
}

/**
 * Le colonne interamente vuote: quelle in cui NESSUNA riga tiene un valore.
 *
 * «Vuota» e' `count === 0` e nient'altro. Una cella `broken` non e' vuota — tiene
 * un puntatore che non risolve, che e' un problema da vedere, non un'assenza da
 * nascondere; e una `missingRequired` e' l'assenza che il modello DEVE mostrare
 * (regola 2 ratificata di 12d). Nascondere la colonna che le contiene sarebbe
 * ripristinare per via di layout il silenzio che quella regola vieta.
 *
 * Misurate su TUTTE le righe della metaclasse, mai sulle filtrate: se dipendessero
 * dal filtro, le colonne apparirebbero e sparirebbero a ogni battuta, e la tabella
 * cambierebbe forma mentre la si legge.
 */
export function emptyColumnKeys(rows: TableRow[], columns: TableColumn[]): string[] {
    if (rows.length === 0) return [];
    return columns
        .filter(col => rows.every(r => {
            const c = r.cells[col.key];
            return !!c && c.count === 0 && !c.broken && !c.missingRequired;
        }))
        .map(col => col.key);
}

/** Le colonne che restano, nell'ordine originale. */
export function visibleColumns(columns: TableColumn[], hiddenKeys: string[]): TableColumn[] {
    if (hiddenKeys.length === 0) return columns;
    const hidden = new Set(hiddenKeys);
    return columns.filter(col => !hidden.has(col.key));
}

/** Quante pagine servono. Almeno una, anche a zero righe: «pagina 1 di 0» non e'
 *  una posizione. */
export function pageCount(total: number, size: number = PAGE_SIZE): number {
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
}

/** La finestra di una pagina. `page` e' 1-based, e viene pinzata: una pagina 7 su
 *  una tabella che ne ha 3 restituisce la 3, non un vuoto. */
export function pageOf(rows: TableRow[], page: number, size: number = PAGE_SIZE): TableRow[] {
    if (rows.length <= size) return rows;
    const last = pageCount(rows.length, size);
    const p = Math.min(Math.max(1, Math.floor(page)), last);
    return rows.slice((p - 1) * size, p * size);
}

/** Un campo CSV, con le virgolette raddoppiate secondo RFC 4180. */
function csvField(raw: string): string {
    const s = raw ?? '';
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export CSV delle righe DATE — cioe' delle righe filtrate, perche' e' quello che
 * il chiamante passa. Un export che riesportasse la collezione intera mentre lo
 * schermo ne mostra sei sarebbe un bottone che fa un'altra cosa da quella che
 * l'utente ha appena composto.
 *
 * Le colonne sono quelle DATE, cioe' anche qui quelle visibili: una colonna
 * nascosta perche' vuota esporterebbe una colonna di stringhe vuote.
 *
 * Il testo e' quello che la cella stampa, non lo stato grezzo: un CSV di pointer
 * non lo apre nessuno.
 */
export function toCsv(columns: TableColumn[], rows: TableRow[]): string {
    const head = ['name', ...columns.map(c => c.key)].map(csvField).join(',');
    const body = rows.map(r =>
        [r.name, ...columns.map(c => r.cells[c.key]?.text ?? '')].map(csvField).join(','));
    return [head, ...body].join('\r\n');
}

/**
 * La metaclasse piu' popolata, per la preselezione allo stato di riposo.
 *
 * A parita' di conteggio vince la PRIMA nell'ordine dato — che nel tab e' l'ordine
 * alfabetico del rail, quindi la scelta e' stabile fra un render e l'altro invece
 * di dipendere dall'ordine in cui la `idlookup` e' stata percorsa.
 *
 * Le metaclassi a zero istanze non vincono mai: se nessuna ne ha, il ritorno e'
 * `null` e il chiamante rende l'unico empty state («modello vuoto») invece di
 * preselezionare una collezione vuota e mostrarne un secondo.
 */
export function mostPopulatedClassId(
    classes: Array<{ id: string }>,
    counts: Record<string, number>,
): string | null {
    let bestId: string | null = null;
    let best = 0;
    for (const cls of classes) {
        const n = counts[cls.id] ?? 0;
        if (n > best) { best = n; bestId = cls.id; }
    }
    return bestId;
}
