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


    static model(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Model', DSL.parser(DV.modelView()), undefined, '', '', '', [DModel.cname],
            '', 1, false, true, vp);
        view.draggable = false; view.resizable = false;
        view.appliableTo = 'Graph';
        view.oclCondition = 'context DModel inv: true';
        view.palette = {
            'background-': U.hexToPalette('#fff'),
            'color-': U.hexToPalette('#123cd0', '#4b0082', '#ff0000', '#3191bb', '#3191bb')
        };
        view.css = `
&, .Graph{
  //position: absolute;
  background-color: var(--background-1);
  &:hover{ overflow: hidden; }
  height: 100%;
  width: -webkit-fill-available;
}
.root {
    overflow: hidden;
    position: relative;
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
  position: absolute;
  &>*{ border: 0.1em solid #a3a3a3; }
  &>.ui-resizable-handle{ border: none; }
}
&,[data-nodetype], [data-nodetype]>*{
  /* for some reason focus does not work?? so this is a fallback but needs to be properly fixed */
  overflow: hidden;
  &.selected-by-me, &:has(.selected-by-me), &:hover, &:active, &:focus-within, &:focus{
    overflow: visible;
    z-index: 1000 !important;
  }
}
.Edge{
    overflow: visible;
}

/*** CONTROL PANEL BEGIN ***/
 
.control-panel-container {
   position: absolute;
   z-index: 1000;
   top: 0px;
   right: -269px; /* open: 0px, close: -275px */
   width: 320px;
   height: 100%;
   transition: right 0.6s;
   transition-timing-function: cubic-bezier(0.32, 0, 0.58, 1);
}
.control-panel-container .open {
   right: -0px;
}
.control-panel-container .button {
   position: absolute;
   z-index: 1001;
   top: 10px;
   left: 36px;
   font-size: 1.5em;
   width: 16px;
   height: 62px;
   padding: 14px 0 0 0px;
   border-radius: 4px 0 0 4px;
   color: var(--color-5);
   background-color: var(--color-2);
   border-left: 3px solid var(--color-1);
   border-top: 0px solid var(--color-4);
   border-bottom: 0px solid var(--color-4);
   &:hover {
      cursor: pointer;
   }
}
.control-panel-container .button .bi {
   color: var(--color-1);
   font-size: 14px;
}
.control-panel {
   position: relative;
   margin-left: 50px;
   height: 100%;
   width: 270px;
   background: var(--color-1);
   display: block;
   opacity: 1;
   border-left: 3px solid var(--color-2);
   color: var(--color-2);
   padding: 20px;
   box-shadow: -0px -0px 1px var(--color-4);
   
}
.open {
   position: absolute;
   right: 0px!important;
   transition: right 0.6s;
   transition-timing-function: cubic-bezier(0.32, 0, 0.58, 1);
}
.control-panel h1 {
   font-size: 1.4em;
}
.control-panel .section h2 {
   font-size: 1.2em;
   padding: 40px 0px 10px 0px;
}
.control-panel .btn-close {
   padding-top: 0px;
   float: right;
   display: block;
   color: var(--color-2);
   opacity: 1;
   &:hover {
      cursor: pointer;
   }
   
}
.control-panel .section .slider {
   margin-top: 15px;
   position: relative;
   display: flex;
   
}
control-panel .section .toggle {
   width: 100%;
}

/*** CONTROL PANEL END ***/
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

    static package(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Package', DV.packageView(), undefined, '', '', '', [DPackage.cname], '', 1, false, true, vp);
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
            '// ** declarations here ** //\n' +
            udLevelPkg +
            '}';
        return view
    }

    static class(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Class', DV.classView(), undefined, '', '', '', [DClass.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.appliableTo = 'Vertex';
        view.oclCondition = 'context DClass inv: true';
        view.palette = {'color-': U.hexToPalette('#f00', '#000', '#fff'), 'background-':  U.hexToPalette('#fff', '#eee', '#f00')};
        view.css = `
.class { border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color:var(--color-2); }
.class-name{  font-weight: bold; color: var(--color-1); }
.class-children { background-color: var(--background-2); height: fit-content; width: -webkit-fill-available; }
.abstract { font-style: italic; }
.summary { padding: 0.25rem; text-align: center; }`;
        view.defaultVSize = defaultVertexSize;
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.attributes = data.attributes\n' +
            'ret.references = data.references\n' +
            'ret.operations = data.operations\n' +
            'ret.abstract = data.abstract\n' +
            'ret.interface = data.interface\n' +
            udLevel +
            '}';
        // view.events = {e1:"(num) => {\n\tdata.name = num;\n}"}
        return view;
    }

    static enum(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Enum', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.appliableTo = 'Vertex';
        view.oclCondition = 'context DEnumerator inv: true';
        view.palette = {'color-':  U.hexToPalette('#ffa500', '#000', '#fff'), 'background-':  U.hexToPalette('#fff', '#eee', '#f00')};
        view.css =  `
.enumerator { border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2); }
.enumerator-name { font-weight: bold; color: var(--color-1); }
.enumerator-children { background-color: var(--background-2); height: fit-content; width: -webkit-fill-available; }
.summary { padding: 0.25rem; text-align: center; }
`
        view.defaultVSize = defaultVertexSize;
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.literals = data.literals\n' +
            udLevel +
            '}';
        return view;
    }
    static attribute(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Attribute', DV.attributeView(), undefined, '', '', '', [DAttribute.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DAttribute inv: true';
        view.appliableTo = 'Field';
        view.palette = {};
        return view;
    }

    static reference(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Reference', DV.referenceView(), undefined, '', '', '', [DReference.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DReference inv: true';
        view.appliableTo = 'Field';
        view.palette = {};
        return view;
    }

    static operation(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Operation', DV.operationView(), undefined, '', '', '', [DOperation.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DOperation inv: true';
        view.appliableTo = 'Field';
        view.palette = {};
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.data = data\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            udLevel +
            '}';
        return view;
    }

    static parameter(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Parameter', DV.parameterView(), undefined, '', '', '', [DParameter.cname],
            '', 1, false, true, vp);
        view.palette = {};
        view.appliableTo = 'Field';
        view.css = '*{\n\tfontSize:0.8rem;\n}';
        return view;
    }

    static literal(vp: Pointer<DViewPoint>): DViewElement {
        const view: DViewElement = DViewElement.new('Literal', DV.literalView(), undefined, '', '', '', [DEnumLiteral.cname], '', 1, false, true, vp);
        view.oclCondition = 'context DEnumLiteral inv: true';
        view.appliableTo = 'Field';
        view.palette = {};
        view.css = "display: block;";
        return view;
    }

    static object(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Object', DV.objectView(), undefined, '', '', '', [DObject.cname], '', 1, false, true, vp);
        view.adaptWidth = true; view.adaptHeight = true;
        view.oclCondition = 'context DObject inv: true';
        view.palette = {'color-':  U.hexToPalette('#f00', '#000', '#fff'), 'background-': U.hexToPalette('#fff', '#eee', '#f00')};
        view.css = '.object {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2);}\n';
        view.css += '.object-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.object-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
        view.defaultVSize = defaultVertexSize;
        view.appliableTo = 'Vertex';
        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.data = data\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
            udLevel +
        '}';
        return view;
    }

    static value(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Value', DV.valueView(), undefined, '', '', '', [DValue.cname], '', 1, false, true, vp);
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
            '// ** declarations here ** //\n' +
            'ret.instanceofname = data.instanceof?.name\n' +
            'ret.valuesString = data.valuesString()\n' +
            'ret.typeString = data.typeString\n' +
        '}';
        return view;
    }
    static edgepoint(vp: Pointer<DViewPoint>): DViewElement{
        let view: DViewElement = DViewElement.new('EdgePoint', DV.edgePointView(), new GraphSize(0, 0, 25, 25), '', '', '',
            [], '', undefined, false, true, vp);
        view.appliableTo = 'EdgePoint';
        view.resizable = false;
        view.palette = {'color-':  U.hexToPalette('#000'), 'background-': U.hexToPalette('#fff'), 'border-':  U.hexToPalette('#000'), 'hover-scale':{type:'number', unit:'', value:1.3}};
        view.css = `.edgePoint{
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
        view.usageDeclarations = "(ret)=>{ // scope contains: data, node, view, constants, state\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "ret.data = data\n" +
            "ret.node = node\n" +
            "ret.view = view\n" +
            "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n\n" +
            "// ** declarations here ** //\n" +
            "ret.edgestart = node.edge.start?.size+''\n" +
            "ret.edgeend = node.edge.end?.size+''\n" +
            "}"
        // edgePointView.edgePointCoordMode = CoordinateMode.relativePercent;
        view.edgePointCoordMode = CoordinateMode.absolute;
        view.defaultVSize = defaultEdgePointSize;
        return view;
    }
}

export default DefaultViews;
