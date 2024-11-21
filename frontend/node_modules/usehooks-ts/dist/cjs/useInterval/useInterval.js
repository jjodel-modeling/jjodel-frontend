"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useInterval(callback, delay) {
    var savedCallback = (0, react_1.useRef)(callback);
    (0, __1.useIsomorphicLayoutEffect)(function () {
        savedCallback.current = callback;
    }, [callback]);
    (0, react_1.useEffect)(function () {
        if (!delay && delay !== 0) {
            return;
        }
        var id = setInterval(function () { return savedCallback.current(); }, delay);
        return function () { return clearInterval(id); };
    }, [delay]);
}
exports.default = useInterval;
