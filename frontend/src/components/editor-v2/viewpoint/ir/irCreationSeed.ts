/**
 * irCreationSeed — the IR a view is born with (R-IRN-4, slice 1 del collasso IR-nativo).
 *
 * Fino alla slice 1 nessun sito di prodotto seedava `ir`: ogni view creata dall'utente
 * nasceva senza notazione e rendeva astratto, cioè come se non esistesse, finché l'autore
 * non passava dal gate `EnableIRPanel` (discovery 2026-08-13, aree A ed E). Questo modulo
 * calcola il seed che i gesti di creazione scrivono direttamente nella callback di
 * `DViewElement.new2`, così la view nasce viva.
 *
 * Il seed riproduce il COMPORTAMENTO di `EnableIRPanel.enable()`
 * (`authoring/EnableIRPanel.tsx:80-108`) con una differenza voluta: l'identità della
 * metaclasse arriva dal gesto di creazione, che la conosce, invece che da
 * `appliableToClasses`. Quel campo mescola nomi di tipo D-level e pointer M2, e sui due
 * gesti manuali contiene solo D-level (`['DObject']`, `['DModel']`, ...): passarci
 * attraverso avrebbe prodotto sempre il wildcard, che è il difetto misurato dalla
 * discovery (rischio R3). Il modulo non legge `appliableToClasses` e non importa
 * `resolveMetaclassNames`.
 *
 * Puro per contratto, sul modello di `pathExpr.ts` e `metaclassPin.ts`: nessun React,
 * nessun Redux, nessun accesso allo store, input espliciti. È questa proprietà che
 * permette di importarlo da `view/viewElement/view.tsx` senza aprire un ciclo — la
 * chiusura transitiva delle sue dipendenze (`irDefaults`, `irValidate`, `irCompile`,
 * `irTypes`, `irReadCtx`, `pathExpr`) non esce mai da questa cartella (Fase 0, punto 1).
 * Chi aggiungesse un import di Redux a monte aprirebbe il ciclo da lì.
 */

import { defaultObjectViewIR, defaultEdgeViewIR } from './irDefaults';
import { validateIR } from './irValidate';
import type { AnyViewIR, AuthoringMetaclassPins, EdgeViewIR, RowViewIR, VertexViewIR } from './irTypes';

/** I tre kind autorabili. `graphVertex` resta fuori (R-6, 2026-08-04). */
export type CreationSeedKind = 'vertex' | 'row' | 'edge';

export interface CreationSeedInput {
    kind: CreationSeedKind;
    /** Nome della metaclasse target, se noto. È ciò che il resolver matcha. */
    metaclassName?: string;
    /**
     * Pointer della metaclasse target, se noto. Deve essere l'id di una `DClass`: il pin
     * è definito come "metaclass name -> M2 class pointer (a DClass id)"
     * (`irTypes.ts:124-125`) e la catena di risoluzione lo verifica contro le sole classi
     * del progetto (`metaclassPin.ts:80`, candidates = `getMetaclassInfo().allClasses`).
     * Un id che non sia di una DClass verrebbe scartato a ogni lettura: il chiamante non
     * lo passa affatto (vedi il ramo enumeratore di `createViewInWorkbench`).
     */
    metaclassId?: string;
    /** Nome della view, usato come `label` del vertex. */
    label?: string;
}

/**
 * Chiave sintetica per il gate di validazione: alla creazione l'id della view non esiste
 * ancora, e `validateIR` ne vuole uno perché la compile è memoizzata su
 * `(viewId, irHash)`. Le entry prodotte qui non vengono riusate dal render, che compila
 * sull'id vero: sono il costo del gate, non un warm-up della cache.
 */
const SEED_VALIDATION_KEY = 'ir-creation-seed';

/**
 * `{ [metaclassName]: metaclassId }`, oppure `undefined` quando non c'è nulla da scrivere.
 *
 * La forma è quella che `withMetaclassPins` produce (`metaclassPin.ts:135-148`), inclusa
 * la regola del drop: una mappa vuota non si scrive come `{}` né come `undefined`, si
 * omette la chiave, così l'ir resta byte-identico a uno autorato senza pin
 * (`metaclassPin.ts:125-127`). Qui il drop è realizzato restituendo `undefined` e
 * lasciando che il chiamante ometta lo spread.
 */
function pinFor(name: string | undefined, id: string | undefined): AuthoringMetaclassPins | undefined {
    if (!name || !id) return undefined;
    return { [name]: id };
}

/**
 * L'ir con cui una view nasce, o `null` quando il seed non è applicabile.
 *
 * `null` significa "nessun seed": il chiamante lascia la view come la creava prima, senza
 * `ir`. È il ritorno anche quando `validateIR` rifiuta — un seed invalido non deve mai
 * essere persistito, perché il resolver salta in silenzio una view malformata
 * (`irResolveCore.ts:115` e il try/catch che segue) e il danno resterebbe invisibile.
 *
 * Regole per kind:
 * - `vertex`: default oggetto, `metaclasses` col nome se noto, altrimenti il wildcard `'*'`.
 *   Il wildcard è la STRINGA, non `['*']`: `irResolveCore.ts:178` confronta per identità di
 *   stringa, quindi un array archivierebbe la view sotto una metaclasse chiamata
 *   letteralmente `*` e non matcherebbe nulla.
 * - `row`: il letterale minimale del pannello, `metaclasses: []` e nessun pin. Un row nasce
 *   senza metaclasse per costruzione: l'autore la sceglie dal RowAuthoringPanel.
 * - `edge`: default edge, `metaclasses` col nome se noto, altrimenti `[]`. `edge: {}` lascia
 *   applicare i default di compile (terminazioni, labelPlacement).
 */
export function computeCreationSeed(input: CreationSeedInput): AnyViewIR | null {
    const { kind, metaclassName, metaclassId, label } = input;
    const pins = kind === 'row' ? undefined : pinFor(metaclassName, metaclassId);

    let seed: AnyViewIR;
    if (kind === 'row') {
        const row: RowViewIR = {
            irVersion: 'ir-1.0',
            kind: 'row',
            metaclasses: [],
            template: [{ from: 'intrinsic', prop: 'name' }],
        };
        seed = row;
    } else if (kind === 'edge') {
        const edge: EdgeViewIR = {
            ...defaultEdgeViewIR(),
            metaclasses: metaclassName ? [metaclassName] : [],
            ...(pins ? { authoringMetaclassPins: pins } : {}),
        };
        seed = edge;
    } else {
        const vertex: VertexViewIR = {
            ...defaultObjectViewIR(),
            metaclasses: metaclassName ? [metaclassName] : '*',
            ...(pins ? { authoringMetaclassPins: pins } : {}),
            ...(label ? { label } : {}),
        };
        seed = vertex;
    }

    const v = validateIR(SEED_VALIDATION_KEY, seed);
    if (!v.ok) {
        console.warn('[ir] creation seed rejected by validateIR, view created without ir:', v.error);
        return null;
    }
    return seed;
}
