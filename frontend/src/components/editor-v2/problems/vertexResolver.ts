/**
 * L'ancoraggio al canvas, in un posto solo.
 *
 * ── PERCHE' ESISTE ──────────────────────────────────────────────────────────
 *
 * Il registro dei problemi e' chiavato per id di nodo, e le sue superfici indicizzano
 * su spazi di id DIVERSI: il rail e l'albero chiedono l'id del **DObject**, il canvas
 * monta `NodeProblemIndicator` con l'id del nodo React Flow, che e' l'id del
 * **DVertex** (`EditorV2.tsx:795-796`). Un produttore che voglia accendere entrambe le
 * superfici registra due volte, e per farlo gli serve la traduzione fra i due spazi.
 *
 * Questa era una funzione privata di `ConformanceProblemSync`, e il produttore delle
 * violazioni di validazione ne ha bisogno della stessa. Copiarla sarebbe stata la
 * QUARTA scrittura della stessa scansione: la mappatura DObject -> DVertex esiste gia'
 * in `sync/canvasToJjom.ts:1347` (`findVertexIdForObject`, privata, critical zone) e in
 * `EditorV2.tsx:181` (`irVertexIdForObject`, privata). Tre logiche di ancoraggio in tre
 * posti mentono in silenzio appena una cambia — e il silenzio e' esattamente il modo di
 * fallire che questa fetta esiste per chiudere.
 *
 * Le altre due copie restano dove sono, e la ragione e' di perimetro, non di merito:
 * `canvasToJjom.ts` e' critical zone (CLAUDE.md §3.1) e non si tocca in questo giro,
 * `EditorV2.tsx` e' fuori dal perimetro dichiarato. Sono iscritte qui perche' chi
 * passera' di la' sappia che questo modulo esiste.
 *
 * ── PERCHE' PRENDE `idlookup` E NON LEGGE LO STORE ──────────────────────────
 *
 * Importare `store` significherebbe importare il barrel `joiner`, che tira dentro
 * Monaco, che tocca `window` al momento dell'import: un test in ambiente `node` — che e'
 * l'ambiente della suite (`vitest.config.ts:14`) — non riuscirebbe a caricare il modulo.
 * E' la stessa ragione per cui `formDiagnostics.ts` e `conformanceToProblems.ts` sono
 * moduli puri. La lettura dello store resta al chiamante, che ce l'ha gia'.
 *
 * ── LA FORMA E' A LOTTO, NON A LOOKUP ───────────────────────────────────────
 *
 * Si costruisce la mappa una volta e la si interroga N volte, perche' i chiamanti
 * risolvono un INSIEME di oggetti in un colpo solo (le violazioni di un giro). Le due
 * copie private hanno la forma opposta — una scansione per chiamata — che su N oggetti
 * costa N volte la lista dei `subElements`.
 *
 * La mappa e' ISTANTANEA: fotografa `idlookup` al momento della costruzione e non e'
 * reattiva. Va ricostruita a ogni giro, come fanno entrambi i chiamanti.
 */

/** Da id di DObject a id del DVertex che lo porta nel grafo aperto, o `null`. */
export type VertexResolver = (objectId: string) => string | null;

/**
 * Costruisce il risolutore per UN grafo, scandendone i `subElements`.
 *
 * Restituisce `() => null` quando il grafo non e' noto — nessun grafo aperto, o un id
 * che `idlookup` non conosce. E' il caso normale e non un errore: il produttore
 * registra allora la sola voce del DObject, e il canvas resta spento perche' non c'e'
 * canvas.
 *
 * L'ambito e' il grafo passato, e non il progetto: lo stesso oggetto puo' avere un
 * vertice in piu' grafi, e quello che interessa e' il vertice del grafo APERTO.
 */
export function buildVertexResolver(
    idlookup: Record<string, unknown> | undefined,
    graphId: string | null | undefined,
): VertexResolver {
    if (!graphId || !idlookup) return () => null;
    const graph = idlookup[graphId] as { subElements?: string[] } | undefined;
    const subEls = graph?.subElements ?? [];
    const map = new Map<string, string>();
    for (const id of subEls) {
        const ge = idlookup[id] as { className?: string; model?: string } | undefined;
        if (ge?.className === 'DVertex' && ge.model) map.set(ge.model, id);
    }
    return (objectId: string) => map.get(objectId) ?? null;
}
