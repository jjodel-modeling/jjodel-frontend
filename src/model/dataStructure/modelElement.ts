import {Pointer} from "../../joiner/types";
import {store} from "../../redux/store";

export abstract class PointerTargetable {
    private static maxID: number = 0;
    id: string;
    constructor(isUser: boolean = false) {
        this.id = (isUser ? '' : store.user.id + "_") + PointerTargetable.maxID + "_" + new Date().getTime();
        // todo store.dispatch(new IdLinkAction(this));
    }
}

export class DModelElement extends PointerTargetable{
    annotations: Pointer<DAnnotation, 0, 'N'>[] = [];

}
export class DAnnotation extends DModelElement{

}
export class DNamedElement extends DModelElement{
    name: string = '';
}

export class DClass extends DNamedElement{
}
export class DPackage extends DNamedElement{
    classes:  Pointer<DClass, 0, 'N'>[] = [];
}
export class DModel {
    packages:  Pointer<DPackage, 0, 'N'>[] = [];
}
/*
export class IClass extends IClassNoFunc{
    static singleton: IClass = null as any;
    static get(): IClass{ return IClass.singleton || (IClass.singleton = new IClass()); }
    constructor(DoNotInstantiate_IsSingleton: string = "ok") {
        super();
    }
    // data: IClassNoFunc = null as any;
    // todo: mettici un wrapper che quando fai get di una proprietà inesistente la cerca in data, così eviti codice verboso.
    // anzi, use it with apply su di un singleton
    setName(name: string): void {
        // logica di autofix, validazione...
        let nameAfterFixing = name;
        let fireReduxAction = (targetID: string, func: Function, parameters: any[] = []) => {
            let U: { getFunctionName: (f: Function) => string} = {} as any;
            let funcname = U.getFunctionName(func);
            // todo: sta roba (funcname) funziona persino con il minify dei nomi! ma vedi che figata se gli passo il funcname come stringa invece no
            let reduxAction = {targetID, func: funcname, parameters};
            // todo: store.dispatch(reduxAction)
        };

        // nb: per azioni che hanno multipli side effect decidi quali action dispatchare solo se davvero modificano lo stato
        if (nameAfterFixing === this.name) return; // do nothing, do not fire action
        else return fireReduxAction(this.id, this.doSetName, []);
    }
    doSetName(name: string): void {
        this.name = name; // no question asked, no logic, no side-effect, just do it. logic and decisions are in setName()
    }

}
export class Package{
    data: PackageNoFunc[] = [];
}*/
