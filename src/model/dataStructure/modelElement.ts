import {
    Log, CreateElementAction, Dictionary, Pointer, PointerTargetable, DocString
} from "../../joiner";

import type {
    LAnnotation,
    LModelElement,
    LAttribute,
    LClass,
    LClassifier,
    LEnumerator,
    LEnumLiteral, LModel,
    LObject, LOperation,
    LPackage, LParameter, LReference,
    LStructuralFeature, LValue} from '../../joiner';
import {LDataType, LNamedElement, LTypedElement} from "../logicWrapper/LModelElement";
import {IsActually} from "../../joiner/types";

export abstract class DModelElement extends PointerTargetable {
    static logic: IsActually<LModelElement>;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    // eAnnotations: Pointer<DAnnotation, 0, 'N'>[] = [];

    getAnnotation(source: string): DAnnotation { return todoret; }
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //ù
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation>[] = [];
    parent: Pointer<DModelElement, 0, 'N', LModelElement>[] = [];
    constructor() {
        super(false);
    }

    static persist(me: DModelElement) { new CreateElementAction(me); }
}

export class DAnnotation extends DModelElement {
    static logic: IsActually<LModelElement>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement>[] = [];

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    // eModelElement!: DModelElement; // alias for parent
    source!: string;
    details: Dictionary<string, string> = {}; // il tipo sarebbe EStringToStringMapEntry???
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

export abstract class DNamedElement extends DModelElement {
    static logic: IsActually<LNamedElement>;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    name: string = '';
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    constructor(name: string = ''){ super(); this.name = name; }
}

export abstract class DFactory_useless_ extends DModelElement {
    static logic: IsActually<'not exist'>;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    ePackage: Pointer<DPackage, 1, 1, LPackage> = null;
    abstract create(DClass: DClass): DOBject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

export class EJavaObject{
    static logic: IsActually<'not exist'>;
}// ??? EDataType instance?

export abstract class DTypedElement extends DNamedElement {
    static logic: IsActually<LTypedElement>;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    type: Pointer<DClassifier, 0, 1, LClassifier> = null;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

const todoret: any = 'todo';
export abstract class DClassifier extends DNamedElement {
    static logic: IsActually<LClassifier>;
    parent: Pointer<DPackage, 0, 'N', LPackage>[] = [];
    childrens: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature>[] = [];
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue: Pointer<DOBject, 1, 1, LObject> = null;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

export class DPackage extends DNamedElement {
    static logic: IsActually<LPackage>;
    parent: Pointer<DPackage | DModel, 0, 'N', LPackage | LModel>[] = [];
    childrens: Pointer<DPackage | DClass, 0, 'N', LPackage | LClass>[] = [];

    classifiers: Pointer<DClass, 0, 'N', LClass>[] = [];
    subpackages: Pointer<DPackage, 0, 'N', LPackage>[] = []

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //

    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    uri: string;
    constructor(name: string = '', uri: string = '') {
        super(name);
        this.uri = uri;
    }
}

export class DOperation extends DTypedElement {
    static logic: IsActually<LOperation>;
    parent: Pointer<DClass, 0, 'N', LClass>[] = [];
    exceptions: Pointer<DClassifier, 0, 'N', LClassifier>[] = [];
    parameters: Pointer<DParameter, 0, 'N', LParameter>[] = [];
}
export class DParameter extends DTypedElement {
    static logic: IsActually<LParameter>;
    parent: Pointer<DOperation, 0, 'N', LOperation>[] = [];
}

export class DClass extends DClassifier {
    static logic: IsActually<LClass>;
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract: boolean = false;
    interface: boolean = false;
    parent: Pointer<DPackage, 0, 'N', LPackage>[] = [];
    instances: Pointer<DOBject, 0, 'N', LObject>[] = [];
    operations: Pointer<DOperation, 0, 'N', LOperation>[] = [];
    features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature>[] = [];
    references: Pointer<DReference, 0, 'N', LReference>[] = [];
    attributes: Pointer<DAttribute, 0, 'N', LAttribute>[] = [];
    referencedBy: Pointer<DReference, 0, 'N', LReference>[] = [];
    extends: Pointer<DClass, 0, 'N', LClass>[] = [];
    extendedBy: Pointer<DClass, 0, 'N', LClass>[] = [];

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass>[] = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass>[] = [];

    constructor(name: string = '', isInterface: boolean = false, isAbstract: boolean = false) {
        super(name);
        this.abstract = isAbstract;
        this.interface = isInterface
    }

    setImplement(interfaceIds: string[]): DClass {
        // todo: tutta sta roba andrebbe fatta da redux e dovrei aggiornare ImplementedBy, . e neanche andrebbe fatto qui ma dentro la parte logica proxy
        this.implements = [...this.implements, ...interfaceIds];
        return this;
    }
    setExtend(classIds: string[]): DClass {
        this.extends = [...this.extends, ...classIds];
        return this;
    }
}

export class DDataType extends DClassifier {
    static logic: IsActually<LDataType>;
    parent: Pointer<DPackage, 0, 'N', LPackage>[] = [];
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute>[] = [];
}

export class DStructuralFeature extends DTypedElement {
    static logic: IsActually<LStructuralFeature>;
    parent: Pointer<DClass, 0, 'N', LClass>[] = [];
    instances: Pointer<DValue, 0, 'N', LValue>[] = [];

    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    derived: boolean = false;
    defaultValueLiteral!: string;

    // defaultValue!: GObject; //EJavaObject
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
}

export class DReference extends DStructuralFeature {
    static logic: IsActually<LReference>;
    parent: Pointer<DClass, 0, 'N', LClass>[] = [];
    instances: Pointer<DValue, 0, 'N', LValue>[] = [];
    containment: boolean = true;
    container: boolean = false; // ?
    resolveProxies: boolean = true; // ?
    opposite: Pointer<DReference, 0, 1, LReference> = null;
}

export class DAttribute extends DStructuralFeature {
    static logic: IsActually<LAttribute>;
    parent: Pointer<DClass, 0, 'N', LClass>[] = [];
    isID: boolean = false; // ? exist in ecore as "iD" ?
    instances: Pointer<DValue, 0, 'N', LValue>[] = [];
}

export class DEnumLiteral extends DNamedElement {
    static logic: IsActually<LEnumLiteral>;
    parent: Pointer<DEnumerator, 0, 'N', LEnumerator>[] = [];
    value: number = 0;
}

export class DEnumerator extends DDataType {
    static logic: IsActually<LEnumerator>;
    parent: Pointer<DPackage, 0, 'N'>[] = [];
    childrens: Pointer<DEnumLiteral, 0, 'N', LEnumLiteral>[] = [];
}

export class DOBject extends DNamedElement { // m1 class instance
    static logic: IsActually<LObject>;
    parent: Pointer<DModel, 0, 'N'>[] = [];
    instanceof: Pointer<DClass, 0, 1>[] = [];
}

export class DValue extends DModelElement { // m1 value (attribute | reference)
    static logic: IsActually<LValue>;
    parent: Pointer<DOBject, 0, 'N', LObject>[] = [];
    instanceof: Pointer<DStructuralFeature, 0, 1, LStructuralFeature>[] = [];
}

export class DModel extends DNamedElement {
    static logic: IsActually<LModel>;
    packages:  Pointer<DPackage, 0, 'N', LPackage>[] = [];

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //

    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    // modellingElements: Pointer<DModelElement, 0, 'N', LModelElement>[] = [];
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

// export type EClassifier = DClass;

// ******************** ecore officials inherited ******************** //
// ******************** ecore officials personal ********************* //

// ********************** my additions inherited ********************* //
// ********************** my additions personal ********************** //
