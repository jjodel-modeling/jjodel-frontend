import { ReactNode } from "react";
import { Options } from "../options";
export declare function find(children: ReactNode | ReactNode[], fn: (element: ReactNode, idx: number) => boolean, options?: Options): ReactNode | undefined;
