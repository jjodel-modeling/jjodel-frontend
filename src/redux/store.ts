import {GObject, GraphPoint, Point} from "../joiner";
import {createStore, PreloadedState, Reducer, Store, StoreEnhancer} from 'redux';
import {reducer} from './reducer/reducer';
import {DModel, DNamedElement, PointerTargetable} from "../model/dataStructure/modelElement";
import {Pointer} from "../joiner/types";
import {InferableComponentEnhancerWithProps, MapDispatchToPropsNonObject, MapStateToPropsParam} from "react-redux";
import {Action} from "./action/action";

export class IStore {
    models: DModel[]; // Pointer<DModel, 0, 'N'>[] = [];
    user: UserState;
    collaborators: UserState[];

    idlookup: Record<string, GObject> = {};
    constructor(){
        this.user = new UserState();
        this.models = [];
        this.collaborators = [];
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
export const initialState: IStore = new IStore();

interface StateExt{}
export const store:Store<IStore & StateExt, Action> & IStore = createStore(reducer);

