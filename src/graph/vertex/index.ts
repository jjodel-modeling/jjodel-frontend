import type {
    Dictionary
} from "../../joiner";
import {
    Polygon, Circle, Cross, Decagon,
    Asterisk, Ellipse, Enneagon, Hexagon, Nonagon,
    Octagon, Heptagon, Pentagon, Rectangle, Septagon,
    Square, Star, SimpleStar, DecoratedStar, Trapezoid, Triangle,
    Edge,
    GraphElement,
    Vertex, VoidVertex, EdgePoint,
    Graph, GraphVertex, Log,
} from "../../joiner";
/*
let arr: ((typeof GraphElement | typeof Edge) & { cname:string })[] = [
    Polygon, Circle, Cross, Decagon,
    Asterisk, Diamond, Ellipse, Enneagon, Hexagon, Nonagon,
    Octagon, Heptagon, Pentagon, Rhombus, Rectangle, Septagon,
    Square, Star, SimpleStar, DecoratedStar, Trapezoid, Triangle,
    Edge,
    GraphElement,
    Vertex, VoidVertex, EdgePoint,
    Graph, GraphVertex,];*/
type T = Dictionary<string, (typeof GraphElement | typeof Edge) & { cname:string }>;
export const GraphElements: any = {}; // T & {vertexes: T, edges: T, graphs: T, fields: T} = {} as any;
