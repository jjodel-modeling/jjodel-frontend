import {
    DGraphElement, Dictionary,
    DModelElement,
    DViewElement,
    DViewPoint,
    DVoidEdge,
    EdgeBendingMode,
    EdgeHead,
    GObject,
    GraphPoint, LPointerTargetable, LViewElement,
    Pointer,
    RuntimeAccessible,
    ShortAttribETypes as SAType,
    U, Draggable, Measurable
} from '../joiner';
import React, {ReactNode} from "react";
import {PaletteType} from "../view/viewElement/view";
import "./error.scss";



// const beautify = require('js-beautify').html; // BEWARE: this adds some newline that might be breaking and introduce syntax errors in our JSX parser
const beautify = (s: string) => s;
let ShortAttribETypes: typeof SAType = (window as any).ShortAttribETypes;



@RuntimeAccessible('DV')
export class DV {
    public static invisibleJsx(): string { return ''; }
    public static modelView(): string { return beautify(DefaultView.model()); }
    public static packageView(): string { return beautify(DefaultView.package()); }
    public static classView(): string { return beautify(DefaultView.class()); }
    public static attributeView(): string { return beautify(DefaultView.feature()); }
    public static referenceView(): string { return beautify(DefaultView.feature()); }
    public static enumeratorView(): string { return beautify(DefaultView.enum()); }
    public static literalView(): string { return beautify(DefaultView.literal()); }
    public static fallbackView(): string { return beautify(DefaultView.void()); }
    public static operationView(): string { return beautify(DefaultView.operation()); }
    public static parameterView(): string { return beautify(DefaultView.parameter()); }

    // i want to keep it because it will be useful for a candidate next feature in m1 & layoutable elements
    // it is still work in progress.
    public static operationViewm1(): string { return beautify(DefaultView.operationm1()); }
    public static objectView(): string { return beautify(DefaultView.object()); }
    public static valueView(): string { return beautify(DefaultView.value()); }
    public static defaultPackage(): string { return beautify(DefaultView.defaultPackage()); }

    public static errorView(publicmsg: ReactNode, debughiddenmsg:any, errortype: string, data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: LViewElement|DViewElement): React.ReactNode {
        let visibleMessage = publicmsg && typeof publicmsg === "string" ? U.replaceAll(publicmsg, "Parse Error:", "").trim() : publicmsg;
        console.error("error in view:", {publicmsg, debuginfo:debughiddenmsg});
        return DefaultView.error(visibleMessage, errortype, data, node, v); }
    public static errorView_string(publicmsg: string, debughiddenmsg:any, errortype: string, data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: LViewElement|DViewElement): React.ReactNode {
        let visibleMessage = publicmsg && typeof publicmsg === "string" ? U.replaceAll(publicmsg, "Parse Error:", "").trim() : publicmsg;
        console.error("error in view:", {publicmsg, debuginfo:debughiddenmsg});
        return DefaultView.error_string(visibleMessage, errortype, data, node, v); }

    // {ancors.map( a => <EdgePoint view={"aaaaa"} initialSize={{x: node.w * a.x, y: node.h * a.y}}/>)}
    public static anchorJSX(): string { return (`
<div className={"overlap"}>
{Object.keys(anchors).map( (k) => { let a = anchors[k]; return(
<div className={"anchor draggable resizable"} data-anchorName={a.name} data-anchorKey={k}
    onDragEnd={(coords/*Point*/)=>node.events.dragAnchor(coords, k)} onMouseUp={()=>{node.events.assignAnchor(k)}}
    style={{left: 100*a.x+'%', top:100*a.y+'%', width:a.w+'px', height:a.h+'px'}} />)})
}</div>
`);}
    static edgePointView(): string { return beautify((
`<div className={"edgePoint"} tabIndex="-1">
    {decorators}
</div>`
))}
    static edgePointViewSVG(): string { return beautify(
        `<ellipse stroke={"black"} fill={"red"} cx={"50"} cy={"50"} rx={"20"} ry={"20"} />`
        //`<ellipse stroke={"black"} fill={"red"} cx={props.node.x} cy={props.node.y} rx={props.node.w} ry={props.node.h} />`
    )}

    static svgHeadTail(head: "head" | "tail", type: EdgeHead): string | undefined {
        let ret: string;
        let headstr = head==="head" ? "segments.head" : "segments.tail";
        let styleTranslateRotate = 'transform:"translate(" + ' + headstr + '.x + "px, " + ' + headstr + '.y + "px) rotate(" + (' + headstr + '.rad) + "rad)",' +
            ' "transformOrigin":'+headstr+'.w/2+"px "+ '+headstr+'.h/2+"px"';
        let attrs = `\n\t\t\t\tstyle={{`+styleTranslateRotate +`}}\n\t\t\t\tclassName={"` + head + ` ` + type +` preview"} />\n`;
        let path: string;
        let hoverAttrs = `\n\t\t\t\tstyle={{`+styleTranslateRotate +`}}\n\t\t\t\tclassName={"` + head + ` ` + type +` clickable content"} tabIndex="-1" />\n`;
        let d: string;
        switch (type) {
            default:
                ret = "edge '" + head + "' with type: '" +type + "' not found";
                break;
            case EdgeHead.extend:
                //if (head === "tail") return undefined;
                d = `M 0 0   L x y/2   L 0 y   Z`;
                path = `<path  `;
                ret = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.reference:
                //if (head === "tail") return undefined;
                d = `M 0 0   L x y/2   L 0 y`;
                path = `<path  `;
                ret = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.aggregation:
                //if (head === "head") return undefined;
                d = `M 0 y/2   L x/2 0   L x y/2   L x/2 y   Z`;
                path = `<path  `;
                ret = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.composition:
                //if (head === "head") return undefined;
                d = `M 0 y/2   L x/2 0   L x y/2   L x/2 y   Z`;
                path = `<path  `;
                ret = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
                /* `<svg width="20" height="20" viewBox="0 0 20 20" style={overflow: "visible"}>
                                            <path d={"M 10 0 L 0 20 L 20 20 Z"} fill="#ffffff" stroke="#808080" strokeWidth="1"></path>
                                         </svg>`;*/
                //  style={transform: "rotate3d(xcenter, ycenter, zcenter??, 90deg)"}
        }
        //  transform={"rotate("+`+headstr+`.rad+"rad "+ segments.all[0].start.pt.toString(false, " ")}
        return ret; // no wrap because of .hoverable > .preview  on root & subelements must be consecutive
        // return `<g className="edge`+head + ` ` + type +`" style={` + styleTranslate + `}>\n`+ ret +`</g>`
    }

    // about label rotation in .edge > foreignObect > div (label)
    // first transform is h-center. second is rotate, third adds [0, 50%] of 50% vertical offset AFTER rotation to take label out of edge. fourth is to add a margin.
    static edgeView(modename: EdgeHead, headSize: GraphPoint, tailSize: GraphPoint, dashing: string | undefined, vp: DViewElement, name: string): DViewElement {
        let fill: string;
        switch (modename){
            case EdgeHead.reference:
            default: fill = '#fff0'; break;
            case EdgeHead.composition: fill = '#000'; break;
            case EdgeHead.aggregation:
            case EdgeHead.extend: fill = '#fff'; break;
        }

        const agglabel = "◇ Aggregation / Composition";
        const extendlabel = "△ "+EdgeHead.extend;
        const asslabel = "Λ "+EdgeHead.reference;
        let headdict: Dictionary<string, string> = {
            [asslabel]: 'M 0 0   L x y/2   L 0 y',
            [extendlabel]: 'M 0 0   L x y/2   L 0 y   Z',
            [agglabel]: 'M 0 y/2   L x/2 0   L x y/2   L x/2 y   Z',
        };
        let predefinedPaths: {k:string, v:string}[] = Object.entries(headdict).map((e)=>({k:e[0], v:e[1]}));

        let headPath: string = '', tailPath: string = '';
        switch (modename) {
            default: break;
            case EdgeHead.extend: headPath = extendlabel; break;
            case EdgeHead.reference: headPath = asslabel; break;
            case EdgeHead.aggregation: tailPath = agglabel; break;
            case EdgeHead.composition: tailPath = agglabel; break;
        }
        headPath = headdict[headPath] || '';
        tailPath = headdict[tailPath] || '';

        let palette: PaletteType = {
            'anchorSize': {type: 'number', value:20, unit:'px'},
            'dashing': {value:dashing || '', type: "text"},
            'stroke-color': U.hexToPalette('#777'),
            'stroke-width': {value:1, type: 'number', unit: 'px'},
            'stroke-color-hover': U.hexToPalette('#000'),
            'stroke-width-hover': {value:3, type: 'number', unit: 'px'},
            'head': {type:'path', value:headPath, options: predefinedPaths, x:'edgeHeadSize.x', y:'edgeHeadSize.y'},
            'tail': {type:'path', value:tailPath, options: predefinedPaths, x:'edgeTailSize.x', y:'edgeTailSize.y'},
            'fill': U.hexToPalette(fill),
        };

        let css = ".edge-anchor{" +
        "\n\tcursor: crosshair;" +
        "\n\tstroke: transparent;" +
        "\n\tfill: none;" +
        "\n\tr:var(--anchorSize);" +
        "\n\toutline: var(--stroke-width) solid var(--stroke-color);"+
        "\n\toutline-offset: calc(var(--stroke-width) * -1);" +
        "\n\tborder-radius: 100%;" +
        "\n}" +
        "\n.clickthrough, .unclickable{" +
        "\n\tpointer-events: none;" +
        "\n}" +
        "\n.clickable{" +
        "\n\tpointer-events: all;" +
        "\n}" +
        "\n.fullscreen{" +
        "\n\toverflow: visible;" +
        "\n\twidth: 100vw;" +
        "\n\theight: 100vh;" +
        "\n}" +
        "\npath{" +
        "\n\tfill: none;" +
        "\n\tstroke-dasharray: var(--dashing);" +
        "\n\t&.head{" +
        "\n\t\td: path(var(--head));" +
        "\n\t}" +
        "\n\t&.tail{" +
        "\n\t\td: path(var(--tail));" +
        "\n\t}" +
        "\n}" +
        "\npath.edge.full, path.tail, path.head{" +
        "\n\tstroke: var(--stroke-color);" +
        "\n\tstroke-width: var(--stroke-width);" +
        "\n}" +
        "\npath.tail, path.head{" +
        "\n\tfill:var(--fill);" +
        "\n}" +
        "\npath.edge.full.hover-activator{" +
        "\n\tstroke-width: var(--stroke-width-hover);" +
        "\n\tstroke: none;" +
        "\n}" +
        "\npath.content{" +
        "\n\tstroke: var(--stroke-color-hover);" +
        "\n\tstroke-width: var(--stroke-width-hover);" +
        "\n}" +
        "\n.label-text{" +
        "\n\tcolor: var(--stroke-color);" +
        "\n}" +
        "\nforeignObject.label{" +
        "\n\toverflow: visible;" +
        "\n\tcolor: var(--stroke-color);" +
        "\n\twidth: 0;" +
        "\n\theight: 0;" +
        "\n\twhite-space: pre;" +
        "\n\t> div{" +
        "\n\t\twidth: fit-content;" +
        "\n\t}" +
        "\n}" +
        "\n\t" +
        "\n\t" +
        "";
        let head = DV.svgHeadTail("head", modename) || '';
        let tail = DV.svgHeadTail("tail", modename) || '';
        let jsx = beautify(
        `<div className={"edge hoverable hide-ep clickthrough fullscreen ` + modename + `"}>
            <svg className={"clickthrough fullscreen"}>
                { /* edge full paths
               
                 first is preview path, normally seen
                 third (segmented) is path onHover
                 second is to enlarge the hover area of path.preview to the same as path.content, so i avoid hover loop enter-leave and graphical flashing
                
                */ }
                <path className={"preview edge full` + (dashing ? ' dashed' : '') + `"} d={this.edge.d} />
                <path className={"preview edge full hover-activator"} d={this.edge.d} />
                { /* edge separate segments */ }
                {segments && segments.all && segments.all.flatMap(s => [
                    <path tabIndex="-1" className={"clickable content segment"} d={s.dpart}></path>,
                    s.label && <foreignObject className="label" x={(s.start.pt.x + s.end.pt.x)/2+"px"} y={(s.start.pt.y + s.end.pt.y)/2+"px"}>
                    <div className={"label-text"}
                     style={{transform: "translate(-50%, 0%) rotate("+s.radLabels+"rad) translate(0%, -"+(1-0.5*Math.abs(Math.abs(s.radLabels)%Math.PI)/(Math.PI/2))*100+"%)"+
                     " translate(0%, -5px"}}>{s.label}</div>
                    </foreignObject>
                ])}
                { /* edge head */ }
                ` + head + `
                { /* edge tail */ }
                ` + tail + `
                { /* edge anchor start */ }
                {edge.start && <circle className="edge-anchor content clickable no-drag"
                 style={{transform: "translate(" + segments.all[0].start.pt.x +"px, " + segments.all[0].start.pt.y +"px)"}}
                 onMouseDown={()=> edge.startFollow=true}
                 onMouseUp={()=> edge.startfollow=false} />}
                { /* edge anchor end */ }
                {edge.end && <circle className="edge-anchor content clickable no-drag" `+ // cx={0*segments.all.last().end.pt.x} cy={0*segments.all.last().end.pt.y}
                `style={{transform: "translate(" + segments.all.last().end.pt.x +"px, " + segments.all.last().end.pt.y +"px)"}}
                 onMouseDown={()=> edge.endFollow=true}
                 onMouseUp={()=> edge.endfollow=false} />}

            </svg>
            { /* interactively added edgepoints */ }
            {
                edge.midPoints.map( m => <EdgePoint data={edge.father.model.id} initialSize={m} key={m.id} view={"EdgePoint"} /> )
            }
            {decorators}
        </div>`
    );
        let edgePrerenderFunc: string = "(ret)=>{\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "\n"+
            "}";

        let edgeUsageDeclarations = "(ret)=>{\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// ret.data = data\n" +
            "ret.edgeview = edge.view.id\n" +
            "ret.view = view\n" +
            "// data, edge, view are dependencies by default. delete them above if you want to remove them.\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "ret.start = edge.start\n"+
            "ret.end = edge.end\n"+
            "ret.segments = edge.segments\n"+
            "}";
        let ev = DViewElement.new2("Edge"+name, jsx, vp,
            (v: DViewElement) => {
                // v.appliableToClasses = [DVoidEdge.cname];
                v.appliableTo = 'Edge';
                v.bendingMode = EdgeBendingMode.Line;
                v.edgeHeadSize = headSize;
                v.edgeTailSize = tailSize;
                //v.constants = edgeConstants;
                v.palette = palette;
                v.css = css
                v.usageDeclarations = edgeUsageDeclarations;
                v.preRenderFunc = edgePrerenderFunc;
            }, false, 'Pointer_ViewEdge' + name);
        return ev;
    }
    /*
    {
        false && edge.end.model.attributes.map( (m, index, arr) => <EdgePoint data={m.id} initialSize={(parent) => {
            let segs = parent.segments.segments;
            let pos = segs[0].start.pt.multiply(1-(index+1)/(arr.length+1), true).add(segs[segs.length-1].end.pt.multiply((index+1)/(arr.length+1), true));
            // console.trace("initial ep", {segs, pos, ratio:(index+1)/(arr.length+1), s:segs[0].start.pt, e:segs[segs.length-1].end.pt});
            return {...pos, w:55, h:55}}} key={m.id} view={"Pointer_ViewEdgePoint"} /> )
    }{
        false && <EdgePoint key={"midnode1"} view={"Pointer_ViewEdgePoint"} />
    }{
        false && <EdgePoint key={"midnode2"} view={"Pointer_ViewEdgePoint"} />
    }{
        false && props.children && "this would cause loop no idea why, needs to be fixed to allow passing EdgeNodes here" || []
    }
    */
    static semanticErrorOverlay_old() { return (
`<section className="overlap">
    <div className="error-message">Lowerbound violation</div>
</section>`
)}    static semanticErrorOverlay() { return (
`<section className="overlap">
    <div className="error-message">{errors.join(<br/>)}</div>
</section>`
)}


} // DV class end

let valuecolormap: GObject = {};
valuecolormap[ShortAttribETypes.EBoolean] = "orange";
valuecolormap[ShortAttribETypes.EByte] = "orange";
valuecolormap[ShortAttribETypes.EShort] = "orange";
valuecolormap[ShortAttribETypes.EInt] = "orange";
valuecolormap[ShortAttribETypes.ELong] = "orange";
valuecolormap[ShortAttribETypes.EFloat] = "orange";
valuecolormap[ShortAttribETypes.EDouble] = "orange";
valuecolormap[ShortAttribETypes.EDate] = "green";
valuecolormap[ShortAttribETypes.EString] = "green";
valuecolormap[ShortAttribETypes.EChar] = "green";
valuecolormap[ShortAttribETypes.EVoid] = "gray";

let valuecolormap_str = JSON.stringify(valuecolormap); // can this be declared inside view.constants ?


type ErrorProps = {
    dname: any,
    nodename: any,
    errortype: any,
    on: any,
    v: any,
    msg: any
};





export class DefaultView {

    /* MODEL */

    public static model(): string { return (
`<View className={'root model'}>
<Scrollable graph={node}>
    {!data && "Model data missing."}
    <div className={'edges'}>
        {[
            refEdges.map(se => <Edge data={se.start} start={se.startNode.father} end={se.endNode} anchorStart={0} anchorEnd={0} key={se.id} isReference={true} 
             view={'Edge' + (se.start.composition ? 'Composition' : (se.start.aggregation ? 'Aggregation' : 'Association'))} />),
            extendEdges.map(se => <Edge data={se.start} start={se.startNode} end={se.endNode} view={'EdgeInheritance'} isExtend={true} key={se.id} />)
        ]}
    </div>
    {otherPackages.filter(p => p).map(pkg => <DefaultNode key={pkg.id} data={pkg} />)}
    {level >= 1 && firstPackage && firstPackage.children.filter(c => c).map(classifier => <DefaultNode key={classifier.id} data={classifier} />)}
    {level >= 1 && m1Objects.filter(o => o).map(m1object => <DefaultNode key={m1object.id} data={m1object} />)}
    {decorators}
</Scrollable>
{/* here you can insert viewpoint-wide descriptions, eg <Control> .. </Control> */}

<Control title={'Abstraction'} payoff={'Zooming'}>
    <Slider name={'level'} title={'Detail level '} node={node} max={3} />
</Control>
</View>`
);}


    public static void(): string { return (
`<div className={'root void model-less round bg-white p-1'}>
    <div>voidvertex element test</div>
    <div>data: {props.data ? props.data.name : "empty"}</div>
    {decorators}
</div>`
);}

    /* PACKAGE */

    public static package(): string { return (
`<View className={'root package'}>
    <Measurable draggable={true} resizable={true}><div>draggable resizable</div></Measurable>
    <Measurable draggable={true}><div>draggable</div></Measurable>
    <div className={'package-children'}>
        {upperLevel >= 1 ? [
            <label className={"detail-level"}>
                <input onChange={(e)=>{node.state = {level:+e.target.value}}} min="0" max="3" type="range" step="1" value={level}/>
                <div>Detail level:{level}</div>
            </label>,
            data.children.map(c => <DefaultNode key={c.id} data={c} />)
        ] :
        [
            <div className={"summary"}><b>URI:</b><span className={"ms-1"}>{data.uri}</span></div>,
            <div className={"summary"}>{[
                data.classes.length ? data.classes.length + " classes" : '',
                data.enumerators.length ? data.enumerators.length + " enumerators" : ''
               ].filter(v=>!!v).join(',')}</div>
        ]}
    </div>
    {decorators}
</View>`
);}

    public static defaultPackage(): string { return (
`<div className={'root package'}>
    <div className={'package-children'}>
        {data.children.map(c => <DefaultNode key={c.id} data={c} />)}
    </div>
    {decorators}
</div>`
);}

    /* CLASS */

// <View className={"root class " + (level === 1 && abstract ? "abstract")} + onClick={()=>{/*node.events.e1(Math.random().toFixed(3))*/}}>

public static class(): string { return (`<View className={"root class"} onClick={()=>{/*node.events.e1(Math.random().toFixed(3))*/}}>
<div className={'header'}>
    {level > 1 && <b className={'class-name'}>{interface ? 'Interface' : abstract ? 'Abstract Class' : 'Class'}:</b>}
    
    {level === 1 && <i className="bi bi-c-square-fill"></i>}<Input data={data} field={'name'} hidden={true} autosize={true} />
</div>
{level > 2 && <hr/>}

{level > 2 && 
    <div className={'class-children'}>
        {level >= 2 && [
            attributes.map(c => <DefaultNode key={c.id} data={c} />),
            references.map(c => <DefaultNode key={c.id} data={c} />),
            operations.map(c => <DefaultNode key={c.id} data={c} />)
        ]
        || [
        <div className={"summary"}>{[
            attributes.length ? attributes.length + " attributes" : '',
            references.length ? references.length + " references" : '',
            operations.length ? operations.length + " operations" : '',
            !(attributes.length + references.length + operations.length) ? '- empty -' : ''
            ].filter(v=>!!v).join(',')}</div>
        ]
        }
    </div>
}

{decorators}
</View>`);}

    /* ENUM */

public static enum(): string { return (
`<View className={'root enumerator'}>
    <div className={'header'}>
        {level > 1 && <b className={'enumerator-name'}>Enum:</b>}
        {level == 1 && <i className="bi bi-explicit-fill"></i>}<Input data={data} field={'name'} hidden={true} autosize={true} />
    </div>
    {level > 1 && <hr />}
    <div className={'enumerator-children'}>
        {level >= 2 && literals.map(c => <DefaultNode key={c.id} data={c}/>)}
    </div>
    {decorators}
</View>`
);}






    public static feature(): string { return (
`<View className={'root feature w-100'}>
    <span className={'feature-name'}>{data.name}:</span>
    <Select data={data} field={'type'} />
    {decorators}
</View>`
);}

    /* LITERAL */
    public static literal(): string { return (
`<label className={'root literal d-block text-center'}>
    {data.name}
    {decorators}
</label>`
);}

    /* OPERATION */
    public static operation(): string { return (
`<View className={'root operation w-100 hoverable'}>
        <span className={'feature-name'}>{data.name + ' =>'}</span>
        <Select data={data} field={'type'} />
    <div className={"parameters content"}>
    {data.exceptions.length ? " throws " + data.exceptions.join(", ") : ''}
    {
        level >= 3 && data.parameters.map(p => <DefaultNode data={p} key={p.id} />)
    }</div>
    {decorators}
</View>`
);}

    /* PARAMETER */
public static parameter(): string { return (
`<View className={'root parameter w-100'}>
    <span className={'feature-name'}>
        {data.name + '' + (data.lowerBound === 0 ? '?:' : ':' )}
    </span>
    <Select data={data} field={'type'} />
    <span className={"modifier"}>{data.upperBound > 1 || data.upperBound === -1 ? '[]' : ''}</span>
    {decorators}
</View>`
);}

    // i want to keep it because it will be useful for a candidate next feature in m1 & layoutable elements
    // it is still work in progress.
    public static operationm1(): string { return (
`<div className={'d-flex root operationm1'} style={{paddingRight: "6px"}}>
    <label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>
    <label className={'d-block ms-auto hover-root'} style={{color:` + valuecolormap_str + `[this.props.data.values.type] || "gray"}}>
        →→→
        <div className="hover-content">
            <ParameterForm operation={this.props.data.id} vertical={true} />
        </div>
    </label>
    {decorators}
</div>`
);}

    public static objectOld(): string { return (
`<div className={'round bg-white root class'}>
    <label className={'ms-1'}>
        <Input jsxLabel={<b className={'object-name'}>{data.instanceof ? data.instanceof.name : "Object"}:</b>} 
           data={data} field={'name'} hidden={true} autosize={true}/>
    </label>
    <hr />
    <div className={'object-children'}>
        { features.map(c => <DefaultNode key={c.id} data={c} />) }
    </div>
    {decorators}
</div>`);
}

//     public static object(): string { return (
// `<View className={'root object'}>
//     <b className={'object-name'}>{data.instanceof ? data.instanceof.name : 'Object'}:</b>
//     <Input data={data} field={'name'} hidden={true} autosize={true} />
//     <hr/>
//     <div className={'object-children'}>
//         {level >= 2 && data.features.map(f => <DefaultNode key={f.id} data={f} />)}
//     </div>
//     {decorators}
// </View>`
// );}

public static object(): string { return (
`<View className={'root object'}>
    <b className={'object-name'}>{data.instanceof ? data.instanceof.name : 'Object'}:</b>
    <Input data={data} field={'name'} hidden={true} autosize={true} />
    <hr/>
    <div className={'object-children'}>
        {level >= 2 && data.features.map(f => <DefaultNode key={f.id} data={f} />)}
    </div>
    {decorators}
</View>`
);}

    /* VALUE */

    public static value() { return (
`<View className={'root value d-flex'}>
    {instanceofname && <label className={'d-block ms-1 name'}>{instanceofname}</label>}
    {!instanceofname && <Input className='name' data={data} field={'name'} hidden={true} autosize={true} />}
    <label className={'d-block m-auto values_str'} style={{color: constants[typeString] || 'gray'}}>
        : {valuesString}
    </label>
    {decorators}
</View>`
);}

    public static error(msg: undefined | ReactNode, errortype: string | "SYNTAX" | "RUNTIME",
                        data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: LViewElement|DViewElement): React.ReactNode {

        let dname: string | undefined = data && ((data as any).name || data.className.substring(1));
        if (dname && dname.length >= 10) dname = dname.substring(0, 7) + '…';
        let nodename: string = (node?.className || '').replace(/[^A-Z]+/g, "").substring(1);
        let on = dname && nodename ? " on " + dname + " / " + nodename : (dname || nodename ? " on " + (dname || nodename) : '');

        let lv: LViewElement | undefined = v ? ((v as any).__isProxy ? v as LViewElement : LPointerTargetable.wrap(v)) : undefined;
        let viewpointname = lv?.viewpoint?.name ||'';

        return (<Measurable draggable={true} resizable={true}><div className={'error-notification'}>
            <h1>Something Went Wrong...</h1>
            {v && <h2>Error in "{v?.name}" syntax view definition{viewpointname? ' in viewpoint ' + viewpointname : ''}.</h2>}
            <div className={'error-type'}>
                <b data-dname={dname} data-nodename={nodename} data-str={false}>
                    {errortype} Error {on}
                    {false && v && <div>While applying view "{v?.name}"</div>}
                </b>
            </div>
            <div className={'error-details'}>{msg}</div>
        </div></Measurable>);
    }

    public static error_string(msg: undefined | ReactNode, errortype: string | "SYNTAX" | "RUNTIME", data?: DModelElement | undefined,
                               node?: DGraphElement | undefined, v?: LViewElement|DViewElement) {
        let dname: string | undefined = data && ((data as any).name || data.className.substring(1));
        if (dname && dname.length >= 10) dname = dname.substring(0, 7) + '…';
        let nodename: string = (node?.className || '').replace(/[^A-Z]+/g, "").substring(1);
        let on = dname && nodename ? " on " + dname + " / " + nodename : (dname || nodename ? " on " + (dname || nodename) : '');

        let lv: LViewElement | undefined = v ? ((v as any).__isProxy ? v as LViewElement : LPointerTargetable.wrap(v)) : undefined;
        let viewpointname = lv?.viewpoint?.name ||'';
        // <div className={'w-100 h-100 round bg-white border border-danger'} style={{minHeight:"50px", overflow:"scroll"}}>
        //     <div className={'text-center text-danger'} tabIndex={-1} style={{background:"#fff", overflow: 'visible', zIndex:100, minWidth:"min-content"}}>
        //         <b>{errortype}_ERROR` + on + `</b>
        //         <hr/>
        //         <label className={'text-center mx-1 d-block'}>
        //             While applying view "${v?.name}"
        //         </label>
        //         {${msg} && <label className={'text-center mx-1 d-block'} style={{color:"black"}}>${msg}</label>}
        //     </div>
        // </div>
        return `<Measurable draggable={true} resizable={true}><div className={'error-notification'}>
            <h1>Something Went Wrong...</h1>
            `+ (v && `<h2>Error in "${v?.name}" syntax view definition${viewpointname ? ' in viewpoint ' + viewpointname : ''}.</h2>`)+`
            <div className={'error-type'}>
                <b data-dname=${dname} data-nodename=${nodename} data-str={true}>
                    ${errortype} Error ${on}
                    {false && v && <div>While applying view "${v?.name}"</div>}
                </b>
            </div>
            <div className={'error-details'}>${msg}</div>
        </div></Measurable>)`;
    }


}
