import { ReactNode } from "react";
import { Options } from "../options";
export declare function filter<C extends ReactNode>(children: C | C[], fn: (element: ReactNode) => boolean, options?: Options): ReactNode[];
