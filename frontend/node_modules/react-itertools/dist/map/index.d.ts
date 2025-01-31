import { ReactNode } from "react";
import { Options } from "../options";
declare type MapReturn<T, C> = C extends null | undefined ? C : Array<Exclude<T, boolean | null | undefined>>;
/**
 * Recursively iterates through all `children` and returns the transformed result of applying `fn` to each child.
 *
 * Recurses depth first, post-order.
 *
 * @param children - the React children.
 * @param fn - the function that will be applied to every child element.
 * @param options - {@link Options}
 *
 */
export declare function map<T, C extends ReactNode>(children: C | C[], fn: (element: ReactNode) => T, options?: Omit<Options, "visit">): MapReturn<T, C>;
export {};
