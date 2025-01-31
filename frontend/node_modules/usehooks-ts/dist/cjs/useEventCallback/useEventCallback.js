"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useEventCallback(fn) {
    var ref = (0, react_1.useRef)(function () {
        throw new Error('Cannot call an event handler while rendering.');
    });
    (0, __1.useIsomorphicLayoutEffect)(function () {
        ref.current = fn;
    }, [fn]);
    return (0, react_1.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return ref.current.apply(ref, args);
    }, [ref]);
}
exports.default = useEventCallback;
