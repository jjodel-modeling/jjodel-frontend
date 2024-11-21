/**
 * Configuration options for traversal.
 */
export declare type Options = Partial<{
    /**
     * The maximum depth to descend to. If unspecified, every level of the tree will be visited.
     *
     * Zero-based numbering.
     */
    maxDepth: number;
    /**
     * The traversal startegy. Defaults to breadth first.
     *
     * @remarks
     * This option is not available for {@link map} or {@link filter}, which always use depth first.
     */
    visit: "breadthFirst" | "depthFirst";
}>;
