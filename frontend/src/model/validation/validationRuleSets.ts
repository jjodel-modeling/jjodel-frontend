/**
 * Le due decisioni dell'authoring che si possono provare (R-VAL, Step 4).
 *
 * Modulo puro, **senza import verso `joiner`**, per la ragione ormai stabilita in questa
 * corsia: `validationAuthoring.ts` scrive nel D-layer e quindi tocca `window`, e nella
 * suite — `environment: 'node'` — non si importa. Quello che qui si decide non e' una
 * scrittura ma una **classificazione**, ed e' la classificazione che una prova deve poter
 * raggiungere.
 *
 * ── PROPRIE ED EREDITATE SONO DUE INSIEMI, NON UNO (R-VAL-12) ───────────────
 *
 * Su una classe valgono le sue regole **e tutte quelle delle superclassi**, e si valutano
 * tutte: nessuna sovrascrive nessuna, un nome uguale non crea override. L'ambiente di
 * authoring deve pero' mostrarle **distinte e le ereditate in sola lettura**, perche' la
 * regola ereditata si modifica dove e' stata scritta e non dove capita di vederla; e
 * senza vederle affatto il designer riscrive un vincolo che gia' esisteva piu' su.
 *
 * La partizione e' quindi parte del significato dell'interfaccia, non un dettaglio di
 * resa, ed e' per questo che sta qui invece che dentro il componente.
 */

/** Il minimo che serve per classificare una regola. Volutamente non e' una
 *  `DValidationRule`: questo modulo non conosce il D-layer. */
export interface RuleLike {
    id: string;
    name: string;
    /** Il puntatore alla classe M2 di contesto. */
    context: string;
}

export interface RulePartition<R extends RuleLike> {
    /** Definite sulla classe scelta: modificabili. */
    own: R[];
    /**
     * Ereditate da una superclasse: in sola lettura, e ciascuna sa **da dove** viene.
     * Il nome della classe di origine non e' decorazione: senza, «in sola lettura» non
     * dice dove si va a modificarla.
     */
    inherited: Array<{ rule: R; fromClassId: string }>;
}

/**
 * Divide le regole applicabili a una classe fra proprie ed ereditate.
 *
 * `superclassIds` e' la catena delle superclassi. Se contiene anche `classId` — e
 * `LClass.allSuperClasses` lo fa, perche' chiama `get_superclasses(c, true)` — non
 * cambia niente: la classe propria e' controllata per prima e vince, cosi' una regola
 * della classe non compare mai anche fra le ereditate.
 *
 * L'ordine dell'uscita e' quello dell'ingresso, che e' l'unico deterministico: le regole
 * non hanno una precedenza fra loro (R-VAL-12), quindi non c'e' un ordine «giusto» da
 * imporre e inventarne uno suggerirebbe una gerarchia che non esiste.
 */
export function partitionRulesByClass<R extends RuleLike>(
    rules: readonly R[],
    classId: string,
    superclassIds: readonly string[],
): RulePartition<R> {
    const own: R[] = [];
    const inherited: Array<{ rule: R; fromClassId: string }> = [];
    if (!classId) return { own, inherited };
    const supers = new Set(superclassIds.filter(id => id && id !== classId));
    for (const r of rules) {
        if (r.context === classId) own.push(r);
        else if (supers.has(r.context)) inherited.push({ rule: r, fromClassId: r.context });
    }
    return { own, inherited };
}

/**
 * Il nome di una regola nuova: `rule_0`, `rule_1`, … il primo libero.
 *
 * Libero rispetto ai nomi **gia' presi nel viewpoint**, non solo a quelli della classe:
 * i nomi sono unici dentro il viewpoint (spec §4.1), e due regole omonime su due classi
 * diverse renderebbero illeggibile la lista delle violazioni, dove il nome della regola
 * e' l'unica cosa che le distingue.
 *
 * Non e' un'imposizione: R-VAL-4 vieta di bloccare una scrittura, e l'utente puo'
 * rinominare come vuole. Questa funzione sceglie solo il valore di partenza.
 */
export function nextRuleName(existingNames: readonly string[], prefix = 'rule_'): string {
    const taken = new Set(existingNames);
    for (let i = 0; i < existingNames.length + 1; i++) {
        const candidate = prefix + i;
        if (!taken.has(candidate)) return candidate;
    }
    // Irraggiungibile: fra `length + 1` candidati distinti e `length` nomi presi almeno
    // uno e' libero. La riga esiste perche' il tipo di ritorno sia `string` e non
    // `string | undefined`, non perche' il caso possa capitare.
    return prefix + existingNames.length;
}
