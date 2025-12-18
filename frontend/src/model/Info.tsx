import type {GObject} from "../joiner";
import {ReactNode} from "react";
import {ShortAttribETypes} from "../common/U";
import {RuntimeAccessibleClass} from "../joiner";

export class Info {
    txt: ReactNode;
    label?: ReactNode;
    type?: ShortAttribETypes | string; //| GObject<"Enum">,
    readType?: ShortAttribETypes | string | typeof RuntimeAccessibleClass;
    writeType?: ShortAttribETypes | string | typeof RuntimeAccessibleClass;
    obsolete?: boolean; // hidden because is about to be removed
    hidden?: boolean; // hidden for other reason (like autogeneration is faulty and is manually generated)
    todo?: boolean; // features that should not be listed yet in the view editor
    isGlobal?: boolean; // for things that are common to all graph elements like jsx
    isNode?: boolean;
    isEdge?: boolean;
    isEdgePoint?: boolean;
    enum?: GObject; // todo: remove or use it
    pattern?: string; // regexp validation
    min?: number; // for numeric types
    max?: number; // for numeric types
    positive?: boolean; // for numeric types
    digits?: number; // for decimal types validation
    step?: number; // for decimal types numeric spinner increase

    static grid: Info = {type:'Point & {type: radial | cartesian, center: left|right|top|bottom|center', txt: 'If present, sub-elements will align to a cartesian grid this.' +
            '\nType is assumed as "cartesian" by default, aligning elements to rows and columns equally spaced.' +
            '\nIf radial snap is activated, the elements will be placed in concentric circles around (0, 0).' +
            '\nX will be treated as the modulo, and Y as the angle in radians.' +
            '\nAt every new circumference (spaced by modulo factor), the angle will be reduced to double the number of elements the bigger circle can hold.' +
            '\nEG: radial with (X = modulo = 100, Y = angle = PI/2).' +
            '\n\tThe origin (0th circle) have radius 0 and 1 element.' +
            '\n\tThe first circle will have radius 100 and 4 elements.' +
            '\n\tThe second circle will have radius 200 and 8 elements.' +
            '\n\tThe third circle will have radius 300 and 16 elements, ...'
    };

    static snap: Info = {type:'Point', txt: 'Whether the element must align to the parent graph\'s grid or not.' +
            '\nA Point as a value allows for asymmetrical grid behaviour toward X and Y axis.' +
            '\nA value of 0 or false, means it will ignore the grid.' +
            '\nA value of 1 or true, will follow the grid.' +
            '\nAny other number will follow the grid at a multiple of said number.' +
            '\nEG: canSnap = {x:0, y:2} will not snap horizontally, and will snap with gaps twice of the grid size for Y axis.'}
}