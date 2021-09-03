import {createStore, Store} from "redux";
import {windoww, IStore, reducer, Action} from "../joiner";

interface StateExt{}
export let store: Store<IStore & StateExt, Action> = createStore(reducer);
windoww.store = store;
windoww.s = store.getState;
