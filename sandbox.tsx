// @ts-noinspect
// @ts-ignore
import {GraphPoint, GraphSize, Log, LViewElement, transientProperties, U, windoww} from "./src/joiner";
import {AllPropss} from "./src/graph/vertex/Vertex";

// 67{}[]'?^&&||nb
export const aaa = 0;
let data:any, node:any, view:any, component:any;
let otherViews: any, m1Objects:any, firstPackage:any, DefaultNode: any, otherPackages:any, refEdges:any, extendEdges:any, React:any, Edge:any;
/*

lvalue <Select value and values> are working
need to test <select multi={true} value and values/>

UML
- stereotype                   skip
- composite structure          skip (similar to component) https://stackoverflow.com/questions/33724003/differences-between-composite-structure-and-component-diagram
- package / class / object     merged in default view






with manuual view assignment (edges) if you type wrong view it becomes a mess crash

when deleting viewpoint, it is not removed from project.viewpoints.
make multiselect o isAplialeto && referece default view
!!!!!!!!! for offset
fai che offset settadelle variabili --offset-x, --offset-y che settano in css left e top del grafo.
MA: disabilita la regola se il grafo ha ui-dragging o simile qualsiasi cosa metta jqui
questo risolve il problema che il grafo parte a 0,0 a prescindere dall'offset salvato in memoria senza rompere il dragging e offset salvato solo ondragend.

for crossref: fix all .father and .parent loops and U."until" or similar stuff to prevent getting the wrong model through .father chain.
data.crossref.target.model  --> other model
data.model --> current model


during first render of any modelelement trigger forceUpdate() because it will lack jqueryui-html events as html was not there.
re-enable the bug and investigate x-8400 stuff that was hapening during resize as it's happening during edge anchoring too

Reducer.suspend()
and Reducer.resume() for stuff like resizing a node

node collapsing:
    theory: edges are rendered before nodes, so it will find a node with size0 (not rendered) and assign that size during get_size.
    proof: when i change the html css size of a vertes to 20px, but i assign in console edge.end.size={w:200, h:200}
           2 actions are fired in sequence, one setting to 200 and one to 20px.
           it does not work if the node is on isResized === false because the getter cannot trigger a set in that case.

node crazy pos: when i resize a node with an edge it goes off screen?




* */
// todo: check oldprops.views-nextprops.views and always set shouldupdate to views newly introduced or removed
/**
 problem when changing ep mode, need to move the ep before it works

 only when changing relative % -> absolute it goes crazy, i think it uses absolute pos as a %

 <div onDragEnd={"dragAnchor("+i+")"}></div>
 <div onDragEnd={e()=> node.anchor[1].x = e.x;}></div>
 <div onDragEnd={e()=> node.anchor[2].x = e.x;}></div>


 anchor roadmap
 2) jqui handling subelements with "draggable resizable rotatable" classes (or attributes or ondrag-* events)

 */
// todo: check oldprops.views-nextprops.views and always set shouldupdate to views newly introduced or remo**ved


// need to merge file declarations? or use a filename such as the imports will work (use inmemory://? or real urls)
// advanced mode and simple mode: hide some features like positional editor in simple mode or the entire tab in view/node, start in simple mode.
// make .overlap.left .top .dow .right, .y-cemter, x-cemter, .cemter css selectors


// N decorator views without jsx, that only set the node.state.errorlist[thisviewerror] = 'Lowerbound violation' etc...
// then 1 view with jsx that displays them all

// syntax error on constants, usageDeclarations are not catched

/*
problem: ep will not update their coordmode until dragged once

view/node editor stuff done:

    bendingMode!: EdgeBendingMode;
    edgeGapMode!: EdgeGapMode;
    edgeStartStopAtBoundaries!: boolean;
    edgeEndStopAtBoundaries!: boolean;
    edgePointCoordMode!: CoordinateMode;
    edgeHeadSize!: GraphPoint;
    edgeTailSize!: GraphPoint;

    kinda obsolute, but still used like a fixed amount anchor, edgepoints can only have 1 incoming and 1 outgoing anchor given by those coords
        edgeStartOffset!: GraphPoint;
        edgeEndOffset!: GraphPoint;
        edgeStartOffset_isPercentage!: boolean;
        edgeEndOffset_isPercentage!: boolean;

missing stuff

    appliableTo!: 'node'|'edge'|'edgePoint';
    subViews
        defaultVSize!: GraphSize;




 */
/*reenable edge menù outside debug mode, (add color palette there? or not?)
make uml arrows (and more common ones)
*

''








model: same im all graphs amd all imstamces
mode+view: always differemt
mode (- view): some views will share the mode positiom
graph__


will it chamge layout_

diff imstamce           1                1                 1
                        mv          m-v(curremt)         model
chamge graph            1                1                 0
chamge vp               0                0                 0
chsmge mode view        1                0                 0


                  chamge graph        chamge vp       chamge view
model                   0                0                 0
                        0                0                 1
                        0                1                 0
                        0                1                 1
m-v                     1                0                 0
m+v                     1                0                 1
                        1                1                 0
                        1                1                 1





















* */
// from this, either as a string or code, find a way to injectprops. as string regex with "Edge(" -> "Edge(nodeid," ?
// pre-defining function Edge(...stuff) {return ActualEdgeComponent(nodeid, ...stuff) before the return React.createElement?
/*
let aa = ()=>{ return React.createElement('div', {className: 'root'}, [
    !data && "Model data missing.",
    React.createElement('div', {className: "edges", style: {zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}, [[
        refEdges.map(se=> Edge({start: se.start.father.node, end: se.end.node, view: "Pointer_ViewEdge" + ( se.start.containment && "Composition" || "Association"), key: se.start.node.id+"-"+se.end.node.id}))
        , extendEdges.map(se=>Edge({start: se.start, end: se.end, view: "Pointer_ViewEdgeInheritance", key: "EXT_"+se.start.node.id+"-"+se.end.node.id}))]

    ]),
    otherPackages.filter(p => p).map(pkg => DefaultNode({key: pkg.id, data: pkg})),
    firstPackage && firstPackage.children.filter(c => c).map(classifier => DefaultNode({key: classifier.id, data: classifier})),
    m1Objects.filter(o => o).map(m1object => DefaultNode({key: m1object.id, data: m1object})),
    otherViews
])});*/

/*
*
    {(()=>{
        let equality= {};
        let inequality = {};
        let missing = {};
        window.equality = equality;
        window.inequality = inequality;
        window.missing = missing;
        window.thiss = this;
        for (let k in this) {
            if (this[k] === window[k]) equality[k] = this[k];
            else if (k in this && !(k in window)) missing[k] = this[k];
            else inequality[k] = {w:window[k], t:this[k]};
        }
        return 1;
    })()}
*
* */

// erase all __proto__ usages youj cam;
// todo: UD = usage declarations are conceptually wrongful implemented now that there are N views to a node.
// tentative fix: compute N UD for all views in mapstatetoprops. store them in a map, check the map in shouldcomponentupdate, update if at least 1 view needs update.
// re-check again the same thing in render() and recompute only the views whose UD tells you they need a recalculation. BUT HOW TO GET OLD VAL?

// option2: make a graphcomponent that does not generate a node. the N views are rendered by N graphcomponents each with his mapstate and shouldcomponentupdate
// nella vista m1 della classe appare onhover un "+" per aggiungere e linkare un target a quella reference
// uncomment errorOverlayView.oclCondition = 'context DValue inv: self.value < 0';
// decorative views rendered first time after creation/loading are crashing because UD is not set yet, seems ud of decorative views is not computed in shouldcomponentupdate


/*cache for proxies with same clomedcoumter, erase cache whem clomedcoumter chamges
proxycache[id] = (clomedCoumter: somemum, proxy: lstuff);
durimg doject wrap, if cc is the same returm cache.proxy. otherwise update it*/

/*
package[0].classes["c"] should be valid

model.addObject({},  "C")
should be valid as if it were:
model.addObject({},  model.instanceof.allClasses["C"])
naming for objects is broken, it's always concept 1_1 when should be "concept 1"_2 or 1.2

// advanced mode and simple mode: hide some features like positional editor in simple mode or the entire tab in view/node, start in simple mode.

for (keys in []) gives "joinOriginal" and "separator"!!! i did not override the proto correctly??
* */
// optimize jsx evaluation by parsing once in a functional value with variables as parameters ({data, view, node, DGraphElement, DAttribute, U ... all the context}) => jsx
// and maybe improve it again by import memoize from "memoize-one"; it is high-order function that memorize the result if params are the same without re-executing it (must not have side effects)

// todo: extract U.JodelObjectIsEqual from shouldcompoupdate that checks for .clonedCounter and with param depths,
//  also save old context for unofficial memoization, if U.JodelObjectIsEqual(context, transient.node.oldContext) can usa cached jsx

// BUG: Le istanze obj di m1 non vengono agiornate se cambio nome alla classe m2


// get final viewstack for a node, also updates OCL scores if needed because of a change in model or parentView (NOT from a change in view)

// todo: actually inject generated color palette to css editor as prefix to monaco editor inner string contents,
//  so monaco editor knows them and can validate variable usage, but those lines are hidden in visual editor.

/*
* verified! firing twice the same SetRootFieldAction("a", 1) does not change state twice, reducer returns old state.
* same for setFieldAction
* oth not tested on array or oject values. and with access modifier -= with non-existing index
* */

/*
* prevent megacrash if someone does <Vertex data={"not a pointer"} /> or <Vertex data={1, null, undefined...} />
*/
// on rename model, update view using .$name, but only when ocl condition includes the pointer of the meta class. (directly or through instanceof, so when it's a non-generic view)


// todo: avoid creating pointedby when src and target are the same.
//  - DONE: Constructors.setPtr, setExternalPtr
//  - missing: in reducer

// todo: inject offset in a subnode with .container or some other special class, and put it everywhere in DV
// because currently in package, it is child[0].child[0], but in model it's just child[0]


// optimize actions, verify toolbox create must make only 1 compositeaction for dmodelelement and 1 for dgraphelement. thenverify transaction nested nad beign end nested
// view selection in jsx by name instead of pointer (or both)
/*
need to fix get_children to work without instanceof (LModelElement.tsx:3962:1)
or delete all DObjects without instanceof in the synchro_model.
todo: context menu object.clear() erases all values of object, if values are object contained they are deleted as well.


todo: new DObject("State" (metaclassname), {serverCounter:1, changes:[{from:this.data.name, ... blablabla, content of changes.type:values}]}


// todo: context.set('counterValue', amount);
//    and dObject.persist()


*
* */

// edgepoint creation undo crashes
/*
    preact can probably be used for dynamical views too, compiled jsx is very similar, just "h()" instead of "React.createElement()"
        https://www.syncfusion.com/blogs/post/preact-vs-react.aspx
    NO million      https://www.reddit.com/r/reactjs/comments/1468v2a/comment/jnpjtl8/
    ? mikado        performance very promising, but syntax very different, closer to angular ngfor, ngif or older style php templating liberaries.
                    https://github.com/nextapps-de/mikado/
benchmark   https://krausest.github.io/js-framework-benchmark/current.html

PureComponent ad memo() both use Object.is() to shallow compare, but they re-defined it with a polyfill.
so overriding it will be of no use, they call their own identical function

 todo:
 skip render for overlapped nodes & out of visible graph area, edges whose start and end are invisible/missing nodes
 if edge have only 1 end outside visible area, that node should be rendered as an empty box, present in graph with correct size but no content
jsx rendering {data.values} array directly crashed

done:
- light mode:
    - disabled measurable events
    - renders only model, package, classifiers
    - lazy size update
    - edge suggestions disabled except for inheritance, but manually reference added edges are allowed


todo:
- modalità light: cambia viste per nascondere attrib, operation etc. suggestedEdges in model view is not used at all. activate window.isLoading...
 or make it so it works like this without making new lightmode views? Graohelement or defaultnode refusing to inject view and calculate jsx of features, suggestededges res is always empty

- import ecore.ecore
- view.appliableTo (node edge, edgepoint) is not working, and is missing graph, graphvertex.   view.appliableToClasses was working i think but had DModelElement targets
- on rightclick there was "reset resizing" or something, that was needed.
- default package super buggato (check in post relase notes)
- import supports only mono-package inputs (pkg is root non-array, not subpackages either)

todo post release:
- storeSize
- up/ down rightclick won't work on m1 features
- not tested but likely bug: html id duplicate if extend and ref edge with same target (don't reference a class you are extending from the same node. no idea what can happen)
- default package è super buggato.
se trascini qualcosa in overflow, tutti gli elementi interni si spostano.
in futuro ci renderà imossibile / da incubo fare scroll / pan nel grafo.

secondo me dovremmo:
1) in model view, renderizzare i package e i sottoelementi di model.$default direttamente nella vista del modello, NON renderizzando $default esplicitamente. lo saltiamo.
2) però adesso abbiamo selezionato come radice il modello invece di un package, quindi nella toolbox a sx dobbiamo istruirlo per fargli creare classi quando è selezionato un modello, e buttargliele in model.$package

feature done:
- toolbar edgepoint
- m1 edges

bugfixes:
- edgepoint must not hide when resizing
- nodes not draggable after changing view
- many bugs on literals
- node size resetting when changing view
- edges isVertexOverlap properties was not working properly when edge was cross-package.



OLD

done
- hide edgepoint if edge is not selected / hovered
- meta-info on features to allow autogenerated structure editors
- Generic inputs (adapt input type / select according to value type)
- completed edge & edgepoint View editor (autogenerated with the 2 points above!)
- Point, Size inputs (textual version, need to do graphical one but low priority)
- measurable actions on m1 (drag, resize, update, NOT rotate)
- edge, edgepoint delay animations ( was required to fix a bug when edgepoints were hiding during resize )
- shortcuts to set values object.$featureName = value; is not valid instead of object.$featureName.values = value;
      it works with enums too setting ordinal if value is numeric, literal if value is string. can be expanded for other types.
- viewpoint highlight row when hover
- add event "onModeUpdate" to do model -> nodepos (which cannot be done in jsx because is the very root)


bugfixes:
- fix view.father log error bug.
- m1 values were trying to access .isContainment, regardless if they were references or attributes.
- fixed data.value = 1; ( the setter )
- <Input> <Textarea> optimizations / generalizations
- loop detector if some component rerenders too much often, disables "onModelChange" until the view has been updated.

untested:
- prevent action with value = proxy from firing. it was crashing super hard in reducer function during "node.x = data;" invalid measurable event.


todo:
- ghpages deploy, tell to put build in gitignore or fix pathing wiith <base href=".">
- !!! remove function.toString() implementation shown in console output
- bug: tabindex on component root won't work?? maybe add onClick ="this.focus()" in injected props? or more generic onClick={onClick(reactevent)} and put it inside component.onClick func



when select edge, select view.edge tab
when select node, select view.node tab


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




/// *************************                                              fixed bug log
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




Error from chokidar (C:\node_modules): Error: EBUSY: resource busy or locked, lstat 'C:\hiberfil.sys
means some import is ill-defined looking for a path inside a library instead of importing from library root.
like import {a} from "library/deephath/notallowed"



WARNING: tree library modified the object you pass in tree.parse() function. it sorts elements in the array with key provided in constructor configuration
// model[this.config.childrenPropertyName] = mergeSort(  ...etc



*/
