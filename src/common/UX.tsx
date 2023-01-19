import ReactJson from 'react-json-view' // npm i react-json-view
import type {GObject, LPointerTargetable} from "../joiner";
import {JsType, RuntimeAccessible} from "../joiner";
import React, {ReactNode} from "react";
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
}
