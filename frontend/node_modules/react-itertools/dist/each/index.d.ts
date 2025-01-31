import { ReactNode } from "react";
import { Options } from "../options";
export declare function each(children: ReactNode | ReactNode[], fn: (element: ReactNode, idx: number) => boolean, options?: Options): void;
