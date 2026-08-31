/**
 * jjform/egoNeighborhood — l'EGO-DIAGRAMMA a un salto della riga espandibile (FL5).
 *
 * ── Che cosa NON e', di nuovo ─────────────────────────────────────────────────
 *
 * Non e' un canvas, e non e' nemmeno il riquadro di 13a. Il riquadro
 * (`neighborhood.ts`) e' un pannello che sta accanto alla form; questo e' un
 * nastro largo quanto una riga di tabella: entranti a sinistra, soggetto al
 * centro, uscenti a destra, e l'owner sopra a sinistra (FL7).
 *
 * ── L'owner, e perche' e' arrivato dopo (FL7) ─────────────────────────────────
 *
 * FL5 lo aveva lasciato fuori con questa motivazione: «la riga non ha altezza da
 * spendere per il contenimento, che e' dell'outline (10b)». La decisione del
 * 2026-08-31 la ribalta, sulla scorta dell'opzione 1a della board 13a: l'outline
 * dice DOVE sta un'istanza nell'albero, il nastro dice CHI la tocca, e «chi la
 * possiede» e' la prima riga di quella seconda risposta. La banda costa una
 * scatola alta 40px, una volta sola e solo quando l'owner c'e'.
 *
 * Non e' un dato nuovo: era gia' nell'ingresso. `EgoInput.incoming` e' la
 * risposta di `referencedBy` VERBATIM, contenimento incluso e marcato, e questo
 * modulo lo scartava un rigo piu' sotto. L'owner e' quel puntatore, lo stesso che
 * il conteggio continua a non contare.
 *
 * I due moduli convivono per la stessa ragione per cui convivono le due
 * `FormTheme`: descrivono due disegni diversi dello stesso dato. Fonderli
 * significherebbe dare a uno dei due un campo che l'altro non rende.
 *
 * ── Niente e' camminato due volte ─────────────────────────────────────────────
 *
 * Questo modulo non cammina il grafo. Riceve cio' che l'ospite ha GIA': i
 * puntatori uscenti del soggetto (valori di slot, che sono dato d'istanza e non
 * di shape) e i puntatori entranti nella forma in cui `ShapeCtx.referencedBy` li
 * consegna — `IncomingRef`, per PUNTATORE e col contenimento marcato. Da li' e'
 * tutta proiezione: dedup, precedenza fra i lati, cap, conteggi.
 *
 * ── Un nodo per id, e l'uscente vince ─────────────────────────────────────────
 *
 * Un vicino che il soggetto punta E che punta il soggetto compare UNA volta,
 * nella colonna degli uscenti. Non e' un'economia di pixel — e' che due scatole
 * con lo stesso nome ai due lati raccontano due istanze dove ce n'e' una. L'arco
 * di ritorno non si perde: la chiave della feature entrante finisce fra le
 * `featureKeys` dello stesso nodo.
 *
 * L'owner e' l'ULTIMO servito, e la regola vale anche per lui: se possiede il
 * soggetto E lo punta per riferimento, `owner` e' quel nodo li' — lo STESSO
 * oggetto, con il suo `side` di vicino — e non una seconda scatola sopra. Chi
 * rende guarda `owner.side === 'owner'` per sapere se ha una scatola propria da
 * disegnare. Cio' che non si perde e' la chiave: il nome della feature di
 * contenimento entra nelle `featureKeys` di quel nodo, e quindi nel suo tooltip.
 *
 * La precedenza e' percio' uscente > entrante > owner, e non quella di
 * `neighborhoodDraw` (owner > uscente > entrante). Sono due disegni diversi: li'
 * l'owner ha una colonna propria e vince perche' e' il ruolo piu' forte; qui la
 * colonna e' quella dei riferimenti, l'owner e' una banda sopra, e un'istanza che
 * e' entrambe le cose si legge meglio dov'e' l'arco.
 *
 * E' anche cio' che fa tornare i numeri della fixture: `Running` di `Heater` e'
 * puntato da `start.target`, `stop.source` e `fault.source` — tre puntatori,
 * quindi `referencedBy: 3` — ma `stop` e `fault` sono gia' due degli uscenti di
 * `Running.outgoing`, e la colonna entrante resta con il solo `start`.
 *
 * ── Perche' `referencedBy` e' un numero e non dei nodi ────────────────────────
 *
 * Perche' e' lo STESSO numero della colonna «referenced by» della tabella
 * (`instanceTable.tableRow`: `referencedByAll.filter(r => !r.composition)`, per
 * puntatore). Una riga che dice 3 e un diagramma sotto di essa che ne disegna 1
 * sono due letture in contraddizione a due centimetri di distanza; qui il
 * diagramma disegna i NODI e il footer dichiara i PUNTATORI, e i due conteggi
 * portano nomi diversi perche' contano cose diverse.
 *
 * ── L'invariante della directory ──────────────────────────────────────────────
 *
 * Un solo import, di tipo, da `./shape`, come `layout.ts` e `outline.ts`. Niente
 * da `joiner/`, `redux/`, `react` o `components/`.
 */

import type { IncomingRef } from './shape';

// ── Ingresso ────────────────────────────────────────────────────────────────

/** Un'istanza, ridotta a cio' che una scatola larga 132px riesce a dire. */
export interface EgoInstance {
    id: string;
    name: string;
    /** Nome della metaclasse. Vuoto quando non risolve. */
    cls: string;
}

/** Un puntatore USCENTE del soggetto: una posizione piena di uno slot di
 *  riferimento non di contenimento. Uno per posizione, non uno per slot — uno
 *  slot multivalore con tre valori sono tre voci. */
export interface EgoPointer {
    featureKey: string;
    /** L'id puntato, sempre presente: e' cio' che identifica un nodo `broken`. */
    targetId: string;
    /** L'istanza puntata, o null quando il puntatore non risolve. */
    target: EgoInstance | null;
}

export interface EgoInput {
    subject: EgoInstance;
    /** I puntatori uscenti, nell'ordine in cui l'ospite li ha letti — che e'
     *  l'ordine di dichiarazione della shape, perche' e' cosi' che li legge. */
    outgoing: EgoPointer[];
    /** Ogni puntatore diretto al soggetto, contenimento incluso e marcato: la
     *  risposta di `ShapeCtx.referencedBy`, verbatim. Il filtro sul contenimento
     *  e' qui, non nel chiamante, perche' e' una regola del disegno. */
    incoming: IncomingRef[];
}

// ── Uscita ──────────────────────────────────────────────────────────────────

/** `more` e' il nodo SINTETICO del cap: non e' un'istanza, non si seleziona, e
 *  porta al canvas. `broken` e' un puntatore che non risolve — reso, mai saltato,
 *  come nella tabella e nell'outline. */
export type EgoKind = 'object' | 'broken' | 'more';

/** Dove un nodo sta: le due colonne, piu' la banda dell'owner (FL7).
 *
 *  `'owner'` vuol dire «ha una scatola propria, sopra a sinistra». Un owner che
 *  e' anche un vicino NON lo porta: porta il `side` della sua colonna, ed e' il
 *  modo in cui questo tipo dice «disegnato una volta sola». */
export type EgoSide = 'incoming' | 'outgoing' | 'owner';

/** Un nodo del nastro. Il prompt lo chiama `NodeRef`; qui porta il prefisso della
 *  famiglia perche' `jjform/` e' una directory sola e un `NodeRef` nudo non
 *  direbbe di quale disegno e'. */
export interface EgoNode {
    id: string;
    name: string;
    cls: string;
    kind: EgoKind;
    side: EgoSide;
    /** Le chiavi di feature che legano questo vicino al soggetto, dedotte e in
     *  ordine di incontro. Piu' di una quando fra la stessa coppia corrono due
     *  riferimenti — che e' l'unica cosa che li distingue. Vuoto per `more`. */
    featureKeys: string[];
    /** Solo per `kind === 'more'`: quanti vicini di quel lato non sono disegnati. */
    more?: number;
}

export interface EgoCounts {
    /** Nodi entranti VERI, prima del cap e senza il sintetico. */
    incoming: number;
    outgoing: number;
    /** Puntatori entranti non di contenimento: il numero della colonna della
     *  tabella, non il numero delle scatole. */
    referencedBy: number;
}

export interface Ego {
    subject: EgoNode;
    /** Al piu' `EGO_MAX_PER_SIDE` nodi veri, piu' il sintetico `more` in coda
     *  quando ce n'erano di piu'. */
    incoming: EgoNode[];
    outgoing: EgoNode[];
    /** Il padre di CONTENIMENTO, o `null` quando il modello possiede il soggetto
     *  direttamente — un'istanza rootable non ha owner, e la radice del modello
     *  non e' un nodo di questo disegno.
     *
     *  Quando l'owner e' anche un vicino, questo campo e' quel nodo, per
     *  IDENTITA': `ego.owner === ego.incoming[k]` e' vero, e il suo `side` non e'
     *  `'owner'`. Chi rende disegna la scatola dell'owner solo per
     *  `owner.side === 'owner'`. */
    owner: EgoNode | null;
    counts: EgoCounts;
}

/** Quanti vicini per lato il nastro disegna prima di riassumere. Quattro perche'
 *  quattro scatole da 40px piu' i distacchi stanno nell'altezza che una riga
 *  espansa puo' prendersi senza spingere fuori schermo la riga dopo. */
export const EGO_MAX_PER_SIDE = 4;

// ── La proiezione ───────────────────────────────────────────────────────────

/** Aggiunge una chiave di feature a un nodo senza ripeterla. */
function addKey(node: EgoNode, key: string | null | undefined): void {
    if (!key) return;
    if (node.featureKeys.includes(key)) return;
    node.featureKeys.push(key);
}

/** Applica il cap: i primi `EGO_MAX_PER_SIDE`, piu' il sintetico se ne restano.
 *  Il sintetico e' un NODO nell'array e non un campo a parte, cosi' il renderer
 *  mappa una lista sola e non ha un caso in coda da ricordarsi. */
function capped(nodes: EgoNode[], side: EgoSide): EgoNode[] {
    if (nodes.length <= EGO_MAX_PER_SIDE) return nodes;
    const rest = nodes.length - EGO_MAX_PER_SIDE;
    const more: EgoNode = {
        id: `${side}:+${rest}`,
        name: `+${rest} more`,
        cls: '',
        kind: 'more',
        side,
        featureKeys: [],
        more: rest,
    };
    return [...nodes.slice(0, EGO_MAX_PER_SIDE), more];
}

/**
 * Il vicinato a UN salto, come tre insiemi e tre conteggi.
 *
 * L'ordine e' quello d'ingresso — dichiarazione della shape per gli uscenti,
 * ordine della risalita per gli entranti — e non alfabetico, per la ragione di
 * `salientValue`: riordinare qui farebbe litigare il nastro con la form sopra.
 */
export function egoNeighborhood(input: EgoInput | null | undefined): Ego {
    const subjectId = input?.subject?.id ?? '';
    const subject: EgoNode = {
        id: subjectId,
        name: input?.subject?.name ?? '',
        cls: input?.subject?.cls ?? '',
        kind: 'object',
        side: 'outgoing',        // il soggetto non ha lato; il campo esiste per il tipo
        featureKeys: [],
    };
    const empty: Ego = {
        subject,
        incoming: [],
        outgoing: [],
        owner: null,
        counts: { incoming: 0, outgoing: 0, referencedBy: 0 },
    };
    if (!input || !subjectId) return empty;

    // Uscenti. Un auto-riferimento NON diventa un vicino: il soggetto e' gia' al
    // centro, e disegnarlo anche di lato sarebbe la seconda scatola con lo stesso
    // nome che questa precedenza esiste per evitare.
    const outByI: EgoNode[] = [];
    const byId = new Map<string, EgoNode>();
    for (const p of input.outgoing ?? []) {
        const id = p?.target?.id || p?.targetId || '';
        if (!id || id === subjectId) { addKey(subject, p?.featureKey); continue; }
        let node = byId.get(id);
        if (!node) {
            node = p.target
                ? { id, name: p.target.name ?? '', cls: p.target.cls ?? '', kind: 'object', side: 'outgoing', featureKeys: [] }
                : { id, name: '', cls: '', kind: 'broken', side: 'outgoing', featureKeys: [] };
            byId.set(id, node);
            outByI.push(node);
        }
        addKey(node, p.featureKey);
    }

    // Entranti. Il contenimento e' fuori — «an owner is not a referrer», la stessa
    // riga di `instanceTable.tableRow` — e cio' che resta e' insieme il conteggio
    // di `referencedBy` e la sorgente dei nodi entranti.
    const pointers = (input.incoming ?? []).filter(r => r && !r.composition);
    const inByI: EgoNode[] = [];
    for (const r of pointers) {
        const id = r.instanceId ?? '';
        if (!id || id === subjectId) { addKey(subject, r.featureKey); continue; }
        const existing = byId.get(id);
        if (existing) { addKey(existing, r.featureKey); continue; }   // gia' uscente: l'uscente vince
        const node: EgoNode = {
            id,
            name: r.instanceName ?? '',
            cls: r.instanceClass ?? '',
            kind: 'object',
            side: 'incoming',
            featureKeys: [],
        };
        addKey(node, r.featureKey);
        byId.set(id, node);
        inByI.push(node);
    }

    // L'owner: il puntatore di CONTENIMENTO diretto al soggetto, cioe' l'unica
    // voce che il filtro qui sopra ha scartato. Si cerca per ultimo perche' la
    // sua precedenza e' l'ultima: se quell'istanza ha gia' un nodo, quello e'
    // l'owner — una scatola sola, e la chiave del contenimento le si aggiunge.
    //
    // Nessuna voce di contenimento vuol dire owner assente, ed e' esattamente il
    // caso rootable: il `father` di un'istanza radice e' il MODELLO, che non e'
    // un `DObject` e la cui collezione non e' uno slot, quindi `referencedBy` non
    // lo produce mai. Il null non e' un caso limite gestito qui — e' il silenzio
    // della sorgente, letto per quello che dice.
    const drawnIn = capped(inByI, 'incoming');
    const drawnOut = capped(outByI, 'outgoing');

    const ownerRef = (input.incoming ?? []).find(
        r => r && r.composition && r.instanceId && r.instanceId !== subjectId,
    );
    let owner: EgoNode | null = null;
    if (ownerRef) {
        const existing = byId.get(ownerRef.instanceId) ?? null;
        owner = existing ?? {
            id: ownerRef.instanceId,
            name: ownerRef.instanceName ?? '',
            cls: ownerRef.instanceClass ?? '',
            kind: 'object',
            side: 'owner',
            featureKeys: [],
        };
        // «Una volta sola» vuol dire una volta DISEGNATA. Un vicino che il cap ha
        // tagliato fuori dalla sua colonna non e' da nessuna parte, e lasciargli
        // il `side` della colonna nasconderebbe l'owner dietro un «+n more».
        // La banda, che il cap non tocca, se lo riprende.
        if (!existing || !(drawnIn.includes(existing) || drawnOut.includes(existing))) {
            owner.side = 'owner';
        }
        addKey(owner, ownerRef.featureKey);
    }

    return {
        subject,
        incoming: drawnIn,
        outgoing: drawnOut,
        owner,
        counts: {
            incoming: inByI.length,
            outgoing: outByI.length,
            referencedBy: pointers.length,
        },
    };
}

/** Che cosa legge una scatola. Stessa regola di `neighborLabel` (13a) e di
 *  `outlineLabel`: una scatola senza testo non si clicca con fiducia, e la
 *  tabella sopra scrive gia' `unnamed` nello stesso stato. */
export function egoLabel(node: EgoNode | null | undefined): string {
    if (!node) return '';
    if (node.kind === 'more') return node.name;
    if (node.kind === 'broken') return 'dangling pointer';
    const name = (node.name ?? '').trim();
    return name.length > 0 ? name : 'unnamed';
}

/**
 * Il footer, come testo: «N incoming · M outgoing · referenced by K».
 *
 * La congiunzione e' qui e non nel componente perche' i tre numeri hanno un
 * ordine e delle unita', e due superfici che li componessero da sole
 * divergerebbero.
 *
 * L'ultima clausola CADE quando K e' zero, ed e' la sola asimmetria: «referenced
 * by 0» accanto a un disegno che non ha una colonna entrante ripete con un numero
 * cio' che il disegno gia' dice con un vuoto. Un'istanza isolata legge quindi
 * «0 incoming · 0 outgoing», che e' la frase del prompt.
 */
export function egoSummary(counts: EgoCounts | null | undefined): string {
    const c = counts ?? { incoming: 0, outgoing: 0, referencedBy: 0 };
    const head = `${c.incoming} incoming · ${c.outgoing} outgoing`;
    return c.referencedBy > 0 ? `${head} · referenced by ${c.referencedBy}` : head;
}

// ── Il click ────────────────────────────────────────────────────────────────

/** L'unica interazione del nastro, come dato: selezionare quell'istanza, aprire
 *  il canvas, o niente. */
export type EgoAction =
    | { kind: 'select'; id: string }
    | { kind: 'canvas' }
    | { kind: 'none' };

/**
 * Che cosa fa un click su un nodo.
 *
 * Il soggetto non si clicca — e' gia' selezionato, e offrire una navigazione che
 * non muove niente e' rumore (stessa scelta di 13a). Un `broken` non si clicca
 * perche' non c'e' niente da selezionare. Il sintetico `more` porta al canvas, e
 * ci porta con lo STESSO gesto di «open in canvas»: e' l'unico posto dove il
 * quinto vicino esiste.
 *
 * L'owner non ha nessun ramo qui, ed e' voluto: decide su `kind`, non su `side`,
 * e un owner e' un `object` con un id come ogni altro. Cliccarlo seleziona quella
 * istanza, che e' cio' che il prompt di FL7 chiede — «click = selezione, come
 * ogni nodo» — e cio' che si otterrebbe comunque scrivendo di meno.
 */
export function egoAction(node: EgoNode | null | undefined, subjectId?: string): EgoAction {
    if (!node) return { kind: 'none' };
    if (node.kind === 'more') return { kind: 'canvas' };
    if (node.kind === 'broken') return { kind: 'none' };
    if (!node.id || node.id === subjectId) return { kind: 'none' };
    return { kind: 'select', id: node.id };
}

export interface EgoHandlers {
    /** La STESSA azione della riga di tabella: espande e carica la form. Il
     *  nastro e' un terzo emettitore della selezione condivisa, non una terza
     *  sincronia. */
    onSelect: (instanceId: string) => void;
    /** «open in canvas», identico per il link d'intestazione, per «show all» e
     *  per il nodo sintetico. */
    onOpenInCanvas: () => void;
}

/**
 * Instrada un click e dice che cosa ha fatto.
 *
 * Esiste come funzione, invece che come due `if` nel componente, perche' e' la
 * sola parte interattiva della slice e la suite gira in node: senza jsdom un
 * `onClick` nel JSX non e' verificabile, questa lo e'.
 */
export function egoDispatch(
    node: EgoNode | null | undefined,
    handlers: EgoHandlers,
    subjectId?: string,
): EgoAction {
    const action = egoAction(node, subjectId);
    if (action.kind === 'select') handlers.onSelect(action.id);
    else if (action.kind === 'canvas') handlers.onOpenInCanvas();
    return action;
}

/** «show all» del footer. Apre il canvas filtrato: non espande il diagramma, che
 *  a due salti sarebbe un grafo che nessuno legge dentro una riga. */
export function egoShowAll(handlers: EgoHandlers): EgoAction {
    handlers.onOpenInCanvas();
    return { kind: 'canvas' };
}

// ── Le posizioni ────────────────────────────────────────────────────────────
// Layout FISSO: aritmetica su tre colonne, zero misure e zero stato. Sta qui e
// non nel componente perche' le stesse costanti dimensionano le scatole (CSS) e
// disegnano le frecce (SVG), e due copie divergono al primo ritocco.

export const EGO_NODE_W = 132;
export const EGO_NODE_H = 40;
export const EGO_SUBJECT_W = 168;
export const EGO_SUBJECT_H = 48;
/** Spazio fra una colonna e il soggetto: e' dove corrono le frecce. */
export const EGO_COL_GAP = 56;
/** Spazio verticale fra due scatole della stessa colonna. */
export const EGO_ROW_GAP = 12;

export interface EgoPlacedNode extends EgoNode {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface EgoArrow {
    /** Id del nodo vicino a cui la freccia appartiene. */
    nodeId: string;
    side: EgoSide;
    /** Cubica gia' pronta per l'attributo `d`. */
    d: string;
}

export interface EgoLayout {
    width: number;
    height: number;
    subject: EgoPlacedNode;
    incoming: EgoPlacedNode[];
    outgoing: EgoPlacedNode[];
    /** La scatola dell'owner, quando ne ha una propria (`owner.side === 'owner'`).
     *  `null` anche quando `ego.owner` non e' null: e' il caso dell'owner che e'
     *  gia' disegnato come vicino. */
    owner: EgoPlacedNode | null;
    /** Il legame di contenimento, gia' pronto per `d`. Fuori da `arrows`, e non
     *  per ordine: non ha punta (il contenimento non ha un verso da leggere, ha
     *  un sopra e un sotto) e non ha ventaglio, quindi il renderer lo deve
     *  distinguere comunque. `null` quando la scatola non c'e'. */
    ownerLink: string | null;
    arrows: EgoArrow[];
}

/** Altezza di una colonna di `n` scatole. */
function columnHeight(n: number): number {
    return n <= 0 ? 0 : n * EGO_NODE_H + (n - 1) * EGO_ROW_GAP;
}

/**
 * Le tre colonne, centrate l'una sull'altra.
 *
 * Una colonna VUOTA non occupa spazio e non ha frecce: zero entranti vuol dire
 * che il nastro comincia dal soggetto, non che c'e' una colonna vuota a
 * sinistra. E' la stessa regola di `neighborhoodLayout`, e vale il doppio qui,
 * dove la larghezza e' quella di una riga di tabella.
 *
 * Nessun `y` negativo per costruzione: l'altezza totale e' il massimo delle tre,
 * e ogni colonna si centra dentro di essa.
 *
 * ── La banda dell'owner (FL7) ─────────────────────────────────────────────────
 *
 * Quando l'owner ha una scatola propria, il nastro guadagna in TESTA una banda
 * alta quanto una scatola piu' un distacco, e le tre colonne scendono di
 * altrettanto. Le `x` non si muovono: l'owner sta a sinistra del soggetto di un
 * `EGO_COL_GAP` — la sola unita' orizzontale che questo disegno ha — e a `x` zero
 * quando la sottrazione andrebbe sotto zero, cioe' quando non c'e' colonna
 * entrante e il soggetto e' gia' contro il bordo. Sopra e a sinistra finche' c'e'
 * un a sinistra; sopra, quando non c'e'.
 *
 * Senza owner la banda vale zero e ogni misura di questa funzione e' quella di
 * FL5, alla cifra.
 */
export function egoLayout(ego: Ego | null | undefined): EgoLayout {
    const subjectNode: EgoNode = ego?.subject ?? {
        id: '', name: '', cls: '', kind: 'object', side: 'outgoing', featureKeys: [],
    };
    const incoming = ego?.incoming ?? [];
    const outgoing = ego?.outgoing ?? [];
    const ownerNode = ego?.owner ?? null;
    /** Solo l'owner con scatola propria costa una banda: quello gia' disegnato
     *  come vicino e' nella sua colonna e non chiede altezza. */
    const ownerBoxed = ownerNode !== null && ownerNode.side === 'owner';
    const band = ownerBoxed ? EGO_NODE_H + EGO_ROW_GAP : 0;

    const inH = columnHeight(incoming.length);
    const outH = columnHeight(outgoing.length);
    const bodyH = Math.max(inH, outH, EGO_SUBJECT_H);
    const height = band + bodyH;

    const step = EGO_NODE_W + EGO_COL_GAP;
    const subjectX = incoming.length > 0 ? step : 0;
    const outgoingX = subjectX + EGO_SUBJECT_W + EGO_COL_GAP;
    const columnsW = outgoingX + (outgoing.length > 0 ? EGO_NODE_W : -EGO_COL_GAP);
    const ownerX = Math.max(0, subjectX - EGO_COL_GAP);
    const width = ownerBoxed ? Math.max(columnsW, ownerX + EGO_NODE_W) : columnsW;

    const subject: EgoPlacedNode = {
        ...subjectNode,
        x: subjectX,
        y: band + (bodyH - EGO_SUBJECT_H) / 2,
        w: EGO_SUBJECT_W,
        h: EGO_SUBJECT_H,
    };

    const place = (nodes: EgoNode[], x: number, total: number): EgoPlacedNode[] => {
        const top = band + (bodyH - total) / 2;
        return nodes.map((n, i) => ({
            ...n,
            x,
            y: top + i * (EGO_NODE_H + EGO_ROW_GAP),
            w: EGO_NODE_W,
            h: EGO_NODE_H,
        }));
    };
    const placedIn = place(incoming, 0, inH);
    const placedOut = place(outgoing, outgoingX, outH);

    // Il ventaglio: una cubica con i punti di controllo a meta' del corridoio.
    // Con un nodo solo i due estremi sono alla stessa quota e la curva e' una
    // retta; con piu' di uno le curve si aprono senza sovrapporsi.
    const curve = (x1: number, y1: number, x2: number, y2: number): string => {
        const dx = (x2 - x1) / 2;
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    };
    const subjectMidY = subject.y + subject.h / 2;
    const arrows: EgoArrow[] = [
        ...placedIn.map(n => ({
            nodeId: n.id,
            side: 'incoming' as EgoSide,
            d: curve(n.x + n.w, n.y + n.h / 2, subject.x, subjectMidY),
        })),
        ...placedOut.map(n => ({
            nodeId: n.id,
            side: 'outgoing' as EgoSide,
            d: curve(subject.x + subject.w, subjectMidY, n.x, n.y + n.h / 2),
        })),
    ];

    // L'owner e il suo legame. Una RETTA, dal bordo basso della scatola al bordo
    // alto del soggetto, e senza punta: e' l'opzione 1a della board 13a, dove la
    // linea dell'owner e' l'unica delle tre senza `marker-end`. Una cubica come
    // quelle dei riferimenti direbbe che e' la stessa specie di legame.
    const owner: EgoPlacedNode | null = ownerBoxed && ownerNode
        ? { ...ownerNode, x: ownerX, y: 0, w: EGO_NODE_W, h: EGO_NODE_H }
        : null;
    const ownerLink = owner
        ? `M ${owner.x + owner.w / 2} ${owner.y + owner.h} `
          + `L ${subject.x + subject.w / 2} ${subject.y}`
        : null;

    return { width, height, subject, incoming: placedIn, outgoing: placedOut, owner, ownerLink, arrows };
}
