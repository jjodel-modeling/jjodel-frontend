import {ReactElement, ReactNode} from "react";

// paste the sources in src/common/libraries or /public/libname/
// avoid npm install when possible. because some libraries might get excluded from build
// if they are not used in source code.
// but even if they are not used in source code could be used by users in their views.


// used in App.tsx

export function ExternalLibraries(): any {
    return [
        // @ts-ignore  // .js is not included in source files?
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />,
        <script src="https://unpkg.com/boxicons@2.1.4/dist/boxicons.js"></script>,
        // <link href='https://unpkg.com/boxicons@2.1.4/dist/boxicons.js' rel='stylesheet' > in docs was like this??
    ];
}
