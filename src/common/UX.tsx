import ReactJson from 'react-json-view' // npm i react-json-view
import {JsType, RuntimeAccessible} from "../joiner";
import React, {ReactNode} from "react";
// U-functions that require jsx

@RuntimeAccessible
export class UX{
    static recursiveMap<T extends ReactNode | ReactNode[] | null | undefined>(children: T, fn: (rn: T)=>T): T {
        const innermap = (child: ReactNode): T => {
            if (!React.isValidElement(child)) { return child as T; }

            if (child.props.children) {
                child = React.cloneElement(child, { children: UX.recursiveMap(child.props.children, fn) });
            }
            return fn(child as T);
        };
        if (!Array.isArray(children)) return innermap(children as ReactNode) as T;
        return React.Children.map(children, innermap) as T;
    }
}
