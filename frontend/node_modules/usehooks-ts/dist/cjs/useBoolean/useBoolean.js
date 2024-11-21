"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useBoolean(defaultValue) {
    var _a = (0, react_1.useState)(!!defaultValue), value = _a[0], setValue = _a[1];
    var setTrue = (0, react_1.useCallback)(function () { return setValue(true); }, []);
    var setFalse = (0, react_1.useCallback)(function () { return setValue(false); }, []);
    var toggle = (0, react_1.useCallback)(function () { return setValue(function (x) { return !x; }); }, []);
    return { value: value, setValue: setValue, setTrue: setTrue, setFalse: setFalse, toggle: toggle };
}
exports.default = useBoolean;
