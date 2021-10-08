import {createStore, Store} from "redux";
import {windoww, IStore, reducer, Action, U} from "../joiner";

interface StateExt{}
export let store: Store<IStore & StateExt, Action> = createStore(reducer);

windoww.store = store;
windoww.s = store.getState;


console.log('store:', {store, wstore: windoww.store, state: U.cloneObj(store.getState())});
