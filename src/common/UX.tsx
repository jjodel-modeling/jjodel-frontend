import ReactJson from 'react-json-view' // npm i react-json-view
import {GObject, Dictionary, DocString, LPointerTargetable, U, Log, GraphElementComponent} from "../joiner";
import type {GraphElementOwnProps} from "../joiner";
import {windoww, JsType, RuntimeAccessible} from "../joiner";
import React, {ReactElement, ReactNode} from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// U-functions that require jsx
@RuntimeAccessible
export class UX{
    static recursiveMap<T extends ReactNode | ReactNode[] | null | undefined>(children: T, fn: (rn: T)=>T): T {
        const innermap = (child: ReactNode): T => {
            if (!React.isValidElement(child)) { return child as T; }
            if (child.props.children) {
                // Giordano: add ignore for webpack
                //@ts-ignore
                child = React.cloneElement(child, { children: UX.recursiveMap(child.props.children, fn) });
            }
            return fn(child as T);
        };
        if (!Array.isArray(children)) return innermap(children as ReactNode) as T;
        return React.Children.map(children, innermap) as T;
    }
    static injectProp(parentComponent: GraphElementComponent, e: ReactNode, gvidmap: Dictionary<DocString<'VertexID'>, boolean>): ReactNode {
        const re: ReactElement | null = UX.ReactNodeAsElement(e);
        if (!re) return e;
        // @ts-ignore this
        // const parentComponent = this;
        let type = (re.type as any).WrappedComponent?.name || re.type;
        // const windoww = window as any;
        // console.log('relement ', {type: (re.type as any).WrappedComponent?.name || re.type}, {thiss, mycomponents: windoww.mycomponents, re, props:re.props});
        // add "view" (view id) prop as default to sub-elements of any depth to inherit the view of the parent unless the user forced another view to apply
        switch (type) {
            default:
                // console.count('injectingProp case default: ' + type);
                return re;
            /*
            case windoww.Components.Input.name:
            case windoww.Components.Textarea.name:
                const objid =  re.props.obj?.id || re.props.obj || parentComponent.props.data.id;
                const ret = React.cloneElement(re, {key: re.props.key || parentComponent.props.view.id + '_' + parentComponent.props.data.id + '_' + re.props.field, obj: objid, obj2: objid});
                //console.log('relement Input set props',
                //    {'re.props.obj.id': re.props.obj?.id, 're.props.obj': re.props.obj, 'thiss.props.data.id': thiss.props.data.id, thiss, re, objid, ret, 'ret.props': ret.props});
                return ret;*/
            // case windoww.Components.GraphElement.name:
            case windoww.Components.GraphElementComponent.name:
            // case windoww.Components.DefaultNode.name:
            case windoww.Components.DefaultNodeComponent.name:
            // case windoww.Components.Graph.name:
            case windoww.Components.GraphComponent.name:
            // case windoww.Components.Field.name:
            // case windoww.Components.FieldComponent.name:
            // case windoww.Components.Vertex.name:
            case windoww.Components.VertexComponent.name:
                const injectProps: GraphElementOwnProps = {} as any;
                injectProps.parentViewId = parentComponent.props.view.id || (parentComponent.props.view as any); // re.props.view ||  thiss.props.view
                injectProps.parentnodeid = parentComponent.props.node?.id;
                injectProps.graphid = parentComponent.props.graphid;
                // const vidmap = GraphElementRaw.graphVertexID_counter;
                // if (!vidmap[injectProps.graphid]) vidmap[injectProps.graphid] = {};
                // const gvidmap = vidmap[injectProps.graphid];
                const validVertexIdCondition = (id: string): boolean => gvidmap[id];
                // todo: come butto dei sotto-vertici dentro un vertice contenitore? o dentro un sotto-grafo? senza modificare il jsx ma solo draggando?
                const dataid = typeof re.props.data === "string" ? re.props.data : re.props.data?.id;
                const idbasename: string = injectProps.graphid + '^' + dataid;
                // console.log("setting nodeid", {injectProps, props:re.props, re});
                Log.exDev(!injectProps.graphid || !dataid, 'vertex is missing mandatory props.', {graphid: injectProps.graphid, dataid, props: re.props});
                injectProps.nodeid = U.increaseEndingNumber(idbasename, false, false, validVertexIdCondition);
                gvidmap[injectProps.nodeid] = true;
                injectProps.key = injectProps.nodeid; // re.props.key || thiss.props.view.id + '_' + thiss.props.data.id;
                // console.log("cloning jsx:", re, injectProps);
                return React.cloneElement(re, injectProps);
        }}

    static ReactNodeAsElement(e: React.ReactNode): React.ReactElement | null { return e && (e as ReactElement).type ? e as ReactElement : null; }

    public static async deleteWithAlarm(lItem: LPointerTargetable) {
        const MySwal = withReactContent(Swal);
        const confirm = await MySwal.fire({
            title: "Delete " + lItem.toString() + "?",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            showLoaderOnConfirm: true
        });
        if (confirm.value === true) {
            lItem.delete();
        }
    }
    public static async info(text: string) {
        const MySwal = withReactContent(Swal);
        const confirm = await MySwal.fire({
            title: text,
            showCancelButton: false,
            confirmButtonText: "Got It"
        });
    }
}
