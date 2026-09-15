What is required to make a component usable in a jsx view at runtime.
1) component definition as usual
2a optional) if it's a component which needs injected props (node, data, graph) you must first create a wrapper function
     export function CompName(props, child){ return <Compo {...props}>{props.children||child}</Comp>; } only export and use the wrapper, never the original. give cname on both (point 3)
2b optional) to complete props injection, go to UX.injectProp and add both the cnames to the switch, (the wrapper cname is optional but a failsafe, the original is mandatory).
because the JSX runtime parser will compile the component execution as a function call, and the injection part will see the rendered result instead of the component definition. so it needs a wrapper.
3) give it a cname (Pippo.cname = "Pippo") required for runtime identification, if it's a class make a static field, if a function set it with ts-ignore as if it is an object.
4) add an export of that component (or wrapper) in joiner/components.tsx
