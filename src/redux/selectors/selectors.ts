import {ViewElement, store} from "../../joiner";

export class Selectors{
    static getAllViewElements(): ViewElement[] {
        return Object.values(store.getState().idlookup).filter(v => v.className === ViewElement.name) as ViewElement[]; }

}
