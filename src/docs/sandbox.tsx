export const uselessexport = {};

/*
*
* <path className={"clickable"} style={{pointerEvents:"all"}} strokeWidth={4} stroke={"transparent"} fill={"none"} d={s.dpart}></path>,
                    s.label &&[<text textAnchor="middle">{s.label}</text>,
                    s.label && <foreignObject style={{x:(s.start.pt.x + s.end.pt.x)/2+"px", y:(s.start.pt.y + s.end.pt.y)/2+"px"}}>{s.label}</foreignObject>

                 *
                 * */
/*let s: any, e: any; let edge: any;
let jsx = <div className={"edge"} style={{overflow: "visible", width:0, height:0}}>
    <svg className={"hoverable"} style={{width:"100vw", height:"100vh", pointerEvents:"none"}}>
        <path className={"preview"} strokeWidth={2} stroke={"gray"} fill={"none"} d={edge.d} style={{pointerEvents:"none"}}></path>
        <path className={"content"} strokeWidth={4} stroke={"black"} fill={"none"} d={edge.d} style={{pointerEvents:"none"}}></path>
        {edge.segments.all.map((s) => <>
            <path className={"clickable"} style={{pointerEvents:"all"}} strokeWidth={4} stroke={"transparent"} fill={"none"} d={s.dpart}></path>
            {s.label &&<div>
                <text textAnchor="middle">{s.label}</text>
                <foreignObject >{s.label}</foreignObject></div>
                    }
            </div>)
            </svg>
            {
                false &&
                <EdgePoint key={"midnode1"} view={"Pointer_ViewEdgePoint"} />
            }{
                false &&
                <EdgePoint key={"midnode2"} view={"Pointer_ViewEdgePoint"} />
            }{
                false && props.children && "this would cause loop no idea why, needs to be fixed to allow passing EdgeNodes here" || []
            }
                </div>
*/
/*

only first package to package or package to class edge is visible
second reference edge causes eternal loop


problema con subgraphs and edges.
start.size, refers to position and size inside a subgraph (package).
but edges are rendered at model, so
- moving package does not move containing edges
- having package not in position 0,0 makes edges inside him misplaced.

solutions:
- render edges inside topmost package
---- problem: how to handle cross-package refs?
---- restrictions on edge z-index as the start and end location have different stacking contexts. (unfixable)

- render edge paths with htmlSize (way to go? hard but all fixable) or use outernmostSize
---- problem: resizing graph tab does not update edge positions
---- problem: moving a package does not update edges
-------- solution: on package move, get all deges starting or ending in his sueleements and update them










- when dragging class vertex node inside a package, then asking his size on console returns x:0, y:0 and resets his position
- field size inside package is wrong when package is not in coords 0,0 position is relative to outer graph instead of graphvertex
- subpackage broken cannot drag or display subelements, but adds them (visible from tree view)


todo:

coerenza conflitti:
- roolback se dal server ricevi una azione con tempo precedente all'ultima azione eseguita localmente.
  il rollback procede fino alla prima azione con timestamp più vecchio di quella ricevuta dal server. poi riesecuzione riorinando le azioni by timestamp & user id in caso di same timestamp.
- questo implica un funzionamento completo e perfetto di undo/redo.
- in reducer, edit +=, -= actions, vengono effettivamente "eseguite", ma poi modificate in:
    (+=)    "path.to.array.INDEX = value_inserted"      OR
    (-=)    "path.to.array = [value_post_deletion]"     e il server deve riceverle solo in questa forma.

- sometimes deletion by setting undefined does not work well,
   consider replacing it with a special "delete" value with unicode chars that are unlikely to be found (like "←¦dëletê┤" },
   when an action is attempting to set that val, it triggers (delete object[key]) instead. and then needs to get all pointedby and pdate them if it was inside an array (indexes moved)
   or check if array with holes are iterated without undefineds ([1, empty x4, 2] in for...in but have a[1] === undefined, a[5] === 2

all GraphElement utilities
going down;
- subVertexes
- subFields
- edges
...

going up:
- graph (rework)
- vertex
- edge (from edgepoint)

coerenza con LModelElement:
- father
- childrens
...



Error from chokidar (C:\node_modules): Error: EBUSY: resource busy or locked, lstat 'C:\hiberfil.sys
means some import is ill-defined looking for a path inside a library instead of importing from library root.
like import {a} from "library/deephath/notallowed"



WARNING: tree library modified the object you pass in tree.parse() function. it sorts elements in the array with key provided in constructor configuration
// model[this.config.childrenPropertyName] = mergeSort(  ...etc







 */
