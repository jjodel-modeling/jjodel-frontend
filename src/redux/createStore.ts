import {createStore, Store} from "redux";
import {Action} from "./action/action";
import {reducer} from "./reducer/reducer";
import {IStore} from "./store";

interface StateExt{}
export let store: Store<IStore & StateExt, Action> & IStore = createStore(reducer); // null as any;
// setTimeout(() =>  { store = createStore(reducer); }, 0);
let windoww: any = window as any;
windoww.store = store;
windoww.s = store.getState;
