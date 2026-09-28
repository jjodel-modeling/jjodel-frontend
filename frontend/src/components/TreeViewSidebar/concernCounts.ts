/**
 * concernCounts — i tre concern sotto `VIEWPOINTS`: chi finisce dove, e quanti sono
 * (R-VAL-19, emendata da R-VAL-19-bis).
 *
 * MODULO PURO, E SENZA UN SOLO IMPORT. Non e' un vezzo: `TreeViewContent.tsx` importa il
 * barrel di `editor-v2/`, che arriva a monaco, che dereferenzia `window` all'import — e
 * `vitest.config.ts` dichiara `environment: 'node'`, quindi un test che importasse il
 * componente morirebbe prima del primo `it`. Finche' la formula dei conteggi viveva
 * dentro il componente, l'unica rete possibile era una `toContain` sulla stringa del
 * sorgente: un verde che non ha mai visto girare niente, cioe' il caso che P11 chiama
 * «indistinguibile dal rosso che avrebbe dovuto esserci». Qui la formula si chiama.
 *
 * L'esclusione del singleton del Data Manager entra come PREDICATO e non come costante
 * importata, perche' `isDataManagerViewpointId` vive in `view/viewPoint/viewpoint.ts`,
 * che a sua volta importa dal barrel: prenderla di qui rimetterebbe monaco nel grafo e
 * annullerebbe la ragione per cui questo file esiste.
 */

/** Il minimo che serve per smistare: il resto della riga non c'entra col conteggio. */
export interface ConcernViewpoint {
    id: string;
    vpType: string;
}

export interface ConcernBuckets<T extends ConcernViewpoint> {
    syntax: T[];
    /** `DViewPoint` con `isValidation` — i viewpoint di validazione «vecchia maniera»,
     *  che raccolgono view e non regole. Convivono sotto lo stesso concern con i
     *  `DValidationViewpoint`, che invece portano le regole. */
    validation: T[];
    other: T[];
}

/**
 * Smista i viewpoint nei tre secchi per tipo, escludendo quelli per cui `isExcluded`
 * risponde vero — oggi il solo singleton del Data Manager, che ha un concern suo.
 *
 * L'esclusione precede lo smistamento di proposito: `other` e' un catch-all, e un
 * singleton che ci cadesse dentro comparirebbe come viewpoint sciolto sotto
 * «Viewpoints», che e' esattamente cio' che R-DMV-5 ha tolto.
 */
export function partitionByConcern<T extends ConcernViewpoint>(
    list: readonly T[],
    isExcluded: (id: string) => boolean,
): ConcernBuckets<T> {
    const syntax: T[] = [];
    const validation: T[] = [];
    const other: T[] = [];
    for (const vp of list) {
        if (isExcluded(vp.id)) continue;
        if (vp.vpType === 'syntax') syntax.push(vp);
        else if (vp.vpType === 'validation') validation.push(vp);
        else other.push(vp);
    }
    return { syntax, validation, other };
}

export interface ConcernCountsInput {
    /** `DViewPoint` di tipo `syntax`. */
    syntaxViewpoints: number;
    /** `DViewPoint` con `isValidation`: viewpoint anche loro, e stanno sotto VALIDATION. */
    validationViews: number;
    /** Tutto il resto (oggi `decoration`): reso sciolto sotto VIEWPOINTS, senza concern. */
    otherViewpoints: number;
    /** `DValidationViewpoint`, quelli che portano le regole. */
    validationViewpoints: number;
    /** Il singleton del Data Manager: 0 finche' nessuno ci ha scritto, poi 1 (R-DMV-6). */
    dataManagerViewpoints: number;
}

export interface ConcernCounts {
    syntax: number;
    dataManager: number;
    validation: number;
    /** Quello che `VIEWPOINTS` mostra: la somma dei tre concern piu' i viewpoint sciolti. */
    total: number;
}

/**
 * I quattro numeri dell'albero.
 *
 * OGNI RIGA CONTA VIEWPOINT, a ogni livello (R-VAL-19-bis (b)). Prima di questa decisione
 * la riga del Data Manager contava **classi personalizzate**, che e' un'altra specie di
 * numero accanto a una riga che sembra omologa; quel dato non si perde, lo dice a parole
 * la riga di stato del concern, che gia' esisteva per dirlo.
 */
export function concernCounts(i: ConcernCountsInput): ConcernCounts {
    const validation = i.validationViews + i.validationViewpoints;
    return {
        syntax: i.syntaxViewpoints,
        dataManager: i.dataManagerViewpoints,
        validation,
        total: i.syntaxViewpoints + i.dataManagerViewpoints + validation + i.otherViewpoints,
    };
}
