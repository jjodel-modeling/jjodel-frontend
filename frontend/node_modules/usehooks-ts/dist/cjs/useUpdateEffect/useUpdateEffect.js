"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useUpdateEffect(effect, deps) {
    var isFirst = (0, __1.useIsFirstRender)();
    (0, react_1.useEffect)(function () {
        if (!isFirst) {
            return effect();
        }
    }, deps);
}
exports.default = useUpdateEffect;
