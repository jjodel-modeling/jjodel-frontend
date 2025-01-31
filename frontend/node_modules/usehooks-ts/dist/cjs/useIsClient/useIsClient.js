"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useIsClient() {
    var _a = (0, react_1.useState)(false), isClient = _a[0], setClient = _a[1];
    (0, react_1.useEffect)(function () {
        setClient(true);
    }, []);
    return isClient;
}
exports.default = useIsClient;
