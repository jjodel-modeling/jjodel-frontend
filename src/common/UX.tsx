import ReactJson from 'react-json-view' // npm i react-json-view
import React, {ReactElement, ReactNode} from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { GraphElementOwnProps, GObject, Dictionary, DocString, Pointer } from "../joiner";
import type { InputOwnProps } from '../components/forEndUser/Input';
import type { SelectOwnProps } from '../components/forEndUser/Select';
import type { TextAreaOwnProps } from '../components/forEndUser/TextArea';
import {
    LPointerTargetable, U, Log, GraphElementComponent,
    windoww, RuntimeAccessible, EdgeComponent, RuntimeAccessibleClass, EdgeOwnProps, DGraphElement, DModelElement
} from "../joiner";

// U-functions that require jsx
@RuntimeAccessible
export class UX{
    static cname: string = "UX";

    static recursiveMap<T extends ReactNode | ReactNode[] | null | undefined>(children: T, fn: (rn: T, i: number, depthIndices: number[])=>T, depthIndices: number[] = []): T {
        // NB: depthIndices is correct but if there is an expression children evaluated to false like {false && <jsx>},
        // it counts as children iterated regardless. so html indices might be apparently off, but like this is even safer as indices won't change when conditions are changed.
        const innermap = (child: ReactNode, i1: number, depthIndices: number[]): T => {
            if (!React.isValidElement(child)) { return child as T; }
            if (child.props.children) {
                // let deeperDepthIndices = [...depthIndices, i1];  // depthIndices; //
                // should probably change deeperDepthIndices in [...deeperDepthIndices, i] in next uncommented line.
                // Giordano: add ignore for webpack
                //@ts-ignore
                child = React.cloneElement(child, { children: UX.recursiveMap(child.props.children,
                        (e: T, i2: number, ii) => fn(e, i2, ii), depthIndices) });
            }
            return fn(child as T, i1, depthIndices);
        };
        if (!Array.isArray(children)) return innermap(children as ReactNode, 0, [...depthIndices, 0]) as T;
        return React.Children.map(children, (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as T;
    }
    static injectProp(parentComponent: GraphElementComponent, e: ReactNode, gvidmap_useless: Dictionary<DocString<'VertexID'>, boolean>,
                      parentnodeid: string, index: number, indices: number[]): ReactNode {
        const re: ReactElement | null = UX.ReactNodeAsElement(e);
        if (!re) return e;
        // @ts-ignore this
        // const parentComponent = this;
        let type = (re.type as any).WrappedComponent?.name || re.type;
        // const windoww = window as any;
        // console.log('ux.injectingProp pre ', {type: (re.type as any).WrappedComponent?.name || re.type}, {mycomponents: windoww.mycomponents, re, props:re.props});
        // add "view" (view id) prop as default to sub-elements of any depth to inherit the view of the parent unless the user forced another view to apply
        switch (type) {
            default:
                // console.count('ux.injectingProp case default: ' + type);
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
            case windoww.Components.Input.cname+"Component":
            case windoww.Components.Select.cname+"Component":
            case windoww.Components.TextArea.cname+"Component":
                // todo: can i do a injector that if the user provides a ModelElement list raw <div>{this.children}</div> it wraps them in DefaultNode?
                const injectProps2: InputOwnProps | SelectOwnProps | TextAreaOwnProps = {} as any;
                const parentnodeid = parentComponent.props.node?.id;
                injectProps2.data = re.props.data || (typeof parentComponent.props.data === "string" ? parentComponent.props.data : parentComponent.props.data?.id);
                // !IMPORTANT! this key does not remove the responsability of adding keys to <GraphElement>s. this is assigning the key to the first returned element by component A,
                // but react needs to distinguish component A from other components, and he still doesn't have a key. in fact this is useless as this component can only have 1 child
                injectProps2.key = re.props.key || (parentnodeid + "^input_"+index);
                return React.cloneElement(re, injectProps2);
            case windoww.Components.GraphElementComponent.cname:
            // case windoww.Components.DefaultNode.name:
            case windoww.Components.DefaultNodeComponent.cname:
            // case windoww.Components.Graph.name:
            // case windoww.Components.GraphComponent.cname:
            case "Graph": case "GraphComponent":
            // case windoww.Components.Field.name:
            // case windoww.Components.FieldComponent.cname:
            // case windoww.Components.Vertex.name:
            case EdgeComponent.cname:
            case windoww.Components.VertexComponent.cname:
                const injectProps: GraphElementOwnProps = {} as any;
                injectProps.parentViewId = parentComponent.props.view.id || (parentComponent.props.view as any); // re.props.view ||  thiss.props.view
                injectProps.parentnodeid = parentComponent.props.node?.id;
                injectProps.graphid = parentComponent.props.graphid;
                // const vidmap = GraphElementRaw.graphVertexID_counter;
                // if (!vidmap[injectProps.graphid]) vidmap[injectProps.graphid] = {};
                // const gvidmap = vidmap[injectProps.graphid];
                // const validVertexIdCondition = (id: string): boolean => gvidmap_useless[id];
                // todo: come butto dei sotto-vertici dentro un vertice contenitore? o dentro un sotto-grafo? senza modificare il jsx ma solo draggando? React-portals?
                const dataid = (typeof re.props.data === "string" ? re.props.data : re.props.data?.id) || "shapeless";
                let idbasename: string;
                if (re.props.initialSize?.id) { idbasename = re.props.initialSize?.id; } else
                if (re.props.nodeid) { idbasename = (injectProps.parentnodeid) + "^" + re.props.nodeid; } else
                switch (type) {
                    default:
                        idbasename = injectProps.parentnodeid + "^" + dataid + "N";
                        break;
                    case windoww.Components.EdgePoint.cname:
                        idbasename = injectProps.parentnodeid + "^" + (dataid || re.props.startingSize?.id || indices.join(",")) + "EP";
                        break;
                    case EdgeComponent.cname: case "Edge":
                        let edgeProps:EdgeOwnProps = re.props;
                        let edgestart_id: Pointer<DGraphElement> | Pointer<DModelElement> = (edgeProps.start as any).id || edgeProps.start;
                        let edgeend_id: Pointer<DGraphElement> | Pointer<DModelElement> = (edgeProps.end as any).id || edgeProps.end;
                        idbasename = injectProps.parentnodeid + "^" + edgestart_id + "~" + edgeend_id;
                }
                // (injectProps.parentnodeid)+"^"+(dataid)+indices.join(",");//injectProps.graphid + '^' + dataid;
                // console.log("setting nodeid", {injectProps, props:re.props, re});
                // Log.exDev(!injectProps.graphid || !dataid, 'vertex is missing mandatory props.', {graphid: injectProps.graphid, dataid, props: re.props});
                Log.exDev(!injectProps.graphid, 'vertex is missing mandatory props (graphid).', {graphid: injectProps.graphid, dataid, props: re.props});
                injectProps.nodeid = idbasename; // U.increaseEndingNumber(idbasename, false, false, validVertexIdCondition);
                injectProps.htmlindex = indices[indices.length - 1]; // re.props.node ? re.props.node.htmlindex : indices[indices.length - 1];
                injectProps.key = re.props.key || injectProps.nodeid;
                // console.log("cloning jsx:", re, injectProps);
                Log.ex((injectProps.nodeid === injectProps.graphid||injectProps.nodeid === injectProps.parentnodeid) && type != "GraphComponent", "User manually assigned a invalid node id. please remove or change prop \"nodeid\"", {type: (re.type as any).WrappedComponent?.cname || re.type}, {mycomponents: windoww.mycomponents, re, props:re.props});
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
