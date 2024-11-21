"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useHover(elementRef) {
    var _a = (0, react_1.useState)(false), value = _a[0], setValue = _a[1];
    var handleMouseEnter = function () { return setValue(true); };
    var handleMouseLeave = function () { return setValue(false); };
    (0, __1.useEventListener)('mouseenter', handleMouseEnter, elementRef);
    (0, __1.useEventListener)('mouseleave', handleMouseLeave, elementRef);
    return value;
}
exports.default = useHover;
