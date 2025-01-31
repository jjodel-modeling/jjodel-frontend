import { ReactNode } from "react";
import { Options } from "../options";
export declare function groupBy<Key extends string>(children: ReactNode | ReactNode[], fn: (element: ReactNode, idx: number) => Key, options?: Options): Record<Key, ReactNode[] | undefined>;
