import React, {ReactElement, ReactNode} from "react";
import {
    Overlap, Pointer,
    DGraphElement, LModelElement, LGraphElement, LViewElement, LGraph,
    U, UX, BasicReactOwnProps, transientProperties, Log, DGraph,
    DModelElement
} from "../../joiner";

const separator = '▒';
export type CtxMenuAction = (data: LModelElement|null, node: LGraphElement)=>void;
class CtxMenuOwnProps extends BasicReactOwnProps{
    label!: string; // this one must be a string because i want to nest like <CTX label="align"> <CTX label="left"/> <CTX label="right"/> </CTX> and path must be align.left, align.right
    labelJSX?: ReactNode;
    ico!: ReactNode;
    action?: CtxMenuAction;
}
type CtxMenuInjectedProps = {
    path: string,
    nodeid: Pointer<DGraphElement>,
    graphid: Pointer<DGraph>,
    dataid: Pointer<DModelElement>,
}
export type CtxMenuAllProps = Overlap<CtxMenuOwnProps, CtxMenuInjectedProps>;

// NB IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!!! THIS COMPONENT CANNOT BE MEMOIZED, OR IT STOPS WORKING. WHEN A NODE RENDERS IT EMPTIES TN, AND REPOPULATES HERE.
/*class ContextMenuC extends React.Component<any, any>{
    static cname: string = 'ContextMenu';*/
function ContextMenuC( props: CtxMenuAllProps): null | null[]{
    let ret = props.children;
    let label = props.label;
    if (!label || typeof (label as unknown) !== "string") {
        label = 'InvalidLabel';
        Log.ee("<ContextMenu label='...'/> invalid property: label must be a string", {label}, props);
    }
    let action = props.action;
    if (action && typeof action !== "function") {
        action = undefined;
        Log.ee("<ContextMenu action='...'/> invalid property: action must be a string", {action}, props);
    }
    let fullpath = props.path + separator + (label || '');
    let injectProps: CtxMenuInjectedProps = {path: fullpath, nodeid: props.nodeid, graphid: props.graphid, dataid: props.dataid};

    let injectedChildren = UX.recursiveMap(ret, (rn: ReactNode, index: number, depthIndexes: number[]) => {
            let re: ReactElement | null = UX.ReactNodeAsElement(rn);
            if (!re) return null;
            //injectOffset&&console.log("inject offset props0:", {injectOffset});
            //console.log("inject offset props00:", {injectOffset, ig:(this.props as any).isGraph, props:this.props, depthIndexes, index});
            return React.cloneElement(re, injectProps);
        })
    let tn = transientProperties.node[props.nodeid];
    if (!tn) {
        Log.eDevv('ContextMenu extension component (in jsx) found empty tn.', {nodeid: props.nodeid, props});
        return <div>"aaaa"</div> as any;//null;
    }
    if (!tn.contextMenu as boolean) tn.contextMenu = [];
    tn.contextMenu.push({...props, path: fullpath, action});
    return injectedChildren as any as null[]; // returns children to trigger their render(). but leaf elements will return [], so the whole subtree collapses to empty.
}
export function ContextMenu(props: any, children:any) {return <ContextMenuC {...props}>{children || props.children}</ContextMenuC>; }
(ContextMenuC as any).cname = 'ContextMenu';
(ContextMenu as any).cname = 'ContextMenu';
(window as any).CTXMENUDEBUG = ContextMenu;

// NB this is required because JSXLibrary.eval does generate something like Grid({node: node, mode: "points"})
// which is evaluated to the render result immediately and you see the subtree during this.render traversal and cloneElement attempts.
// GraphElement,Edge stuff are too parsed as Vertex({}) but their result is still a Vertex component descriptor instead of a result (like div) component descriptor
// This is likely because Vertex is a mirror for VertexConnected, so i see the component descriptor of the second layer (VertexConnected) and inject props to it.
// so all jsx-ready components meant for users need to do this duality class-function, or function-function (with cname),
// it gets evaluated to his rendered result instead of showing a descriptor where i can inject props
// Alternative solution: during GraphComponent.getTemplate3_ loop in context for component names, wrap them with context[compName] = (props, child, oth)=> originalComp({...injectProps, ...props}, child, ...oth);
// NB: the inner ContextMenuC is what is looped in the switch of UX.inject props, so give it a cname fitting or edit the switch
