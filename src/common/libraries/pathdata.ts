export interface SVGPathElementt extends SVGPathElement{
    /**
     * See https://github.com/jarek-foksa/path-data-polyfill
     *
     * See https://svgwg.org/specs/paths/#InterfaceSVGPathData
     */
    getPathData: (settings?: SVGPathDataSettings) => Array<SVGPathSegment>;
    /**
     * See https://github.com/jarek-foksa/path-data-polyfill
     *
     * See https://svgwg.org/specs/paths/#InterfaceSVGPathData
     */
    setPathData: (pathData: Array<SVGPathSegment>) => void;
}
//export type SVGPathElement = SVGPathElementt;

export type SVGPathDataCommand =
    | "A"
    | "a"
    | "C"
    | "c"
    | "H"
    | "h"
    | "L"
    | "l"
    | "M"
    | "m"
    | "Q"
    | "q"
    | "S"
    | "s"
    | "T"
    | "t"
    | "V"
    | "v"
    | "Z"
    | "z";

export interface SVGPathDataSettings {
    normalize: boolean;
}

export interface SVGPathSegment {
    type: SVGPathDataCommand;
    values: Array<number>;
}
