"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useElementSize() {
    var _a = (0, react_1.useState)(null), ref = _a[0], setRef = _a[1];
    var _b = (0, react_1.useState)({
        width: 0,
        height: 0,
    }), size = _b[0], setSize = _b[1];
    var handleSize = (0, react_1.useCallback)(function () {
        setSize({
            width: (ref === null || ref === void 0 ? void 0 : ref.offsetWidth) || 0,
            height: (ref === null || ref === void 0 ? void 0 : ref.offsetHeight) || 0,
        });
    }, [ref === null || ref === void 0 ? void 0 : ref.offsetHeight, ref === null || ref === void 0 ? void 0 : ref.offsetWidth]);
    (0, __1.useEventListener)('resize', handleSize);
    (0, __1.useIsomorphicLayoutEffect)(function () {
        handleSize();
    }, [ref === null || ref === void 0 ? void 0 : ref.offsetHeight, ref === null || ref === void 0 ? void 0 : ref.offsetWidth]);
    return [setRef, size];
}
exports.default = useElementSize;
