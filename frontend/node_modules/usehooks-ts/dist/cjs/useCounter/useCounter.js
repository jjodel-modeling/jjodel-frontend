"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useCounter(initialValue) {
    var _a = (0, react_1.useState)(initialValue || 0), count = _a[0], setCount = _a[1];
    var increment = function () { return setCount(function (x) { return x + 1; }); };
    var decrement = function () { return setCount(function (x) { return x - 1; }); };
    var reset = function () { return setCount(initialValue || 0); };
    return {
        count: count,
        increment: increment,
        decrement: decrement,
        reset: reset,
        setCount: setCount,
    };
}
exports.default = useCounter;
