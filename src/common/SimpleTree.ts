import {Dictionary, GObject, Log, U} from "../joiner";


/* problema: se creo una key per ordinare l'albero e trovare "of" in O(log n), allora perdo l'ordinamento arbitrario di sottoalberi = sottoclassi a prescindere dai nomi.
   potrei fare un dizionario di alberi, 1 albero per ogni dclass e lclass, con sottoelementi
    */

// not binary, not rb tree, not balanced, just a tree
// it is N-ary
// ma probabilmente non dovrei usare affatto un albero, ma fare un dizionario per ogni classe con cosa estende direttamente
// e uno con cosa estende direttamente e indirettamente popolato automaticamente in n*logn una volta e fine
// navigando superclass

// B.superclass = [a1, a2] --- > a1.pushdirectsubclass(b), a2 same.  poi se a1 estende c, c.pushindirectsubclass(b)... e si risale da b finchè ci sono superclassi (logn) volte, fatto per tutte le n classi
// each node have a "node<T>" value and a subtree with all subelements.
// iterable with for...of with width iterator (not depth)
export class SimpleTree<T extends GObject> {
    subelements: SimpleTree<T>[];
    node: T; // can be undef, if root was an array instead of a single element.
    // the nodes containing the rooots will be the childrens instead, as if they are N trees
    // with a fake node joining them in a single one
    // up: SimpleTree<T>; maybe do this too

    [Symbol.iterator] = function*(this:SimpleTree<T>) {
    // [Symbol.iterator]: Generator<number, string, boolean> = function*() {
    // [Symbol.iterator]: Generator<number, string, boolean>= () => {
    // [Symbol.iterator] () {
        yield this;
        let fifo = this.subelements;
        while (fifo.length) {
            let nextLevel = [];
            for (let subtree of fifo) {
                yield subtree;
                nextLevel.push(...subtree.subelements);
            }
            //@ts-ignore
            console.log("fifo -> next level", fifo.map(f=>f?.node?.cname), nextLevel.map(f=>f?.node?.cname));
            fifo = nextLevel;
        }
    }

    getiIsSubElementMatrix(namekey: keyof T): Dictionary<string, Dictionary<string, boolean>>{
        let ret: Dictionary<string, Dictionary<string, boolean>> = {}// matrix name x name telling if A extends B
        return this as any;//
        for (let o of this) { // O(N^2), but optimal for this task, as the matrix size is O(N^2) as well
            let name = o.node[namekey];
            if (!name) Log.ee("missing key property  in tree node: ", {tree: this, node:o.node, namekey});
            ret[name] = {};
            // if (o === this) continue;
            for (let subo of o) {
                let subname = subo.node[namekey];
                if (!subname) { console.log("skipped"); continue; }
                ret[name as string][subname as string] = true;
            }
        }
        return ret;
    }

    public add(e: T, childKey?: keyof T, loopdetector?: WeakMap<T, boolean>): SimpleTree<T> | undefined{
        if (loopdetector) {
            if (loopdetector.get(e)) {
                Log.eDev(e.cname.indexOf("GraphVertex") !== 1,
                    "A constructor is extending 2 different classes, or there is a loop in Tree constructor parameter.",
                    "GraphVertex should be the only class doing that currently",
                    {e, cname:e.cname, childKey, loopdetector});
                return;
            }
            loopdetector.set(e, true);
        }
        let subtree =  new SimpleTree<T>(e, childKey, loopdetector);
        this.subelements.push(subtree);
        return subtree; }

    getSubtree(e: T): SimpleTree<T> | undefined {
        for (let t of this) { if (t.node == e) return t; }
        return undefined; }

    // childkey: adds subobjects found in "roots" parameters as nodes<T> in the tree
    // comparison: tells if a node comes first or after another, example: (a, b) => a.name.toUpperCase() < b.name.toUpperCase()
    constructor(roots: GObject | GObject[], childKey?: keyof T, loopdetector?: WeakMap<T, boolean>) {
        // if arr, add N roots as subelements, and delegate actual subelements of the root to subtree constructors
        if (!loopdetector) loopdetector = new WeakMap();
        /*(this as any)[Symbol.iterator] = function *(){
            yield this;
            let fifo = this.subelements;
            while (fifo.length) {
                let nextLevel = [];
                for (let subtree of fifo) {
                    yield subtree;
                    nextLevel.push(subtree);
                }
                fifo = nextLevel;
            }
        }*/

        //@ts-ignore
        this.debug = roots.cname;
        this.subelements = [];
        if (Array.isArray(roots)) {
            this.node = undefined as any;
            for (let e of roots) {
                if (!e) continue;
                this.add(e as T, childKey, loopdetector);
            }
        }
        // if not arr, add immediate subelements of root
        else {
            this.node = roots as T;
            if (!childKey) return;
            let child: T | T[] = this.node[childKey];
            if (Array.isArray(child)) {
                for (let c of child) this.add(c, childKey, loopdetector);
            }
            else this.add(child, childKey, loopdetector);
        }
    }


}
