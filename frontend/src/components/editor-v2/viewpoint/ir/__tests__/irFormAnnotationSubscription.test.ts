/**
 * IRF1 — `IRForm` si sottoscrive anche alle annotation della METAFEATURE.
 *
 * Il buco, misurato da TXT1 Fase 2 (`discovery_2026-09-01_txt1_fase2_multiline.md` §6.1) e
 * ripreso qui (`discovery_2026-09-01_irf1_annotation_subscription.md`): la sola
 * sottoscrizione al modello di `IRForm` era `useIRFormView`, la cui firma copre nome,
 * metaclasse e i VALORI degli slot. Una dichiarazione `jjodel/…` vive un livello sopra —
 * `DValue.instanceof` -> `DAttribute.annotations` -> `DAnnotation.source` — quindi accendere
 * Multiline (o Code, che e' piu' vecchia di entrambi i toggle) non ridisegnava la form
 * finche' non arrivava una re-render per altra via.
 *
 * Perche' questi test leggono il SORGENTE invece di montare il componente: `IRForm.tsx`
 * importa la barrel `joiner`, che arriva a Monaco, che dereferenzia `window` all'import;
 * l'ambiente di vitest e' `node`. Stesso precedente, e stessa ragione, di
 * `irFormLabelColumn.test.ts` e di `viewpointThemeHint.test.ts`.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: che la form si ridisegni
 * DAVVERO, e in quanti ms. Quello e' `scripts/smoke/_tmp_irf1_verify.ts` sull'app vera —
 * 12/12, con B a 254 ms contro il budget di 6000 scaduto prima del rimedio.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una lettura
 * che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROW_VIEW_ANNOTATION_PREFIX } from '../../../nodes/rowViewAnnotations';

const IRFORM_PATH = resolve(__dirname, '../IRForm.tsx');
const HOOK_PATH = resolve(__dirname, '../useIRFormView.ts');

const IRFORM = readFileSync(IRFORM_PATH, 'utf8');
const HOOK = readFileSync(HOOK_PATH, 'utf8');

/** Il sorgente senza commenti. Il perche' della sottoscrizione e' scritto in prosa nel
 *  file, e una regex che lo trovasse li' misurerebbe il commento invece del codice. */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const CODE = strip(IRFORM);
const HOOK_CODE = strip(HOOK);

describe('i due sorgenti si leggono, e lo strip fa il suo mestiere', () => {
    it('positivo di controllo: i file sono leggibili e non sono vuoti', () => {
        expect(IRFORM.length).toBeGreaterThan(1000);
        expect(HOOK.length).toBeGreaterThan(1000);
    });

    it('positivo di controllo: lo strip toglie i commenti e lascia il codice', () => {
        expect(IRFORM).toContain('METAFEATURE rung of the subscription');   // la prosa c'e'
        expect(CODE).not.toContain('METAFEATURE rung of the subscription'); // e lo strip l'ha tolta
        expect(CODE).toContain('export function IRForm(');
        expect(HOOK_CODE).toContain('export function useIRFormView(');
    });
});

describe('la sottoscrizione alle annotation esiste, ed e\' una sua `useSelector`', () => {
    it('`annotationSignature` e\' un selettore, non un valore calcolato al render', () => {
        expect(CODE).toContain('const annotationSignature = useSelector(');
    });

    it('e cammina il percorso vero: features -> instanceof -> annotations', () => {
        // Le tre tappe, in codice. Una sola di esse mancante e la firma guarderebbe un
        // altro oggetto da quello che `describeSlot` legge.
        expect(CODE).toMatch(/lookup\?\.\[objectId\]\?\.features/);
        expect(CODE).toMatch(/lookup\[fid\]\?\.instanceof/);
        expect(CODE).toMatch(/lookup\[metaId\]\?\.annotations/);
    });

    it('la firma e\' una STRINGA: l\'uguaglianza di default basta e non serve un comparatore', () => {
        expect(CODE).toContain("return parts.join(';')");
        // Nessun secondo argomento alla `useSelector` delle annotation: un comparatore
        // sarebbe una seconda verita' da tenere allineata alla forma della firma.
        const at = CODE.indexOf('const annotationSignature = useSelector(');
        expect(at).toBeGreaterThan(-1);
        const body = CODE.slice(at, CODE.indexOf('const slots', at));
        expect(body).toContain('});');       // chiude con la sola callback
        expect(body).not.toContain('}, (');  // non con `}, (a, b) => …)`
    });
});

describe('il caso che discrimina: si legge la `source`, non il solo array di puntatori', () => {
    /**
     * Le due scritture del pannello Display non toccano gli stessi campi D. La PRIMA
     * dichiarazione crea una `DAnnotation` e fa crescere `DAttribute.annotations`; spegnere
     * il toggle e riaccenderlo sono `SetFieldAction` su `DAnnotation.source`, e lasciano
     * l'array intatto — misurato, lunghezza 1 -> 1 con la source da `jjodel/multiline=true`
     * a stringa vuota. Una sottoscrizione sul solo array si accenderebbe al primo toggle e
     * resterebbe cieca a tutti quelli dopo.
     */
    it('la `source` di ogni annotation entra nella firma', () => {
        expect(CODE).toContain("typeof entry.source === 'string'");
        expect(CODE).toContain('? entry.source');
        expect(CODE).toContain('?.source;');
    });

    it('e le due forme dell\'entry sono entrambe gestite, come in `readRowViewAnnotations`', () => {
        // Un puntatore, oppure il record lasciato al suo posto da certe write path.
        expect(CODE).toMatch(/lookup\[typeof entry === 'string' \? entry : entry\?\.id\]\?\.source/);
    });

    it('la firma e\' chiavata per metafeature: la stessa dichiarazione su un\'altra feature e\' un\'altra forma', () => {
        expect(CODE).toContain('parts.push(`${metaId}:${source}`)');
    });
});

describe('il formato di filo ha un solo proprietario', () => {
    it('positivo di controllo: la costante importata e\' quella vera', () => {
        expect(ROW_VIEW_ANNOTATION_PREFIX).toBe('jjodel/');
    });

    it('il prefisso arriva per import da `rowViewAnnotations`, non riscritto a mano', () => {
        expect(IRFORM).toContain("import { ROW_VIEW_ANNOTATION_PREFIX } from '../../nodes/rowViewAnnotations';");
        expect(CODE).toContain('source.startsWith(ROW_VIEW_ANNOTATION_PREFIX)');
        // E nessuna seconda scrittura del prefisso nel codice: due sorgenti dello stesso
        // formato sono due sorgenti destinate a divergere.
        expect(CODE).not.toContain("'jjodel/");
    });
});

describe('il ricalcolo dei descriptor dichiara la nuova dipendenza', () => {
    it('positivo di controllo: la memo dei descriptor e\' ancora quella, e chiama `describeSlots`', () => {
        expect(CODE).toContain('describeSlots(slots, spec, offer)');
    });

    it('`annotationSignature` e\' nelle sue deps', () => {
        expect(CODE).toContain('[slots, spec, resolution, offer, annotationSignature]');
    });
});

describe('la firma degli slot NON e\' stata allargata — il rimedio e\' fuori da li\'', () => {
    /**
     * La via scartata (a) del referto: allargare la firma di `useIRFormView` funzionerebbe,
     * ma cambierebbe l'identita' di `resolution` e farebbe ri-risolvere `resolveIRView` e
     * ripubblicare le cross-deps a ogni dichiarazione — una passata di risoluzione comprata
     * per una larghezza.
     */
    it('positivo di controllo: la firma degli slot c\'e\' e legge i valori', () => {
        expect(HOOK_CODE).toContain('const signature = useSelector(');
        expect(HOOK_CODE).toContain('JSON.stringify(dv.values)');
    });

    it('e non nomina le annotation', () => {
        expect(HOOK_CODE).not.toContain('annotations');
        expect(HOOK_CODE).not.toContain('ROW_VIEW_ANNOTATION_PREFIX');
    });
});
