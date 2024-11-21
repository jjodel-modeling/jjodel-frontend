import { ReactNode } from "react";
import { Options } from "../options";
export declare function reduce<T>(children: ReactNode | ReactNode[], fn: (accumulator: T, element: ReactNode, idx: number) => T, initialValue: T, options?: Options): T;
