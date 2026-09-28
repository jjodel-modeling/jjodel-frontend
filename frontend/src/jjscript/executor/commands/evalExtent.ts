/**
 * L'estensione del contesto di valutazione: quali modelli M1 entrano nel pool.
 *
 * Un modulo suo, minuscolo e **senza import verso `joiner`**, per una ragione sola e
 * verificabile: `eval.ts` importa `store` e `LPointerTargetable`, quindi tocca `window`
 * alla prima riga e **non si puo' importare in un test** (la suite gira con
 * `environment: 'node'` — e' la stessa ragione per cui `context-binding.test.ts` e' fra i
 * file rossi da sempre). La decisione che questo file prende e' esattamente quella che
 * R-VAL-16 chiede di poter provare, quindi vive dove una prova la raggiunge.
 *
 * ── PERCHE' LA RESTRIZIONE STA QUI E NON A VALLE (R-VAL-16) ─────────────────
 *
 * `buildEvalContext` deriva TUTTO dal pool raccolto in un punto solo, e l'estensione
 * ricompare in cinque posti diversi a valle:
 *   1. `variables.instances`, il pool globale;
 *   2. `instances` / `allInstances` / `instanceCount` sulla shell di ogni classe;
 *   3. le istanze qualificate per nome sulla shell (`State.Green`);
 *   4. le istanze legate per nome nudo al primo livello;
 *   5. la mappa delle ambiguita' di nome, che decide quali nomi NON legare.
 *
 * Filtrare il valore di ritorno vorrebbe dire enumerare quei cinque posti fuori dal
 * modulo che li crea, e mancare in silenzio il sesto il giorno che arriva. Restringere il
 * pool a monte li copre tutti per costruzione, e le shell nascono gia' ristrette invece
 * di essere ricostruite: e' il vincolo di accettazione di R-VAL-16, perche' ricostruirle
 * romperebbe `self.instanceOf == State`, che vale **per identita' di riferimento**.
 */

/**
 * I modelli M1 che entrano nel pool.
 *
 * Senza `extentModelId` restituisce l'elenco **immutato** — e immutato vuol dire lo
 * stesso array, non una copia con lo stesso contenuto: e' il percorso di console,
 * JjScript e Jjodie, e non deve cambiare di una virgola.
 *
 * Con `extentModelId` restituisce il solo modello con quell'id. Se nessun modello lo
 * porta, restituisce l'elenco **vuoto** e non l'elenco intero: un'estensione richiesta e
 * non trovata e' zero istanze, non tutte. La differenza si vede nella superficie, che
 * dichiara su quante istanze ha girato (R-VAL-14), invece di produrre verdetti su un
 * insieme che nessuno ha chiesto.
 */
export function selectExtentModels<T extends { id?: unknown }>(
    m1models: readonly T[],
    extentModelId?: string,
): readonly T[] {
    if (!extentModelId) return m1models;
    return m1models.filter(m => m?.id === extentModelId);
}
