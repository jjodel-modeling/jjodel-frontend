import {createStore, PreloadedState, Reducer, Store, StoreEnhancer} from 'redux';
import {
    GObject, GraphPoint, Point,
    DAttribute,
    DClass,
    DModel,
    DModelElement,
    DNamedElement,
    DReference,
    Pointer, PointerTargetable, RuntimeAccessibleClass,
    SetRootFieldAction, TRANSACTION,
} from "../joiner";



export class IStore extends RuntimeAccessibleClass {
    models: Pointer<DModel, 0, 'N'>[] = []; // Pointer<DModel, 0, 'N'>[] = [];
    user: UserState;
    collaborators: UserState[];
    idlookup: Record<string, GObject> = {};
    constructor(){
        super();
        this.user = new UserState();
        this.models = [];
        this.collaborators = [];
        this.fakeinit();
    }

    fakeinit(): void {
        const outElemArray: DModelElement[] = [];
        const m3: DModel = this.makeM3Test(false, outElemArray);
        for (let elem of outElemArray) {
            this.idlookup[elem.id] = elem;
        }
        this.models = [m3.id];
    }

    makeM3Test(fireAction: boolean = true, outElemArray: DModelElement[] = []): DModel {
        const me: DModelElement = new DClass('ModelElement', true);
        const annotation: DClass = new DClass('Annotation');
        annotation.implements = [me.id];
        const namedElement: DClass = new DClass('NamedElement');
        const attribname: DAttribute = new DAttribute('name');
        namedElement.implements = [me.id]; // , classifier.id, namedelement.id, modelelement.id]
        namedElement.attributes = [attribname.id];

        const pkg: DClass = new DClass('M3Package');
        const attriburi: DAttribute = new DAttribute('uri');
        pkg.implements = [namedElement.id];
        pkg.attributes = [attriburi.id];
        const classifierref: DReference = new DReference('classifiers');
        pkg.references = [classifierref.id];

        const model: DClass = new DClass('M3');
        const pkgref: DReference = new DReference('package');
        model.implements = [namedElement.id];
        pkgref.type = pkg.id;
        const classe: DClass = new DClass('Class', false, true);
        classifierref.type = classe.id;
        classe.implements = [namedElement.id]; // , classifier.id, namedelement.id, modelelement.id]
        /// model itself outside of ecore
        const m3: DModel = new DModel('M3');
        m3.packages = [pkg.id];
        // m3.modellingElements = [me.id, annotation.id, namedElement.id, attribname.id, pkg.id, attriburi.id, classifierref.id, pkgref.id, classe.id];
        // dispatching actions

        outElemArray.push.call(outElemArray, m3, me, annotation, namedElement, attribname, pkg, attriburi, classifierref, pkgref, classe);
        if (fireAction)
            TRANSACTION( () => {
                let fake: IStore;
                new SetRootFieldAction('models[]', m3);
                for (let elem of outElemArray) { DModelElement.persist(elem); }
            });
        return m3;
    }
}

enum UserPendingAction {
    addingVertex, linkingVertex, draggingVertex, resizingVertex, draggingGraph,
}
/*
class SynchStore{// shared on session

}
class AsynchStore{ // user private
    pendingUserAction: UserPendingAction[];
}*/
export class UserState extends PointerTargetable{
    pointerPosition?: GraphPoint;
    constructor() { super(true); }
}

export class ViewPointState extends PointerTargetable{
    name: string = '';
}

// todo: ogni entità ha: dati (store), logica con operazioni, dati di presentazione, ...?

export class ModelStore {
    private _meta!: ModelStore | string; // todo: credo sia un Pointer? roba vecchia. oldcomment: // string memorizzata nello store, logicamente si comporta come una reference perchè usi la stringa per recuperare un modelstore (il tipo modelstore è di documentazione)
    instances!: (ModelStore | string)[];

    // todo: figata! getter e setter senza proxy??
    get meta(): ModelStore | string {
        return this._meta;
    }

    set meta(value: ModelStore | string) {
        this._meta = value;
    }
}
/*
type Cconnect = <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = DefaultState>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>
): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;
*/
// export const initialState: IStore = new IStore();
