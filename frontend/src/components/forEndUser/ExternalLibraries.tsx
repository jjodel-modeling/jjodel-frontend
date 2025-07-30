import {ReactElement, ReactNode} from "react";

// paste the sources in src/common/libraries or /public/libname/
// avoid npm install when possible. because some libraries might get excluded from build
// if they are not used in source code.
// but even if they are not used in source code could be used by users in their views.


// used in App.tsx

export function ExternalLibraries(): any {
    let i = 0;
    return [
        // moved to public index.html directly
        // @ts-ignore  // .js is not included in source files?
        // <script key={i++} src="https://unpkg.com/boxicons@2.1.4/dist/boxicons.js" />
        // <link href='https://unpkg.com/boxicons@2.1.4/dist/boxicons.js' rel='stylesheet' > in docs was like this??
    ];
}
