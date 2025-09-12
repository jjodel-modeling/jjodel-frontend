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
    U,
    Defaults
} from '../../joiner';
import DSL from "../../DSL/DSL";

var nosize: GraphSize = {x:0, y:0, w:0, h:0, nosize:true} as any;
var defaultEdgePointSize: GraphSize = {x:0, y:0, w:15, h:5} as any;
var defaultVertexSize: GraphSize = {x:0, y:0, w:140.6818084716797, h:32.52840805053711} as any;
var defaultPackageSize = new GraphSize(0, 0, 400, 500);

const udLevel = 'ret.level = node.graph.state.level ?? 3\n';
const udGrid = 'ret.grid = node.graph.state.grid ?? false\n'
const udSnap = 'ret.snap = node.graph.state.snap ?? true\n'

const udLevelG = 'ret.level = node.state.level ?? 3\n';
const udGridG = 'ret.grid = node.state.grid ?? false\n';
const udSnapG = 'ret.snap = node.state.snap ?? true\n';


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
            }, false, Defaults.Pointer_ViewModel);

        view.css = `
&, .Graph{
  background-color: var(--background-1);
  height: 100%;
  width: -webkit-fill-available;
}
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
.grid-classic {
    background-image: radial-gradient(silver 1px, transparent 0);
    background-size: 15px 15px;
    background-position: 10px 10px;
}
.grid-paper {
  background-color: white;
  background-image:
    /* thick dark blue lines */
    linear-gradient(to right, #047dc83a 0.5px, transparent 0px),
    linear-gradient(to bottom, #047dc83a 0.5px, transparent 0px),
    /* thin light blue lines */
    linear-gradient(to right, #a4c8042e 0.5px, transparent 0px),
    linear-gradient(to bottom, #a4c8042e 0.5px, transparent 0px);
  background-size:
    90px 90px, /* dark vertical */
    90px 90px, /* dark horizontal */
    9px 9px,   /* light vertical */
    9px 9px;   /* light horizontal */
}

`;

        view.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            'let packages = data && data.isMetamodel ? data.packages : [];\n' +
            'let suggestedEdges = data?.suggestedEdges || {};\n' +
            '// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            // ¡ The element will update only if one of the Observed Properties has changed !
            '// ** declarations here ** //\n' +
            'ret.firstPackage = packages[0]\n'+
            'ret.otherPackages = packages.slice(1)\n'+
            'ret.m1Objects = data && !data.isMetamodel ? data.allSubObjects : []\n'+
            'ret.refEdges = (suggestedEdges.reference || []).filter(e => !e.vertexOverlaps && e.sameGraph)\n'+
            'ret.extendEdges = (suggestedEdges.extend || []).filter(e => !e.vertexOverlaps && e.sameGraph)\n'+
            udLevelG + udGridG + udSnapG +
            '}';
        return view;
    }

    /* Package */

    static package(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Package', DV.packageView(), vp, (view)=>{
            view.appliableToClasses = [DPackage.cname];
            view.oclCondition = 'context DPackage inv: true';
            view.appliableTo = 'GraphVertex';
            view.palette = {'color-':  U.hexToPalette('#028012'), 'background-':  U.hexToPalette('#fff')};
            view.css = `
border-radius: var(--radius);
.package { background-color: var(--background-0); border-left: 0.25em solid var(--color-1); }
.package-children { height: -webkit-fill-available; width: -webkit-fill-available; }
.summary { padding: 0.25rem; text-align: center; }
.drag-handle {
    position: absolute;
    cursor: grab;
    z-index: 1;
    width: 25px;
    height: 18px;
}
.detail-level {
    position: absolute;
    z-index: 1;
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
                '// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the Observed Properties has changed !
                '// ** declarations here ** //\n' +
                udLevelPkg +
                '}';
        }, false, Defaults.Pointer_ViewPackage);
        // view.onDataUpdate = "if (grid) {\n   node.x = node.x - (node.x % 15);\n   node.y = node.y - (node.y % 15);\n}";
        return view
    }

    /* Class */ 

    static class(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Class', DV.classView(), vp, (view)=>{
            view.appliableToClasses = [DClass.cname];
            view.adaptWidth = true; 
            view.adaptHeight = true;
            view.appliableTo = 'Vertex';
            view.oclCondition = 'context DClass inv: true';
            view.palette = {'color-': U.hexToPalette('#f00', '#000', '#fff'), 'background-':  U.hexToPalette('#fff', '#eee', '#f00')};
            view.css = `

/* class */

border-radius: 3px;
.class {
    border-radius: 3px;
    background: var(--model-background);
    color:var(--model-color);
    min-width: 160px;

    &>.header{
        padding: 3px 6px;
        white-space: pre;
        text-align: center;
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
        min-height: 6px;
        width: -webkit-fill-available;
        &>*:last-child { padding-bottom: 0.125em; }
    }
    .abstract { 
        font-style: italic; 
        border: none!important;
    }
    .summary { 
        padding: 0.25rem; 
        text-align: center; 
    }
}
.highlight {
    border: 2px solid red!important;
}
.abstract {
border-style: dotted!important;
border-color: silver!important;
    }

.class:hover {
    box-shadow: var(--model-shadow);
}

div.header:has(.open:hover) {


    &>div.help {
        display: visible!important;
    }
}

.help {
    display: none;
    z-index: 10000;
    position: absolute;
    top: 0px;
    left: 0px;
    border: 1px solid var(--accent);
    margin-top: -40px;
    min-height: 30px;
    min-width: 120px;
    border-radius: 4px;
    background-color: var(--bg-2);
}

            

`;
            view.defaultVSize = defaultVertexSize;
            view.usageDeclarations = `(ret) => {
    // ** preparations and default behaviour here ** //
    // ret.data = data; intentionally excluded: i'm picking the used values individually reducing the re-renders.
    ret.node = node
    ret.view = view
    // custom preparations:
    // data, node, view are dependencies by default. delete the line(s) above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the Observed Properties has changed !
    // ** declarations here ** //
    ret.attributes = data.attributes
    ret.references = data.references
    ret.operations = data.operations
    ret.abstract = data.abstract
    ret.interface = data.interface
    ret.refs = data.referencedBy.filter(a => typeof a !== 'undefined')
    ret.refNames = ret.refs.filter(a => typeof a !== 'undefined').filter(a => a.model.id !== data.model.id).map(a => a.model.name + '::'  + a.parent.name + '.' + a.name)
    ${udLevel}
    ${udGrid}
    ${udSnap}

}`;
            // view.events = {e1:"(num) => {\n\tdata.name = num;\n}"}
        }, false, Defaults.Pointer_ViewClass);
        
        view.onDataUpdate = "if (snap) {\n";
        view.onDataUpdate += "  const x = node.x, y = node.y;\n";
        view.onDataUpdate += "  if (x !== 0 || y !== 0) {\n";
        view.onDataUpdate += "    const zx = (node.zoom && node.zoom.x) || 1;\n";
        view.onDataUpdate += "    const zy = (node.zoom && node.zoom.y) || 1;\n";
        view.onDataUpdate += "    const w2 = node.w * 0.5;\n";
        view.onDataUpdate += "    const h2 = node.h * 0.5;\n";
        view.onDataUpdate += "    const gx = 30 * zx;\n";
        view.onDataUpdate += "    const gy = 30 * zy;\n";
        view.onDataUpdate += "    const cx = x + w2;\n";
        view.onDataUpdate += "    const cy = y + h2;\n";
        view.onDataUpdate += "    const nx = Math.round(cx / gx) * gx - w2;\n";
        view.onDataUpdate += "    const ny = Math.round(cy / gy) * gy - h2;\n";
        view.onDataUpdate += "    if (nx !== x) node.x = nx;\n";
        view.onDataUpdate += "    if (ny !== y) node.y = ny;\n";
        view.onDataUpdate += "  }\n";
        view.onDataUpdate += "}\n";

        return view;
    }

    /* ENUM */

    static enum(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Enum', DV.enumeratorView(), vp, (view)=>{
            view.appliableToClasses = [DEnumerator.cname];
            view.adaptWidth = true; 
            view.adaptHeight = true;
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
border-radius: 3px;
.enumerator {
    border-radius: 3px;
    background: white;
    color:var(--model-color);
    min-width: 140px;

    &>.header{
        padding: 3px 6px;
        white-space: pre;
        text-align: center;
    }
    .enumerator-name { font-weight: bold; color: var(--accent-secondary); }
    .bi {
        color: var(--accent-secondary);
    }
    .enumerator-children {
        background-color: white; 
        min-height: 6px;
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
    // data, node, view are dependencies by default. delete the line(s) above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the Observed Properties has changed !
    // ** declarations here ** //
    ret.literals = data.literals
    ${udLevel}
    ${udSnap}

}`;
        }, false, Defaults.Pointer_ViewEnum);

        view.onDataUpdate = "if (snap) {\n";
        view.onDataUpdate += "  const x = node.x, y = node.y;\n";
        view.onDataUpdate += "  if (x !== 0 || y !== 0) {\n";
        view.onDataUpdate += "    const zx = (node.zoom && node.zoom.x) || 1;\n";
        view.onDataUpdate += "    const zy = (node.zoom && node.zoom.y) || 1;\n";
        view.onDataUpdate += "    const w2 = node.w * 0.5;\n";
        view.onDataUpdate += "    const h2 = node.h * 0.5;\n";
        view.onDataUpdate += "    const gx = 30 * zx;\n";
        view.onDataUpdate += "    const gy = 30 * zy;\n";
        view.onDataUpdate += "    const cx = x + w2;\n";
        view.onDataUpdate += "    const cy = y + h2;\n";
        view.onDataUpdate += "    const nx = Math.round(cx / gx) * gx - w2;\n";
        view.onDataUpdate += "    const ny = Math.round(cy / gy) * gy - h2;\n";
        view.onDataUpdate += "    if (nx !== x) node.x = nx;\n";
        view.onDataUpdate += "    if (ny !== y) node.y = ny;\n";
        view.onDataUpdate += "  }\n";
        view.onDataUpdate += "}\n";       
        
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
        }, false, Defaults.Pointer_ViewAttribute);
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
        }, false, Defaults.Pointer_ViewReference);
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
    // data, node, view are dependencies by default. delete the line(s) above if you want to remove them.
    // add preparation code here (like for loops to count something), then list the dependencies below.
    // ¡ The element will update only if one of the Observed Properties has changed !
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
        }, false, Defaults.Pointer_ViewOperation);
        return view;
    }

    /* PARAMETER */

    static parameter(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Parameter', DV.parameterView(), vp, (view)=>{
            view.appliableToClasses = [DParameter.cname];
            view.appliableTo = 'Field';
        }, false, Defaults.Pointer_ViewParameter);
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
        }, false, Defaults.Pointer_ViewLiteral);
        return view;
    }

    /* OBJECT */

    static object(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Object', DV.objectView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = true; 
            view.adaptHeight = true;
            view.oclCondition = 'context DObject inv: true';
            view.palette = {'color-':  U.hexToPalette('#f00', '#000', '#fff'), 'background-': U.hexToPalette('#fff', '#eee', '#f00')};

            view.css = 'border-radius: 3px;\n.object {\n';
            view.css += '   border-radius: 3px; \n';
            view.css += '   min-width: 160px;\n';
            view.css += '   & .header {\n';
            view.css += '        text-align: center;  \n';
            view.css += '        &> div {\n';
            view.css += '            & input:placeholder-shown {\n';
            view.css += '                display: inline-block!important;\n';
            view.css += '                margin-left: 30px!important;\n';
            view.css += '            }\n';
            view.css += '        }\n';
            view.css += '   }\n';
            view.css += '   background: transparent; \n';
            view.css += '   color: var(--accent);\n';
            view.css += '}\n';
            view.css += '.object-name {padding: 10px; font-weight: 600; color: var(--accent);}';
            view.css += '\n.object-children {padding: 10px;background-color: white; height: fit-content; width: -webkit-fill-available;}';
            view.defaultVSize = defaultVertexSize;
            view.appliableTo = 'Vertex';
            view.usageDeclarations = '(ret) => {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.data = data\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the Observed Properties has changed !
                '// ** declarations here ** //\n' +
                'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
                udLevel + udSnap +

                '}';
        }, false, Defaults.Pointer_ViewObject);
        view.onDataUpdate = "";
        view.onDataUpdate += "if (snap) {\n";
        view.onDataUpdate += "  if (node.x !== 0 || node.y !== 0) {\n";
        view.onDataUpdate += "    node.x = node.x - ((node.x + node.w/2) % 30);\n";
        view.onDataUpdate += "    node.y = node.y - ((node.y + node.h/2) % 30);\n";
        view.onDataUpdate += "\n";
        view.onDataUpdate += "    setInterval(() => {\n";
        view.onDataUpdate += "      node.edgesOut\n";
        view.onDataUpdate += "        .filter(edge => edge.midnodes.length > 0 && (edge.midnodes.first().y + 7 !== edge.start.y + edge.start.h/2))\n";
        view.onDataUpdate += "        .map(edge => edge.midnodes.first().y = edge.start.y + edge.start.h/2 - 7);\n";
        view.onDataUpdate += "      node.edgesOut\n";
        view.onDataUpdate += "        .filter(edge => edge.midnodes.length > 0 && (edge.midnodes.first().x + 7 !== edge.end.x + edge.end.w/2))\n";
        view.onDataUpdate += "        .map(edge => edge.midnodes.first().x = edge.end.x + edge.end.w/2 - 7);\n";
        view.onDataUpdate += "\n";
        view.onDataUpdate += "      node.edgesIn\n";
        view.onDataUpdate += "        .filter(edge => edge.midnodes.length > 0 && (edge.midnodes.first().x + 7 !== edge.end.x + edge.end.w/2))\n";
        view.onDataUpdate += "        .map(edge => edge.midnodes.first().x = edge.end.x + edge.end.w/2 - 7);\n";
        view.onDataUpdate += "      node.edgesIn\n";
        view.onDataUpdate += "        .filter(edge => edge.midnodes.length > 0 && (edge.midnodes.first().y + 7 !== edge.start.y + edge.start.h/2))\n";
        view.onDataUpdate += "        .map(edge => edge.midnodes.first().y = edge.start.y + edge.start.h/2 - 7);\n";
        view.onDataUpdate += "    }, 150);\n";
        view.onDataUpdate += "  } else {\n";
        view.onDataUpdate += "    if (data.parent.className === 'DValue') {\n";
        view.onDataUpdate += "      node.x = 50;\n";
        view.onDataUpdate += "      node.y = data.parent.parent.node.y + data.parent.parent.node.h + 150;\n";
        view.onDataUpdate += "    }\n";
        view.onDataUpdate += "  }\n";
        view.onDataUpdate += "}\n";
    

        return view;
    }

    /* SINGLETON OBJECT */

    static singleton(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Singleton', DV.singletonView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = false; view.adaptHeight = false;
            view.jsCondition = 'return data?.instanceof?.isSingleton';
            //view.oclCondition = 'context DObject inv: true';

            //view.palette = {'color-':  U.hexToPalette('#f00', '#000', '#fff'), 'background-': U.hexToPalette('#fff', '#eee', '#f00')};

            //view.css = 'border-radius: var(--radius); \n.singleton {text-align: center; border: none; background-color: var(--accent); color: white; padding: 4px 30px; width: fit-content;}\n';
            //view.css += '.singleton::before {position: absolute; left: 10px; font-family: bootstrap-icons; content: "\\F799";}\n';

            view.css += 'border-radius: var(--radius);\n';
            view.css += '.singleton {\n';
            view.css += '    border: none!important;\n';
            view.css += '    text-align: center;\n';
            view.css += '    background-color: var(--accent);\n';
            view.css += '    color: white;\n';
            view.css += '    padding: 4px 30px;\n';
            view.css += '    width: fit-content;\n';
            view.css += '    & .header {\n';
            view.css += '        white-space: pre;\n';
            view.css += '    }\n';
            view.css += '}\n';
            view.css += '.singleton::before {position: absolute; left: 10px; font-family: bootstrap-icons; content: "\\F799";}\n';

            view.defaultVSize = defaultVertexSize;
            view.appliableTo = 'Vertex';
            view.adaptWidth = true; view.adaptHeight = true;
            view.usageDeclarations = '(ret) => {\n' +
                '// ** preparations and default behaviour here ** //\n' +
                'ret.data = data\n' +
                'ret.node = node\n' +
                'ret.view = view\n' +
                '// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the Observed Properties has changed !
                '// ** declarations here ** //\n' +
                'ret.metaclassName = data.instanceof?.name || \'Object\'\n' +
                'ret.isSingleton = data.instanceof?.isSingleton || false\n' +
                udLevel + udSnap +
                '}';
        }, false, Defaults.Pointer_ViewSingleton);
        // view.onDataUpdate = "if (grid) {\n   node.x = node.x - (node.x % 15);\n   node.y = node.y - (node.y % 15);\n}";

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
                '// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n' +
                '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
                // ¡ The element will update only if one of the Observed Properties has changed !
                '// ** declarations here ** //\n' +
                'ret.instanceofname = data.instanceof?.name\n' +
                'ret.valuesString = data.valuesString()\n' +
                'ret.typeString = data.typeString\n' +
                '}';
        }, false, Defaults.Pointer_ViewValue);
        return view;
    }
    static edgepoint(vp: DViewElement): DViewElement{
        let css = `.edgePoint{
    border: 2px solid var(--border-1);
    background: var(--background-1);
    color: var(--color-1);
    width: 15px;
    height: 15px;
    border-radius: 100%;

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
            "// data, node, view are dependencies by default. delete the line(s) above if you want to remove them.\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n\n" +
            // ¡ The element will update only if one of the Observed Properties has changed !
            "// ** declarations here ** //\n" +
            "ret.edgestart = node.edge.start?.size+''\n" +
            "ret.edgeend = node.edge.end?.size+''\n" +
            udSnap +
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
        }, false, Defaults.Pointer_ViewEdgePoint);
        view.adaptWidth = true; view.adaptHeight = true;

        view.onDataUpdate = "if (snap) {\n";
        view.onDataUpdate += "  const x = node.x, y = node.y;\n";
        view.onDataUpdate += "  if (x !== 0 || y !== 0) {\n";
        view.onDataUpdate += "    const zx = (node.zoom && node.zoom.x) || 1;\n";
        view.onDataUpdate += "    const zy = (node.zoom && node.zoom.y) || 1;\n";
        view.onDataUpdate += "    const w2 = node.w * 0.5;\n";
        view.onDataUpdate += "    const h2 = node.h * 0.5;\n";
        view.onDataUpdate += "    const gx = 30 * zx;\n"; // half size of the grif
        view.onDataUpdate += "    const gy = 30 * zy;\n";
        view.onDataUpdate += "    const cx = x + w2;\n";
        view.onDataUpdate += "    const cy = y + h2;\n";
        view.onDataUpdate += "    const nx = Math.round(cx / gx) * gx - w2;\n";
        view.onDataUpdate += "    const ny = Math.round(cy / gy) * gy - h2;\n";
        view.onDataUpdate += "    if (nx !== x) node.x = nx;\n";
        view.onDataUpdate += "    if (ny !== y) node.y = ny;\n";
        view.onDataUpdate += "  }\n";
        view.onDataUpdate += "}\n";


        return view;
    }

    static anchor(vp: DViewElement): DViewElement {
        let ret = DViewElement.new2('Anchors', DV.anchorJSX(), vp, (v) => {
            v.isExclusiveView = false;
            v.palette={'anchor-': U.hexToPalette('#9CC4CA', '#CA948E', '#7E7EB8'),
                'anchor-hover-': U.hexToPalette('#0A7E8B', '#891307', '#070')};
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
    outline: 0px solid var(--anchor-3);
    transform: translate(-50%, -50%);
    pointer-events: all;
    cursor: crosshair;
    border-radius: 100%;

    &:hover{
        background-color: var(--anchor-hover-1);
        outline: 0px solid var(--anchor-hover-3);
    }
    &.active-anchor{
        background-color: var(--anchor-2);
        &:hover{
            background-color: var(--anchor-hover-2);
        }
    }
    &>div{ pointer-events: none; }
}
`
        }, false, Defaults.Pointer_ViewAnchors );
        return ret;
    }
}

export default DefaultViews;
