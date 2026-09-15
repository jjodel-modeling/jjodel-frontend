// Ambient declarations so `tsc --noEmit` resolves Vite-bundled asset imports.
// Vite resolves these at build time; tsc only needs the module shapes. The shapes
// match the import styles at the call sites: images as a default string URL, CSS
// modules as a default class-name map.
//
// NB: `vite/client` declares `*.css` as an empty module, which would break the
// `import styles from './x.module.css'` default imports used under `src/components/ui`.
// The asset modules are therefore declared explicitly here rather than via
// `/// <reference types="vite/client" />`.

declare module '*.svg' {
    const src: string;
    export default src;
}
declare module '*.png' {
    const src: string;
    export default src;
}
declare module '*.jpg' {
    const src: string;
    export default src;
}
declare module '*.webp' {
    const src: string;
    export default src;
}
declare module '*.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}
