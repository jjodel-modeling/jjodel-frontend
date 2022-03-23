import type {
    LAnnotation,
    LAttribute,
    LClass,
    LClassifier,
    LEnumerator,
    LEnumLiteral, LModel,
    LObject, LOperation,
    LPackage, LParameter, LReference,
    LStructuralFeature, LValue,
    LDataType,
    LNamedElement, LTypedElement, TargetableProxyHandler, IsActually, GObject
} from /*type*/ "../../joiner";

import {
    Log,
    CreateElementAction,
    Dictionary,
    Pointer,
    DPointerTargetable,
    DocString,
    DViewElement,
    RuntimeAccessibleClass,
    LViewElement, LPointerTargetable, RuntimeAccessible,
    LModelElement,
} from "../../joiner";


@RuntimeAccessible
export /*abstract*/ class DModelElement extends DPointerTargetable {
    static defaultComponent: (ownProps: GObject, childrens?: (string | React.Component)[]) => React.ReactElement;
    static logic: typeof LPointerTargetable;

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    // eAnnotations: Pointer<DAnnotation, 0, 'N'> = [];

    getAnnotation(source: string): DAnnotation { return todoret; }
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //ù
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = []; // a modelElement can be shared between different models
    constructor() {
        super(false);
        this.className = this.constructor.name;
        //this._transient = new DModelElementTransientProperties();
    }

    static persist(me: DModelElement) { new CreateElementAction(me); }
    //_transient: DModelElementTransientProperties | LModelElementTransientProperties;
}

    /*
    @RuntimeAccessible
    export class DModelElementTransientProperties extends RuntimeAccessibleClass {
        static logic: typeof LModelElementTransientProperties;
        // currentView!: Pointer<DViewElement, 1, 1, LViewElement>;
    }*/

@RuntimeAccessible
export class DAnnotation extends DModelElement {
    static logic: typeof LModelElement;
    // parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    // eModelElement!: DModelElement; // alias for parent
    source!: string;
    details: Dictionary<string, string> = {}; // il tipo sarebbe EStringToStringMapEntry???
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

@RuntimeAccessible
export /*abstract*/ class DNamedElement extends DModelElement {
    static logic: typeof LModelElement;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    name: string = '';
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    constructor(name: string = ''){
        super();
        this.name = name;
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export abstract class DFactory_useless_ extends DModelElement {
    static logic: IsActually<'not exist yet'>;
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    ePackage: Pointer<DPackage, 1, 1, LPackage> = '';
    abstract create(DClass: DClass): DObject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

@RuntimeAccessible
export class EJavaObject{
    static logic: IsActually<'not exist yet'>;
}// ??? EDataType instance?

@RuntimeAccessible
export /*abstract*/ class DTypedElement extends DNamedElement {
    static logic: typeof LNamedElement;
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

@RuntimeAccessible
export /*abstract*/ class DClassifier extends DNamedElement {
    static logic: typeof LNamedElement;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    // childrens: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

@RuntimeAccessible
export class DPackage extends DNamedElement {
    static logic: typeof LNamedElement;
    parent: Pointer<DPackage | DModel, 0, 'N', LPackage | LModel> = [];

    classifiers: Pointer<DClass, 0, 'N', LClass> = [];
    subpackages: Pointer<DPackage, 0, 'N', LPackage> = []

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //

    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    uri: string;
    constructor(name: string = '', uri: string = '') {
        super(name);
        this.uri = uri;
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class DOperation extends DTypedElement {
    static logic: typeof LTypedElement;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    exceptions: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    parameters: Pointer<DParameter, 0, 'N', LParameter> = [];
}

@RuntimeAccessible
export class DParameter extends DTypedElement {
    static logic: typeof LTypedElement;
    parent: Pointer<DOperation, 0, 'N', LOperation> = [];
}

@RuntimeAccessible
export class DClass extends DClassifier {
    static logic: typeof LClassifier;
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract: boolean = false;
    interface: boolean = false;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    instances: Pointer<DObject, 0, 'N', LObject> = [];
    operations: Pointer<DOperation, 0, 'N', LOperation> = [];
    features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    references: Pointer<DReference, 0, 'N', LReference> = [];
    attributes: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    referencedBy: Pointer<DReference, 0, 'N', LReference> = [];
    extends: Pointer<DClass, 0, 'N', LClass> = [];
    extendedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    constructor(name: string = '', isInterface: boolean = false, isAbstract: boolean = false) {
        super(name);
        this.abstract = isAbstract;
        this.interface = isInterface
        this.className = this.constructor.name;
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

@RuntimeAccessible
export class DDataType extends DClassifier {
    static logic: typeof LClassifier;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];
}

@RuntimeAccessible
export class DStructuralFeature extends DTypedElement {
    static logic: typeof LTypedElement;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    instances: Pointer<DValue, 0, 'N', LValue> = [];

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

@RuntimeAccessible
export class DReference extends DStructuralFeature {
    static logic: typeof LStructuralFeature;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    instances: Pointer<DValue, 0, 'N', LValue> = [];
    containment: boolean = true;
    container: boolean = false; // ?
    resolveProxies: boolean = true; // ?
    opposite: Pointer<DReference, 0, 1, LReference> = null;
}

@RuntimeAccessible
export class DAttribute extends DStructuralFeature {
    static logic: typeof LStructuralFeature;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    isID: boolean = false; // ? exist in ecore as "iD" ?
    instances: Pointer<DValue, 0, 'N', LValue> = [];
}

@RuntimeAccessible
export class DEnumLiteral extends DNamedElement {
    static logic: typeof LNamedElement;
    parent: Pointer<DEnumerator, 0, 'N', LEnumerator> = [];
    value: number = 0;
}

@RuntimeAccessible
export class DEnumerator extends DDataType {
    static logic: typeof LDataType;
    parent: Pointer<DPackage, 0, 'N'> = [];
    literals: Pointer<DEnumLiteral, 0, 'N', LEnumLiteral> = [];
}

@RuntimeAccessible
export class DObject extends DNamedElement { // m1 class instance
    static logic: typeof LNamedElement;
    parent: Pointer<DModel, 0, 'N'> = [];
    instanceof: Pointer<DClass, 0, 'N'> = [];
}

@RuntimeAccessible
export class DValue extends DModelElement { // m1 value (attribute | reference)
    static logic: typeof LModelElement;
    parent: Pointer<DObject, 0, 'N', LObject> = [];
    instanceof: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
}

@RuntimeAccessible
export class DModel extends DNamedElement {
    static logic: typeof LNamedElement;
    packages:  Pointer<DPackage, 0, 'N', LPackage> = [];

    // ******************** ecore officials inherited ******************** //
    // ******************** ecore officials personal ********************* //

    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
    // modellingElements: Pointer<DModelElement, 0, 'N', LModelElement> = [];
}



/*

@RuntimeAccessible
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
@RuntimeAccessible
export class Package{
    data: PackageNoFunc[] = [];
}*/

// export type EClassifier = DClass;

// ******************** ecore officials inherited ******************** //
// ******************** ecore officials personal ********************* //

// ********************** my additions inherited ********************* //
// ********************** my additions personal ********************** //
(DModelElement as any).subclasses = [DModelElement, DModel, DNamedElement,
    DReference, DAttribute, DOperation, DParameter,
    DPackage, DClassifier, DClass, DEnumerator, DEnumLiteral,
    DValue, DObject, DStructuralFeature, DDataType, DTypedElement, DFactory_useless_, DAnnotation, ];
