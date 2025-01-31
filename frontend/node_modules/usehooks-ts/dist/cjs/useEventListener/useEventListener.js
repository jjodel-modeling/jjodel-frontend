"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useEventListener(eventName, handler, element, options) {
    var savedHandler = (0, react_1.useRef)(handler);
    (0, __1.useIsomorphicLayoutEffect)(function () {
        savedHandler.current = handler;
    }, [handler]);
    (0, react_1.useEffect)(function () {
        var _a;
        var targetElement = (_a = element === null || element === void 0 ? void 0 : element.current) !== null && _a !== void 0 ? _a : window;
        if (!(targetElement && targetElement.addEventListener))
            return;
        var listener = function (event) { return savedHandler.current(event); };
        targetElement.addEventListener(eventName, listener, options);
        return function () {
            targetElement.removeEventListener(eventName, listener, options);
        };
    }, [eventName, element, options]);
}
exports.default = useEventListener;
