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

var nosize: GraphSize = {x:0, y:0, w:0, h:0, nosize:true} as any;
var defaultEdgePointSize: GraphSize = {x:0, y:0, w:5, h:5} as any;
var defaultVertexSize: GraphSize = {x:0, y:0, w:140.6818084716797, h:32.52840805053711} as any;
var defaultPackageSize = new GraphSize(0, 0, 400, 500);

const udLevel = 'ret.level = node.graph.state.level ?? 3\n';
const udLevelG = 'ret.level = node.state.level ?? 3\n';
const udLevelPkg = udLevelG + 'ret.upperLevel = node.graph.state.level ?? 3\n';

class DefaultViews {


    static model(vp: Pointer<DViewPoint>): DViewElement {
        const view = DViewElement.new('Model', DV.modelView(), undefined, '', '', '', [DModel.cname],
            '', 1, false, true, vp);
        view.draggable = false; view.resizable = false;
        view.appliableTo = 'Graph';
        view.oclCondition = 'context DModel inv: true';
        view.palette = {'background-': U.hexToPalette('#fff')};
        view.css = `
.root { background-color: var(--background-1); }
.edges {z-index: 101; position: absolute; height: 0; width: 0; overflow: visible; }
.detail-level{
    position: absolute;
    right: -50px;
    top: 50px;
    display: flex;
    transform: rotate(270deg);
    &>div{
        transform: rotate(90deg) translate(0, 100%);
    }
}`

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
        view.css = '.class {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color:var(--color-2);}\n';
        view.css += '.class-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.class-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
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
        view.css = '.enumerator {border-radius: 0.2em; border-left: 0.25em solid var(--color-1); background: var(--background-1); color: var(--color-2);}\n';
        view.css += '.enumerator-name {font-weight: bold; color: var(--color-1);}\n';
        view.css += '.enumerator-children {background-color: var(--background-2); height: fit-content; width: -webkit-fill-available;}';
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
    max-width: 200px;
    overflow:hidden;
    &:hover, &:focus-within{ overflow: visible; }
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
        view.css = `[hoverscale]:hover, [hoverscale]:focus-within, [hoverscale]:focus{
    transform-origin: center;
    transform: scale(var(--hover-scale));
    &>[hoverscale]:hover, &>[hoverscale]:focus-within, &>[hoverscale]:focus{ transform: scale(1); }
}
  
.edgePoint{
    border-radius: 999px;
    border: 2px solid var(--border-1);
    background: var(--background-1);
    color: var(--color-1);
    width: 100%;
    height: 100%;
    min-height: 15px;
}
`
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
