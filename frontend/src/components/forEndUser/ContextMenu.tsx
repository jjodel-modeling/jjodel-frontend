import {UX} from "../../common/UX";
import React, {ReactElement, ReactNode} from "react";
import {LGraph} from "../../model/dataStructure";

const separator = '▒'
function ContextMenu(props){
    let ret = props.children;// empty jsx, an array should still be a valid jsx.
    let fullpath = props.path + '▒' + props.label;
    let injectProps = {path: fullpath};

    let injectedChildren = UX.recursiveMap(ret,
        (rn: ReactNode, index: number, depthIndexes: number[]) => {
            let re: ReactElement | null = UX.ReactNodeAsElement(e);
            let injectOffset: undefined | LGraph = ((this.props as any).isGraph && !depthIndexes[0] && !index) && (this.props.node as LGraph);
            //injectOffset&&console.log("inject offset props0:", {injectOffset});
            //console.log("inject offset props00:", {injectOffset, ig:(this.props as any).isGraph, props:this.props, depthIndexes, index});
            return React.cloneElement(re, injectProps);
        })
    return null;
}