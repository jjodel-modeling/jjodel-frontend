"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useDebounce(value, delay) {
    var _a = (0, react_1.useState)(value), debouncedValue = _a[0], setDebouncedValue = _a[1];
    (0, react_1.useEffect)(function () {
        var timer = setTimeout(function () { return setDebouncedValue(value); }, delay || 500);
        return function () {
            clearTimeout(timer);
        };
    }, [value, delay]);
    return debouncedValue;
}
exports.default = useDebounce;
