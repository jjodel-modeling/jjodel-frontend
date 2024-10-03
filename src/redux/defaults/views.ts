import {
    DV,
    DModel,
    DViewElement,
    DViewPoint,
    Pointer,
    DPackage,
    DClass,
    DEnumerator,
    DAttribute,
    DReference,
    DOperation,
    DEnumLiteral,
    DObject,
    DValue,
    DParameter,
    GraphSize,
    CoordinateMode,
    U
} from '../../joiner';
import DSL from "../../DSL/DSL";

var nosize: GraphSize = {x:0, y:0, w:0, h:0, nosize:true} as any;
var defaultEdgePointSize: GraphSize = {x:0, y:0, w:5, h:5} as any;
var defaultVertexSize: GraphSize = {x:0, y:0, w:140.6818084716797, h:32.52840805053711} as any;
var defaultPackageSize = new GraphSize(0, 0, 400, 500);

const udLevel = 'ret.level = node.graph.state.level ?? 3\n';
const udLevelG = 'ret.level = node.state.level ?? 3\n';
const udLevelPkg = udLevelG + 'ret.upperLevel = node.graph.state.level ?? 3\n';

class DefaultViews {

    static model(vp: DViewElement): DViewElement {
        const view = DViewElement.new2(
            'Model', DSL.parser(DV.modelView()), vp,(d)=> {
                d.appliableTo = 'Graph';
                d.appliableToClasses = [DModel.cname];
                d.oclCondition = 'context DModel inv: true';
                d.draggable = false; d.resizable = false;
                d.palette = {
                    'background-': U.hexToPalette('#fff'),
                    'color-': U.hexToPalette('#123cd0', '#4b0082', '#ff0000', '#3191bb', '#3191bb')
                };
            }, false, 'Pointer_ViewModel');

        view.css = `
&, .Graph{
  background-color: var(--background-1);
  height: 100%;
  width: -webkit-fill-available;
}
.edges {z-index: 101; position: absolute; top: 0; left: 0; height: 0; width: 0; overflow: visible; }
.detail-level {
    position: absolute;
    right: -50px;
    top: 50px;
    display: flex;
    transform: rotate(270deg);
    &>div{
        transform: rotate(90deg) translate(0, 100%);
    }
}

/* stuff for subelements */
[data-nodetype="GraphVertex"] {
  width: 50%;
  height: 50%;
}
&,[data-nodetype]{
  select, input{
    background: inherit;
    color: inherit;
    &:empty{
      font-style: italic;
    }
  }
}
[data-nodetype="Field"] {
  white-space: nowrap;
}
[data-nodetype="VoidVertex"],
[data-nodetype="Vertex"],
[data-nodetype="GraphVertex"] {
  &>*{ border: 0.1em solid #a3a3a3; }
  &>.ui-resizable-handle{ border: none; }
}
&,[data-nodetype], [data-nodetype]>*{
  /* for some reason focus does not work?? so this is a fallback but needs to be properly fixed */
  overflow: hidden;
  &.selected-by-me, &:has(.selected-by-me, .Edge), &:hover, &:active, &:focus-within, &:focus{
    overflow: visible;
    z-index: 100 !important;
  }
}
.Edge{
    overflow: visible;
}

/* level-specific rules */

.model-0 {
  height: 100%!important;
  width: 100%!important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.metamodel {
  position: absolute;
  width: max-content;
  height: max-content;
  padding: 10px;
  border: 1px solid var(--secondary)!important;
  border-radius: var(--radius);
}

.model-1 {}
.model-2 {}
.model-3 {}

`;

        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            'let packages = data && data.isMetamodel ? data.packages : [];\n' +
            'let suggestedEdges = data?.suggestedEdges || {};\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            // ¡ The element will update only if one of the listed dependencies has changed !
            '// ** declarations here ** //\n' +
            'ret.firstPackage = packages[0]\n'+
            'ret.otherPackages = packages.slice(1)\n'+
            'ret.m1Objects = data && !data.isMetamodel ? data.allSubObjects : []\n'+
            'ret.refEdges = (suggestedEdges.reference || []).filter(e => !e.vertexOverlaps)\n'+
            'ret.extendEdges = (suggestedEdges.extend || []).filter(e => !e.vertexOverlaps)\n'+
            udLevelG +
            '}';
        return view;
    }

    static package(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Package', DV.packageView(), vp, (view)=>{
            view.appliableToClasses = [DPackage.cname];
            view.oclCondition = 'context DPackage inv: true';
            view.appliableTo = 'GraphVertex';
            view.palette = {'color-':  U.hexToPalette('#028012'), 'background-':  U.hexToPalette('#fff')};
            view.css = `
.package { background-color: var(--background-0); border-radius: 0.2em; border-left: 0.25em solid var(--color-1); }
.package-children { height: -webkit-fill-available; width: -webkit-fill-available; }
.summary { padding: 0.25rem; text-align: center; }
.detail-level {
    position: absolute;
    right: -50px;
    top: 50px;
    display: flex;
    transform: rotate(270deg);
    &>div {
        transform: rotate(90deg) translate(0, 100%);
    }
}`
            view.defaultVSize = defaultPackageSize;
            view.usageDeclarations = '(ret) => {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.data = data\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// custom preparations:\n' +
                '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the listed dependencies has changed !
                '// ** declarations here ** //\n' +
                udLevelPkg +
                '}';
        }, false, 'Pointer_ViewPackage');
        return view
    }

    static class(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Class', DV.classView(), vp, (view)=>{
            view.appliableToClasses = [DClass.cname];
            view.adaptWidth = true; view.adaptHeight = true;
            view.appliableTo = 'Vertex';
            view.oclCondition = 'context DClass inv: true';
            view.palette = {'color-': U.hexToPalette('#f00', '#000', '#fff'), 'background-':  U.hexToPalette('#fff', '#eee', '#f00')};
            view.css = `


/* class */

.class {
    border-radius: var(--model-radius);
    background: var(--model-background);
    color:var(--model-color);

    &>.header{
        padding: 3px 6px;
        white-space: pre;
    }
    .class-name{ 
        font-weight: bold; 
        color: var(--model-accent); 
    }
    .bi {
        color: var(--model-accent); 
        padding-right: 3px;
    }
    .class-children {
        background-color: var(--model-background);
        height: fit-content;
        width: -webkit-fill-available;
        &>*:last-child { padding-bottom: 0.125em; }
    }
    .abstract { font-style: italic; }
    .summary { padding: 0.25rem; text-align: center; }
}
.abstract {
border-style: dotted!important;
border-color: silver!important;
    }

.class:hover {
    box-shadow: var(--model-shadow);
}
            
`;
            view.defaultVSize = defaultVertexSize;
            view.usageDeclarations = `(ret) => {
    // ** preparations and default behaviour here ** //
    // ret.data = data; intentionally excluded: i'm picking the used values individually reducing the re-renders.
    ret.node = node
    ret.view = view
    // custom preparations:
    // data, node, view are dependencies by default. delete them above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the listed dependencies has changed !
    // ** declarations here ** //
    ret.attributes = data.attributes
    ret.references = data.references
    ret.operations = data.operations
    ret.abstract = data.abstract
    ret.interface = data.interface
    ${udLevel}
}`;
            // view.events = {e1:"(num) => {\n\tdata.name = num;\n}"}
        }, false, 'Pointer_ViewClass');
        return view;
    }

    /* ENUM */

    static enum(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Enum', DV.enumeratorView(), vp, (view)=>{
            view.appliableToClasses = [DEnumerator.cname];
            view.adaptWidth = true; view.adaptHeight = true;
            view.appliableTo = 'Vertex';
            view.oclCondition = 'context DEnumerator inv: true';
            view.palette = {'color-':  U.hexToPalette('#ffa500', '#000', '#fff'), 'background-':  U.hexToPalette('#fff', '#eee', '#f00')};
//             view.css =  `
// .enumerator {
//     border-radius: 0.2em;
//     border-left: 0.25em solid var(--color-1);
//     background: var(--background-1);
//     color:var(--color-2);
//     &>.header{
//         padding: 3px 6px;
//         white-space: pre;
//     }
//     .enumerator-name { font-weight: bold; color: var(--color-1); }
//     .enumerator-children {
//         background-color: var(--background-2);
//         height: fit-content;
//         width: -webkit-fill-available;
//         &>*:last-child { padding-bottom: 0.125em; }
//     }
//     .summary { padding: 0.25rem; text-align: center; }
// }
// `

            view.css = `
.enumerator {
    border-radius: var(--radius);
    background: white;
    color:var(--model-color);
    &>.header{
        padding: 3px 6px;
        white-space: pre;
    }
    .enumerator-name { font-weight: bold; color: var(--accent-secondary); }
    .bi {
        color: var(--accent-secondary);
    }
    .enumerator-children {
        background-color: white; 
        height: fit-content;
        width: -webkit-fill-available;
        &>*:last-child { padding-bottom: 0.125em; }
    }
    .summary { padding: 0.25rem; text-align: center; }
}

.enumerator:hover {
    box-shadow: 0 0 5px silver;
}
`
            view.defaultVSize = defaultVertexSize;
            view.usageDeclarations = `(ret) => {
    // ** preparations and default behaviour here ** //
    // ret.data = data; intentionally excluded: i'm picking the used values individually reducing the re-renders.
    ret.node = node
    ret.view = view
    // custom preparations:
    // data, node, view are dependencies by default. delete them above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the listed dependencies has changed !
    // ** declarations here ** //
    ret.literals = data.literals
    ${udLevel}
}`;
        }, false, 'Pointer_ViewEnum');
        return view;
    }

    /* ATTRIBUTE */

    static attribute(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Attribute', DV.attributeView(), vp, (view)=>{
            view.appliableToClasses = [DAttribute.cname];
            view.oclCondition = 'context DAttribute inv: true';
            view.appliableTo = 'Field';
            view.css = `
.feature{
    display: flex;
    padding: 2px 5px;
    select {
        margin-left: auto;
        width: max(33%, 75px);
    }
}`;
        }, false, 'Pointer_ViewAttribute');
        return view;
    }

    /* REFERENCE */

    static reference(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Reference', DV.referenceView(), vp, (view)=>{
            view.appliableToClasses = [DReference.cname];
            view.oclCondition = 'context DReference inv: true';
            view.appliableTo = 'Field';
            view.css = `
.feature{
    display: flex;
    padding: 2px 5px;
    select {
        margin-left: auto;
        width: max(33%, 75px);
    }
}`;
        }, false, 'Pointer_ViewReference');
        return view;
    }

    /* OPERATION */

    static operation(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Operation', DV.operationView(), vp, (view)=>{
            view.appliableToClasses = [DOperation.cname];
            view.oclCondition = 'context DOperation inv: true';
            view.appliableTo = 'Field';
            view.usageDeclarations = `(ret) => {
    // ** preparations and default behaviour here ** //
    ret.data = data
    ret.node = node
    ret.view = view
    // custom preparations:
    // data, node, view are dependencies by default. delete them above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the listed dependencies has changed !
    // ** declarations here ** //
    ${udLevel}
}`;
            view.css = `
.operation{
    display: flex;
    padding: 2px 5px;
    select {
        margin-left: auto;
        width: max(33%, 75px);
    }
    .parameters{
        background-color: var(--background-2);
        left: 0;
        top: 100%;
        width: 100%;
    }
}`;
        }, false, 'Pointer_ViewOperation');
        return view;
    }

    /* PARAMETER */

    static parameter(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Parameter', DV.parameterView(), vp, (view)=>{
            view.appliableToClasses = [DParameter.cname];
            view.appliableTo = 'Field';
        }, false, 'Pointer_ViewParameter');
        view.css = `
.parameter{
    display: flex;
    padding-left: 1em;
    width: calc(100% - 1em);
    .modifier{
        width: 1ic;
        text-align: center;
    }
}`
        return view;
    }

    /* LITERAL */

    static literal(vp: DViewElement): DViewElement {
        const view: DViewElement = DViewElement.new2('Literal', DV.literalView(), vp, (view)=>{
            view.appliableToClasses = [DEnumLiteral.cname];
            view.oclCondition = 'context DEnumLiteral inv: true';
            view.appliableTo = 'Field';
            view.palette = {};
            view.css = "display: block;";
        }, false, 'Pointer_ViewLiteral');
        return view;
    }

    /* OBJECT */

    static object(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Object', DV.objectView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = true; view.adaptHeight = true;
            view.oclCondition = 'context DObject inv: true';
            view.palette = {'color-':  U.hexToPalette('#f00', '#000', '#fff'), 'background-': U.hexToPalette('#fff', '#eee', '#f00')};

            // view.css = '.object {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2);}\n';
            // view.css += '.object-name {font-weight: bold; color: var(--color-1);}\n';
            // view.css += '.object-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';

            view.css = '.object {border-radius: var(--radius); background: white; color: var(--accent);}\n';
            view.css +='.object-name {padding: 10px; font-weight: 600; color: var(--accent);}\n';
            view.css += '.object-children {padding: 10px;background-color: white; height: fit-content; width: -webkit-fill-available;}';


            view.defaultVSize = defaultVertexSize;
            view.appliableTo = 'Vertex';
            view.usageDeclarations = '(ret) => {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.data = data\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the listed dependencies has changed !
                '// ** declarations here ** //\n' +
                'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
                udLevel +
                '}';
        }, false, 'Pointer_ViewObject');
        return view;
    }

    /* SINGLETON OBJECT */

    static singleton(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Singleton', DV.singletonView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = false; view.adaptHeight = false;
            view.jsCondition = 'return data.instanceof.isSingleton';
            //view.oclCondition = 'context DObject inv: true';

            //view.palette = {'color-':  U.hexToPalette('#f00', '#000', '#fff'), 'background-': U.hexToPalette('#fff', '#eee', '#f00')};

            view.css = '.singleton {text-align: center; border: none; background-color: var(--accent); color: white; padding: 4px 30px; width: fit-content; border-radius: var(--radius);}\n';
            view.css += '.singleton::before {position: absolute; left: 10px; font-family: bootstrap-icons; content: "\\F799";}\n';

            view.defaultVSize = defaultVertexSize;
            view.appliableTo = 'Vertex';
            view.usageDeclarations = '(ret) => {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.data = data\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the listed dependencies has changed !
                '// ** declarations here ** //\n' +
                'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
                'ret.isSingleton = data.instanceof?.isSingleton || false\n' +
                udLevel +
                '}';
        }, false, 'Pointer_ViewSingleton');
        return view;
    }

    /* VALUE */

    static value(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Value', DV.valueView(), vp, (view)=>{
            view.appliableToClasses = [DValue.cname];
            view.oclCondition = 'context DValue inv: true';
            view.palette = {};
            view.css = `.value{
    padding-right: 6px;
    max-width: 300px;
    min-width: 100%;
    overflow:hidden;
    &:hover, &:focus-within{ overflow: visible; }
    /*.values_str{
        maxWidth: 100px;
    }*/
}`;
            view.appliableTo = 'Field';
            view.usageDeclarations = '(ret) =>  {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the listed dependencies has changed !
                '// ** declarations here ** //\n' +
                'ret.instanceofname = data.instanceof?.name\n' +
                'ret.valuesString = data.valuesString()\n' +
                'ret.typeString = data.typeString\n' +
                '}';
        }, false, 'Pointer_ViewValue');
        return view;
    }
    static edgepoint(vp: DViewElement): DViewElement{
        let css = `.edgePoint{
    border: 2px solid var(--border-1);
    background: var(--background-1);
    color: var(--color-1);
    width: 100%;
    height: 100%;
    min-height: 15px;
    min-width: 5px;
    &:hover, &:focus-within, &:focus{
        transform-origin: center;
        transform: scale(1.3);
    }
}
[hoverscale]:hover, [hoverscale]:focus-within, [hoverscale]:focus{
    transform-origin: center;
    transform: scale(var(--hover-scale));
    &>[hoverscale]:hover, &>[hoverscale]:focus-within, &>[hoverscale]:focus{ transform: scale(1); }
}

`;
        let usageDeclarations = "(ret)=>{ // scope contains: data, node, view, constants, state\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "ret.data = data\n" +
            "ret.node = node\n" +
            "ret.view = view\n" +
            "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n\n" +
            // ¡ The element will update only if one of the listed dependencies has changed !
            "// ** declarations here ** //\n" +
            "ret.edgestart = node.edge.start?.size+''\n" +
            "ret.edgeend = node.edge.end?.size+''\n" +
            "}"
        // edgePointView.edgePointCoordMode = CoordinateMode.relativePercent;
        let view: DViewElement = DViewElement.new2('EdgePoint', DV.edgePointView(), vp, (d)=>{
            d.appliableTo = 'EdgePoint';
            d.resizable = false;
            d.palette = {'color-':  U.hexToPalette('#000'), 'background-': U.hexToPalette('#fff'), 'border-':  U.hexToPalette('#000'), 'hover-scale':{type:'number', unit:'', value:1.3}};
            d.css = css;
            d.usageDeclarations = usageDeclarations;
            d.edgePointCoordMode = CoordinateMode.absolute;
            d.defaultVSize = defaultEdgePointSize;
            // d.defaultVSize = new GraphSize(0, 0, 25, 25);
        }, false, 'Pointer_ViewEdgePoint');
        return view;
    }

    static anchor(vp: DViewElement): DViewElement {
        let ret = DViewElement.new2('Anchors', DV.anchorJSX(), vp, (v) => {
            v.isExclusiveView = false;
            v.palette={'anchor-': U.hexToPalette('#77f', '#f77', '#007'),
                'anchor-hover-': U.hexToPalette('#7f7', '#a44', '#070')};
            v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
                "// ** preparations and default behaviour here ** //\n" +
                "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
                "// ** declarations here ** //\n" +
                "ret.anchors = (node && node.anchors || {});\n"+
                "ret.dragAnchor = node.events.dragAnchor; // @autogenerated, do not edit\n"+
                "ret.assignAnchor = node.events.assignAnchor; // @autogenerated, do not edit\n"+
                "}";
            v.events = {
                dragAnchor: '(coords /*Point*/, anchorName /*string*/)=>{\n' +
                    '\tconst updateAnchor = {};\n'+
                    '\tupdateAnchor[anchorName] = coords;\n'+
                    '\tnode.anchors=updateAnchor;\n'+
                    '}',
                assignAnchor: '(anchorName /*string*/)=>{\n' +
                    '\tnode.assignEdgeAnchor(anchorName);\n'+
                    '}'}
            v.css = `
.anchor.valid-anchor{
    display:block;
}

.anchor{
    display:none;
    position: absolute;
    background-color: var(--anchor-1);
    outline: 2px solid var(--anchor-3);
    transform: translate(-50%, -50%);
    pointer-events: all;
    cursor: crosshair;
    
    &:hover{
        background-color: var(--anchor-hover-1);
        outline: 2px solid var(--anchor-hover-3);
    }
    &.active-anchor{
        background-color: var(--anchor-2);
        &:hover{
            background-color: var(--anchor-hover-2);
        }
    }
}
`
        }, false, 'Pointer_ViewAnchors' );
        return ret;
    }
}

export default DefaultViews;
