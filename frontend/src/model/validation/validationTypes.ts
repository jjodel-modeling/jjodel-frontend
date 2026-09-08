/**
 * Il modello della validazione definita dall'utente — scheletro (R-VAL).
 *
 * Un **viewpoint di validazione** contiene delle **regole**; una regola predica su una
 * classe M2 e vale su ogni sua istanza M1 e su quelle delle sottoclassi. Qui c'e' solo
 * il modello: nessuna valutazione (Step 2), nessun comando (Step 3), nessun authoring
 * (Step 4).
 *
 * ── Perche' due tipi paralleli e non due `DViewElement` (R-VAL-6-bis) ────────
 *
 * Una view *seleziona*: puo' prendere istanze di piu' metaclassi, filtrarle con un
 * predicato, e il dispatch sceglie quale view vince su una data istanza. Una regola
 * *predica*: ha **un contesto solo**, e non c'e' niente da scegliere perche' tutte le
 * regole applicabili si valutano e ognuna produce la propria voce (R-VAL-12). Legame e
 * dispatch, cioe' meta' di quello che le due cose sembrano avere in comune, non lo
 * hanno. Ereditare `DViewElement` porterebbe stile, layout e primitive IR che per una
 * regola non significano niente, e un supertipo comune che ammette piu' classi
 * renderebbe **rappresentabile** la regola con due contesti — uno stato senza
 * significato, che il valutatore dovrebbe poi risolvere in qualche modo.
 *
 * Percio': `extends DPointerTargetable` per entrambi, e nessun supertipo condiviso
 * fra loro. Traccia storica del tentativo opposto: `joiner/classes.ts:1186`, dove
 * sopravvive un `//thiss.constraints = [];` commentato accanto al flag `isValidation`
 * di `DViewElement`.
 *
 * ── Perche' nessuna migrazione e nessun bump di versione ────────────────────
 *
 * Questo modulo **non aggiunge un campo a nessuna classe D esistente**. Un progetto
 * salvato prima di oggi non ha questi oggetti in `idlookup`, `findValidationViewpoint`
 * gli risponde `null`, e il viewpoint nasce alla prima scrittura — il precedente e' il
 * Data Manager Viewpoint (R-DMV-6, `view/viewPoint/viewpoint.ts`). Non c'e' quindi
 * niente da migrare: nessun metodo nuovo in `VersionFixer.tsx` e nessun bump di
 * `DState.version.n`. La condizione dichiarata dal prompt di Fase 2 («restare additivi»)
 * e' rispettata alla lettera, e la si perderebbe nel momento in cui si aggiungesse una
 * collezione `validationViewpoints` a `DProject`.
 *
 * Il salvataggio funziona senza fare niente: `U.compressedState` serializza
 * **l'intero `idlookup`** (`common/U.tsx:427-439`), non un elenco di tipi noti, quindi
 * questi oggetti entrano nel file di progetto e ne tornano da soli. La registrazione
 * D<->L e' altrettanto automatica: `buildLSingletons` (`redux/reducer/reducer.ts:1392`)
 * accoppia ogni classe `D<Nome>` con `L<Nome>` per convenzione di nome, e la coppia
 * entra nel registro grazie al decoratore `@RuntimeAccessible`. Perche' il decoratore
 * giri, il modulo deve essere importato all'avvio: lo e', dall'export in
 * `joiner/index.ts`.
 *
 * ── Che cosa NON c'e', e non per dimenticanza ───────────────────────────────
 *
 * - **`severity`**: nello scheletro ogni violazione e' un `error` (prompt Fase 2). Il
 *   campo appartiene alla fetta 1 (spec §4), non a questo giro.
 * - **`enabled` sul viewpoint**: l'attivazione del viewpoint e' una **scelta del
 *   progetto** e non una proprieta' del viewpoint (spec §6), cosi' che un viewpoint
 *   riusabile possa essere attivo in un progetto e spento in un altro. Scriverlo qui
 *   deciderebbe quella forma per inerzia. Il flag della singola regola invece e' suo, e
 *   c'e'.
 * - **il nome della classe conservato come testo** per le regole orfane (R-VAL-9): la
 *   modale di cancellazione della classe e' fuori dallo scheletro, e il campo che la
 *   serve va aggiunto insieme a lei.
 * - **la cancellazione a cascata**: `DPointerTargetable.childKeys` non elenca `rules`, e
 *   non e' stato toccato — e' una lista statica che `__json`, `Dummy.ts` e la
 *   navigazione `$`-prefissata leggono per ogni tipo del sistema.
 */

import {
    Constructors,
    DClass,
    DPointerTargetable,
    LogicContext,
    LPointerTargetable,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    store,
} from '../../joiner';

/**
 * Il puntatore fisso del viewpoint di validazione dello scheletro, sul precedente di
 * `Pointer_ViewPointDataManager`: una lettura di `idlookup` lo trova, senza scansione
 * per tipo.
 *
 * NON significa che il tipo ammetta un solo viewpoint — R-VAL-2 ne vuole piu' d'uno, e
 * `DValidationViewpoint.new` accetta qualunque id. Significa che **l'interfaccia dello
 * scheletro ne mostra uno**, e questo e' quello. Quando arrivera' la gestione dei
 * viewpoint multipli servira' un elenco (una collezione su `DProject`, oppure una
 * scansione di `idlookup` per `className`): e' una decisione di quella corsia, non di
 * questa, e va presa allora perche' la prima porta con se' un campo nuovo su una classe
 * del cuore.
 */
export const VALIDATION_VIEWPOINT_ID = 'Pointer_ValidationViewpointDefault';

/** Il nome con cui nasce il viewpoint dello scheletro. Rinominabile: niente lo
 *  identifica per nome — lo fa il puntatore. */
export const VALIDATION_VIEWPOINT_NAME = 'Validation';

@RuntimeAccessible('DValidationViewpoint')
export class DValidationViewpoint extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DValidationViewpoint, 1, 1, LValidationViewpoint>;
    name!: string;
    /** Le regole contenute. Inizializzata qui e non solo dichiarata: `Constructors`
     *  legge le proprieta' proprie dell'oggetto gia' costruito, e una dichiarazione
     *  senza inizializzatore non ne e' una sotto ogni semantica di emissione dei campi
     *  di classe. */
    rules: Pointer<DValidationRule, 0, 'N', LValidationRule> = [];

    public static new(
        name: string = VALIDATION_VIEWPOINT_NAME,
        persist: boolean = true,
        id: string = VALIDATION_VIEWPOINT_ID
    ): DValidationViewpoint {
        return new Constructors(new DValidationViewpoint('dwc'), undefined, persist, undefined, id)
            .DPointerTargetable()
            .end((d) => {
                d.name = name;
                d.rules = [];
            });
    }
}

@RuntimeAccessible('LValidationViewpoint')
export class LValidationViewpoint<
    Context extends LogicContext<DValidationViewpoint, LValidationViewpoint> = any,
    D extends DValidationViewpoint = any
> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DValidationViewpoint, 1, 1, LValidationViewpoint>;
    name!: string;
    rules!: LValidationRule[];
}

@RuntimeAccessible('DValidationRule')
export class DValidationRule extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DValidationRule, 1, 1, LValidationRule>;
    /** Il viewpoint che la contiene. Legame all'indietro, quello affidabile: la
     *  collezione in avanti puo' essere stantia subito dopo una scrittura, il padre no
     *  (CLAUDE.md §3.6). Inizializzato per la ragione detta su `rules`. */
    father: Pointer<DValidationViewpoint, 1, 1, LValidationViewpoint> = undefined as any;

    /** Identificatore leggibile. Unico nel viewpoint — l'unicita' non e' imposta qui:
     *  e' un controllo di authoring (Step 4), e R-VAL-4 vieta comunque di bloccare
     *  una scrittura. */
    name!: string;
    /**
     * La classe M2 su cui la regola predica. `self` e' l'istanza.
     *
     * ATTENZIONE, e vale per ogni lettura: sul proxy L questo campo **non torna un
     * puntatore**. Il getter di default risolve ogni stringa che sia un `Pointer_` in
     * una proxy L (`classes.ts:2380-2401`, `__shallowSolver`), quindi
     * `lRule.context` e' una `LClass` e `lRule.__raw.context` e' l'id. Le due letture
     * convivono di proposito, come `pkg.uri` e `pkg.__raw.uri` (CLAUDE.md §3.7): per
     * confrontare identita' si usa il grezzo, per navigare la proxy.
     */
    context!: Pointer<DClass, 0, 1>;
    /** Il corpo, sorgente JjEL. Stringa, non AST: non esiste una forma compilata
     *  riusabile (la catena JjEL e' lexer -> parser -> evaluator ad albero). */
    body!: string;
    /** Il messaggio mostrato quando la regola e' violata. Nello scheletro e' una
     *  stringa fissa: i segnaposto sono fetta 1, non questo giro. */
    message!: string;
    /** Attivazione della singola regola (R-VAL-5). Spenta resta spenta anche quando il
     *  viewpoint si riaccende. */
    enabled!: boolean;

    /**
     * NESSUNA TRANSACTION ESTERNA, qui o attorno a una chiamata a questo metodo
     * (CLAUDE.md §3.3): `end()` ne apre una propria per la creazione, e un creatore
     * annidato in un'altra perde le sue scritture. La `SetFieldAction` che aggancia la
     * regola alla collezione del viewpoint e' fuori da quella creazione, ed e' per
     * questo che sta **dopo** `end()` e non dentro il callback.
     */
    public static new(
        viewpoint: Pointer<DValidationViewpoint, 1, 1, LValidationViewpoint>,
        name: string,
        context: DValidationRule['context'],
        body: string = '',
        message: string = '',
        enabled: boolean = true,
        persist: boolean = true,
        id?: string
    ): DValidationRule {
        const rule = new Constructors(
            new DValidationRule('dwc'), viewpoint as any, persist, DValidationViewpoint as any, id
        )
            .DPointerTargetable()
            .end((d) => {
                d.name = name;
                d.context = context;
                d.body = body;
                d.message = message;
                d.enabled = enabled;
            });
        if (persist) SetFieldAction.new(viewpoint as any, 'rules', rule.id, '+=', true);
        return rule;
    }
}

@RuntimeAccessible('LValidationRule')
export class LValidationRule<
    Context extends LogicContext<DValidationRule, LValidationRule> = any,
    D extends DValidationRule = any
> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DValidationRule, 1, 1, LValidationRule>;
    name!: string;
    body!: string;
    message!: string;
    enabled!: boolean;
}

/**
 * Il viewpoint di validazione come sta nel progetto caricato, oppure `null` se nessuno
 * ci ha ancora scritto — che e' lo stato di **ogni** progetto esistente oggi.
 *
 * Una lettura di `idlookup` e non `DPointerTargetable.fromPointer`: qui l'assenza e' la
 * risposta ORDINARIA, e deve tornare come `null` invece che come eccezione o come proxy
 * vuota.
 */
export function findValidationViewpoint(state?: any): DValidationViewpoint | null {
    const st = state ?? store.getState();
    const d = st?.idlookup?.[VALIDATION_VIEWPOINT_ID];
    return d && d.className === 'DValidationViewpoint' ? (d as DValidationViewpoint) : null;
}

/**
 * Il viewpoint, creato sul posto se non c'e' ancora — la materializzazione di R-DMV-6
 * applicata qui. Va chiamata dalla PRIMA SCRITTURA e mai al mount: un `ensure` in fase
 * di render metterebbe l'oggetto in ogni progetto che ha aperto il pannello, che e'
 * esattamente cio' che «nasce alla prima scrittura» esiste per evitare.
 *
 * NESSUNA TRANSACTION ESTERNA attorno a questa chiamata (CLAUDE.md §3.3).
 */
export function ensureValidationViewpoint(): DValidationViewpoint {
    const existing = findValidationViewpoint();
    if (existing) return existing;
    return DValidationViewpoint.new();
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DValidationViewpoint);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LValidationViewpoint);
RuntimeAccessibleClass.set_extend(DPointerTargetable, DValidationRule);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LValidationRule);
