import React, {ReactElement, ReactNode} from "react";
import {
    Overlap, Pointer,
    DGraphElement, LModelElement, LGraphElement, LViewElement, LGraph,
    U, UX, BasicReactOwnProps, transientProperties, Log
} from "../../joiner";

const separator = '▒';
export type CtxMenuAction = (data: LModelElement|null, node: LGraphElement, view: LViewElement)=>void;
class CtxMenuOwnProps extends BasicReactOwnProps{
    label!: string;
    action?: CtxMenuAction;
}
type CtxMenuInjectedProps = {path: string, nodeid: Pointer<DGraphElement>}
export type CtxMenuAllProps = Overlap<CtxMenuOwnProps, CtxMenuInjectedProps>;

// NB IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!!! THIS COMPONENT CANNOT BE MEMOIZED, OR IT STOPS WORKING. WHEN A NODE RENDERS IT EMPTIES TN, AND REPOPULATES HERE.
export function ContextMenu(props: CtxMenuAllProps): null | null[]{
    let ret = props.children;
    let fullpath = props.path + '▒' + (props.label || '');
    let injectProps: CtxMenuInjectedProps = {path: fullpath, nodeid: props.nodeid};

    let injectedChildren = UX.recursiveMap(ret, (rn: ReactNode, index: number, depthIndexes: number[]) => {
            let re: ReactElement | null = UX.ReactNodeAsElement(rn);
            if (!re) return null;
            //injectOffset&&console.log("inject offset props0:", {injectOffset});
            //console.log("inject offset props00:", {injectOffset, ig:(this.props as any).isGraph, props:this.props, depthIndexes, index});
            return React.cloneElement(re, injectProps);
        })
    let tn = transientProperties.node[props.nodeid];
    if (!tn) {
        Log.eDevv('ContextMenu extension component (in jsx) found empty tn.', {node_id: props.nodeid});
        return null;
    }
    if (!tn.contextMenu as boolean) tn.contextMenu = [];
    tn.contextMenu.push({...props, path: fullpath})
    return injectedChildren as any as null[]; // returns children to trigger their render(). but leaf elements will return [], so the whole subtree collapses to empty.
}