import type { GObject } from "../joiner";
import { U } from "../joiner";
type NodeVisitorFunction<T> = (visitingNode: Node<T>) => boolean;

export class BinaryTree<T extends GObject>{
    protected childrenKey: keyof T | ((node:T) => T);
    root: T;
    constructor(root: T, childrenKey: keyof T | ((node:T) => T)){

    }
    public first(fn: NodeVisitorFunction<T>, ctx?: object): Node<T> | undefined {}

export class Node<T extends GObject>{

}
