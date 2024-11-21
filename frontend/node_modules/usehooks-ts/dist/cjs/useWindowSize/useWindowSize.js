"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useWindowSize() {
    var _a = (0, react_1.useState)({
        width: 0,
        height: 0,
    }), windowSize = _a[0], setWindowSize = _a[1];
    var handleSize = function () {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    };
    (0, __1.useEventListener)('resize', handleSize);
    (0, __1.useIsomorphicLayoutEffect)(function () {
        handleSize();
    }, []);
    return windowSize;
}
exports.default = useWindowSize;
