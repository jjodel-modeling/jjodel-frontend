import type {GObject} from "../joiner";
import React, {ReactNode} from "react";
import {ShortAttribETypes} from "../common/U";
import {RuntimeAccessibleClass} from "../joiner";
type PathArray = string[];
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
    isAlias?: boolean; // if the property is a fault-tolerance fallback, and should be excluded from console live documentation.
    // pathArray entries must be a d-property (not "children")
    // this | ""             --> cache valid if current clonedCounter is unchanged,
    // missing or []              --> global cache is used, valid only as long the whole DState is unchanged
    // "never" | "all"  --> global cache cannot be used either,
    dependencies?: (PathArray | "" | "this" | "all" | "never")[];


    static grid: Info = {type:`Point & {center: left|right|top|bottom|center|tl|tr|bl|br, visible: boolean, type: radial | cartesian}`, txt:
`If present, sub-elements will align to a cartesian grid this.
A grid must be applied to a graph. it will align his vertexes to rows and columns equally spaced.
A value of 0 to an axis means the grid will be turned off for that axis.
EG: graph.grid = {y:0, x:100} will distance items on the X axis at lanes of 100 pixels but won\'t restrict vertical distances. Zoom excluded.
@param visible: an invisible grid will still align his vertexes but doesn\'t produce a visual clue.
    To obtain a visible grid, the element <Grid node={someGraph}/> is required in JSX AND visible set to true.
@Param center: picks a corner or side of the vertex which will be aligned to the grid\'s crosshairs.
    corner names are a combination of the first letter of each side, eg: top +&nbsp;left = tl
@Param type: is currently only working as "cartesian"`
/*
If radial snap is activated, the elements will be placed in concentric circles around (0, 0).' +
X will be treated as the modulo, and Y as the angle in radians.' +
At every new circumference (spaced by modulo factor), the angle will be reduced to double the number of elements the bigger circle can hold.' +
EG: radial with (X = modulo = 100, Y = angle = PI/2).' +
The origin (0th circle) have radius 0 and 1 element.' +
The first circle will have radius 100 and 4 elements.' +
The second circle will have radius 200 and 8 elements.' +
The third circle will have radius 300 and 16 elements, ...'+*/
    };

    static snap: Info = {type:'Point', txt: 'Determines how an individual vertex should follow to the parent graph\'s grid.' +
            '\nA Point as a value allows for asymmetrical grid behaviour toward X and Y axis.' +
            '\nA value of 0 or false, means it will ignore the parent\'s grid.' +
            '\nA value of 1 or true, will follow the grid.' +
            '\nAny other number will follow the grid at a multiple of said number.' +
            '\nEG: canSnap = {x:0, y:2} will not snap horizontally, and will snap with gaps twice of the grid size for Y axis.'};

    static state = {type:"GObject", txt: `<div>A space where the user can store informations for their operations/views.<br/>
Example: The Validation viewpoint uses it to store validation messages through onDataUpdate events, check them for live examples.<br/>
values are set in a http patch approach, <code>this.state = {varname: "value"}<br/>
will set this.state.varname without changing other pre-existing values.<br/>
as such <code>this.state = {}</code> does nothing. to remove a single entry use<br/>
To remove a single entry, use <code>this.state = {varname: undefined}</code>.<br/>
To empty the whole state, use <code>this.clearState()</code>.<br/>
WARNING! do not set proxies in the state, set pointers instead.<br/>
<a href='https://github.com/MDEGroup/jjodel/wiki/L%E2%80%90Object-state'>Learn more on the wiki</a></div>`}

    static allDependencies = {type: 'LModel[]', txt:'Same as dependencies, but it solves recursively the dependencies of his dependencies.'}

    static dependencies = {type: 'LModel[]',
    txt:'Include other models as prerequisite for this model, it is as if this model is "extending" other models.'};

    static suggestedEdges = {type: 'Dictionary<"extend" | "reference" | "packageDependencies" | DmodelName, EdgeStarter[]>', txt: "A map to access all possible kind of edges based on model data." +
            "<br/>extend and reference are the most commonly used for horizontal references (outside the containment tree schema)." +
            "<br/>packageDependencies links packages using classes from other packages." +
            // "<br/>other keys are the names of container data types (mode, package, class, object...) from them to their childrens rendered as Nodes (vertical tree schema)." +
            // todo: implement the commented part as LGrahElement.vertexs.map(v=>{start:v.parentnode.isVertex ? v.parentnode.id : undefined, end:v.id}).filter(e=>e.start) instead. it's a thing of graph more than model.
            "<br/> EdgeStarter is a collection of data useful to start a &lt;Edge /&gt; in JSX."}

    static prefix = {type: "string", txt: "Shortcut for model.package.prefix (default package\'s prefix)."}

    static uri = {type: "string", txt: "Shortcut for model.package.uri (default package\'s uri)."}

    static subpackages = {type: "LPackage[]", txt: "Shortcut for model.package.subpackages (default package\'s subpackages)."}

    static otherObjects = {type:"(...excludeInstances: (string|LClass|Pointer)[], excludeSubclasses: boolean = false)=>LObject[]", txt:<div>Alias for this.otherInstances.</div>}

    static otherInstances = {type:"(...excludeInstances: (string|LClass|Pointer)[], excludeSubclasses: boolean = false)=>LObject[]", txt:<div>Read this.instancesOf documentation first.
            <br/>Retrieves all the objects not obtained between previous calls of this.instancesOf and the last call of this method.
            <br/>Meaning calling it twice without any instancesOf in between, it will return all objects.</div>};

    static instancesOf =  {type: "(instancetypes: orArr<(string | LClass | Pointer)>, includeSubclasses: boolean = false) => LObject[]",
        txt:<div>Retrieves all objects instancing a target class.
            <br/>The first parameter is the targeted class, which can be his name, pointer or object.
            <br/>The second parameter tells if instances of his subclasses needs to be retreieved as well.</div>
    }

    static addObject = {type: "(json: object, instanceof?: LClass) => LObject",
        txt: "Appends an object instancing \"instanceof\" to the model.\n<br>Setting his own properties, and DValues according to the content of the parameter object."}

    static instantiableClasses = {type: "(o?: object, loose?: boolean) => LClass[]",
        txt: "List of all classes which can be used to instantiate an object." +
            "\n<br>Abstract and Interface classes are excluded." +
            "\n<br>If the parameter \"o\" is specified, it will filter only the instances conforming to the object schema." +
            "\n<br>Results are sorted from tightest fit to loosest fit." +
            "\n<br>loose parameter set to true makes return instead a list of matching scores of all subclasses.", hidden: true}

    static partial = {type:'boolean | undefined', txt: 'whether the object is allowed to have extra features other than the ones specified by the metamodel.\n' +
            'shapeless objects are always partial.\n' +
            'undefined means the property is inherited by his metamodel class, a boolean value means it overrides it.'}

    static namee = {type:'string', txt: 'The name of an element, must be a valid identifier.\n' +
            'In case an object have a feature called "name", the feature value will override the object\'s name.\n' +
            'Attributes named "name" will be EID by default, and can be navigated with $ syntax (eg: object.$childName) unless deactivated.\n' +
            'Read EID for more information.',
        dependencies: [["$name"]]
    }

    static eid = {type: "LValue | null", txt: "if present, gets the value of the feature with isID == true",
        // NB: cannot have a "$" dependency here or it breks everything
    dependencies: [["eidFeature"]]}

    static eidFeature = {type: "LValue | null", txt: "if present, gets the structural feature with isID == true",
    dependencies: [["eidFeature"]]};

}