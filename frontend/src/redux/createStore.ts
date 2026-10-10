import {createStore, Store} from "redux";
import {Action, DState, reducer, windoww} from "../joiner";

interface StateExt{}
export let store: Store<DState & StateExt, Action> = createStore(reducer);

windoww.store = store;