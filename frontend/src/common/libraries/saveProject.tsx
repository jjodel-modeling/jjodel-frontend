/**
 * saveProject — l'unico salvataggio esplicito del progetto, e il suo feedback.
 *
 * SAVE1. Prima di questa slice lo stesso salvataggio era scritto tre volte:
 * la voce File -> Save Project del menu (`Navbar.tsx`), la scorciatoia Ctrl/Cmd+S
 * (`Navbar.tsx`) e la `SaveAndCloseProject` di «Save & Exit» (`Navbar.tsx`).
 * Le prime due sono passate di qui con SAVE1, insieme al bottone nuovo in testata
 * del Data Manager; la terza con SAVE1-bis. Le copie NON erano identiche, ed e'
 * la ragione per cui l'estrazione non e' cosmetica:
 *
 *  - il menu aveva la guardia di timeout a 10s con l'alert e il mailto, ma nel
 *    `catch` NON rimetteva `isLoading` a `false`: un save fallito lasciava lo
 *    spinner acceso per sempre, e non annullava il timer, quindi dieci secondi
 *    dopo l'errore arrivava anche un «Request timed out» che non descriveva
 *    niente;
 *  - la scorciatoia rimetteva `isLoading` a `false` in entrambi i rami ma non
 *    aveva nessun timeout: un backend che non risponde lasciava lo spinner
 *    acceso e l'utente senza spiegazione;
 *  - la `SaveAndCloseProject` aveva il timeout e il ripristino di `isLoading`
 *    su entrambi i rami, ma non annullava il timer sull'errore: stesso
 *    «Request timed out» spurio del menu.
 *
 * Questa funzione e' l'UNIONE delle tre, non la copia di una: la guardia di
 * timeout del menu, il ripristino di `isLoading` della scorciatoia, e in piu'
 * il `clearTimeout` anche sul ramo di errore. Ogni chiamante ci guadagna, nessuno
 * ci perde — che e' la condizione perche' un'estrazione non sia una regressione.
 *
 * NON tocca `U.isProjectModified`: lo azzera gia' `ProjectsApi.save`
 * (`api/persistance/projects.ts`), e riscriverlo qui sarebbe la seconda scrittura
 * dello stesso flag.
 *
 * NON introduce feedback nuovo: gli alert sono quelli che esistevano, verbatim.
 */

import { SetRootFieldAction, U } from '../../joiner';
import type { LProject } from '../../joiner';
import { ProjectsApi } from '../../api/persistance';

/** La finestra oltre la quale il salvataggio si dichiara non arrivato. Era un
 *  `maxWait` locale in ognuna delle copie; qui e' esportata perche' il test la
 *  usi invece di riscrivere il numero. */
export const SAVE_TIMEOUT_MS = 10 * 1000;

/**
 * Salva il progetto mostrando lo spinner globale e, in caso di fallimento o di
 * attesa oltre `SAVE_TIMEOUT_MS`, l'alert corrispondente.
 *
 * Non rilancia mai: l'errore e' gia' stato mostrato all'utente. Il booleano dice
 * al chiamante se il salvataggio e' andato a buon fine, per chi debba decidere
 * qualcosa dopo: i tre call site di SAVE1 lo ignorano, la `SaveAndCloseProject`
 * ci decide se chiudere il progetto o restare aperta sull'errore.
 *
 * @param project il progetto corrente; con `null`/`undefined` non fa nulla e
 *        ritorna `false`, che e' il comportamento dei call site precedenti
 *        (tutti dentro un `if (project)`). Attenzione al ritorno `false` in
 *        questo caso: `SaveAndCloseProject` chiama solo dentro il proprio
 *        `if (project)`, quindi non confonde «niente da salvare» con «salvataggio
 *        fallito» e continua a chiudere un progetto assente come faceva prima.
 */
export async function saveProjectWithFeedback(project: LProject | null | undefined): Promise<boolean> {
    if (!project) return false;

    SetRootFieldAction.new('isLoading', true);
    const timeout = setTimeout(() => {
        SetRootFieldAction.new('isLoading', false);
        U.alert('e', 'Request timed out', <>Verify your connection or&nbsp;
            <a href="mailto:info@jjodel.io?subject=Save%20timeout&body=Describe%20your%20actions%20prior%20the%20error%2C%20and%20attach%20your%20latest%20savefile%20if%20possible.">contact our support</a></>);
    }, SAVE_TIMEOUT_MS);

    try {
        await ProjectsApi.save(project);
        return true;
    } catch (error: any) {
        U.alert('e', 'Error while Saving Project', error.message);
        return false;
    } finally {
        clearTimeout(timeout);
        SetRootFieldAction.new('isLoading', false);
    }
}
