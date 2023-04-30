import {U} from "./U";

export class Uarr{
    public static arrayIntersection<T>(arr1: T[], arr2: T[]): T[]{
        if (!arr1 || ! arr2) return null as any;
        return arr1.filter( e => arr2.indexOf(e) >= 0);
    }

    static arraySubtract(arr1: any[], arr2: any[], inPlace: boolean): any[]{
        let i: number;
        const ret: any[] = inPlace ? arr1 : [...arr1];
        for (i = 0; i < arr2.length; i++) { U.arrayRemoveAll(ret, arr2[i]); }
        return ret; }

}
