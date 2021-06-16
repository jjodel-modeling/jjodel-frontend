import {DModelElement} from "../dataStructure";
import {U} from "../../common/U";
import {NotFound, nstring, NotFoundv, Pointer, JsType} from "../../joiner/types";
import {store} from "../../redux/store";
import {DNamedElement} from "../dataStructure/modelElement";


type NotAConcatenation = null;

export class LModelElementProxyHandler implements ProxyHandler<DModelElement> {
// permette di fare cose tipo: user.name_surname che ritorna la concatenazione di nome e cognome anche se il campo name_surname non esiste.
    private concatenableHandler(targetObj: DModelElement, propKey: keyof DModelElement | string | symbol, receiverThis: any): NotAConcatenation | string | string[] {
        if (propKey in targetObj)  return null as NotAConcatenation;
        const propKeyStr: null | string = U.asString(propKey, null);
        let _index: number = propKeyStr ? propKeyStr.indexOf('_') : -1;
        if (_index < 0) return null as NotAConcatenation;

        let isConcatenable = true;
        let ret: any = (propKey as string).split('_').map( (subKey: string) => {
            // se trovo multipli ___ li tratto come spazi aggiuntivi invece che come proprietà '' che ritornano undefined, così posso fare name___surname --> "damiano   di vincenzo"
            let val: any = subKey === '' ? ' ' : this.get(targetObj, subKey, receiverThis);
            isConcatenable = isConcatenable && JsType.isPrimitive(val);
            return val;
        });
        return isConcatenable ? ret.join(' ') : ret; }

    private resolvePointer<T, LB, UB>(ptr: Pointer<T, LB, UB>): T | null {
        return (ptr && store.idlookup[ptr]) as T; }
    private resolvePointers<T, LB, UB>(ptr: Pointer<T, LB, UB>[]): (T | null)[] {
        return (ptr && ptr.map( p => this.resolvePointer<T, LB, UB>(p))); }

    public get(targetObj: DModelElement, propKey: keyof DModelElement | string | symbol, receiverThis: any): any {
        const concatenationTentative = this.concatenableHandler(targetObj, propKey, receiverThis);
        if (concatenationTentative !== null) return concatenationTentative;

        switch (propKey) {
            // todo: credo che con espressioni sui tipi siano tipizzabili tutti i return di proprietà note eccetto quelle ottenute per concatenazione.
            default: if (propKey in targetObj) { return (targetObj as any)[propKey] as unknown; }
            console.warn("accessed invalid property " , targetObj, "[", propKey, "]");
            return undefined;
            case "annotations": return this.resolvePointers(targetObj.annotations);
        }
    }
    public set(targetObj: DModelElement, propKey: string | symbol, value: any, receiver: any): boolean {
        switch (propKey) {
            case 'name': return this.setName(targetObj, value);
            case 'id':/*
                problema: ogni oggetto deve avere multipli puntatori, quando ne modifico uno devo modificarli tutti, come tengo traccia?
                ipotesi 1: lo memorizzo in un solo posto (store.idlookup) e uso Pointer<type, lb, ub> che è una stringa che simula un puntatore
                problema 1: se fornisco l'intero store ai componenti si aggiornano ad ogni singola modifica, se estraggo i campi interesasti le stringhe puntatore sono invariate ma il contenuto puntato è cambiato e il componente non lo sa...
                problemone 2: non so a quali proprietà dello store devo abbonarmi, devo leggere sempre tutto lo store?
                !!!!! soluzione 2?: dovrei dichiarare le variabili a cui mi abbono, salvarle nello stato e precaricarle tramite mapStateToProps*/
        }
        return true;
    }

    // todo set for idlookup
    setName(targetObj: DModelElement, value: string): boolean {
        return true;
    }
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }
}
export class LNamedElementProxyHandler implements ProxyHandler<DNamedElement> {
    get(targetObj: DModelElement, propKey: keyof DModelElement | string | symbol, receiverThis: any): any {

        switch (propKey) {
            case 'getChildrenByName':
                // todo: come prendo i parametri?
                return false;
        }
        return "world";
    }
    set(targetObj: DModelElement, propKey: string | symbol, value: any, receiver: any): boolean {
        switch (propKey) {
            case 'name': return this.setName(targetObj, value);

        }
        return true
    }
    setName(targetObj: DModelElement, value: string): boolean {
        return true;
    }
    apply(target: DModelElement, thisArg: any, argArray: any[]): any {
        // will i ever use it? dovrei pasare una funzione invece di una classe, quindi in questo caso credo wrappi solo il costruttore
    }
}



export class LModelElement extends DModelElement{
    private static proxyHandler: LModelElementProxyHandler = new LModelElementProxyHandler();
    // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones
    public static wrap(data: DModelElement): LModelElement{
        return new Proxy(data, LModelElement.proxyHandler) as LModelElement;
    }
}

let a :LModelElement = {} as LModelElement;
({} as any as LModelElement).annotations = [];



class ObjectAttributeForProxy<T>{
    key!: string | symbol;
    value!: T;
    set(val: T) {
    }
    get(): T { return this.value; }
}
