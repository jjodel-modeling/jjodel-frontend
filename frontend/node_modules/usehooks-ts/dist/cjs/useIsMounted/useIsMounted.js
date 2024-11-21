"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useIsMounted() {
    var isMounted = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        isMounted.current = true;
        return function () {
            isMounted.current = false;
        };
    }, []);
    return (0, react_1.useCallback)(function () { return isMounted.current; }, []);
}
exports.default = useIsMounted;
