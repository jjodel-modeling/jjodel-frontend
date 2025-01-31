"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useMap(initialState) {
    if (initialState === void 0) { initialState = new Map(); }
    var _a = (0, react_1.useState)(new Map(initialState)), map = _a[0], setMap = _a[1];
    var actions = {
        set: (0, react_1.useCallback)(function (key, value) {
            setMap(function (prev) {
                var copy = new Map(prev);
                copy.set(key, value);
                return copy;
            });
        }, []),
        setAll: (0, react_1.useCallback)(function (entries) {
            setMap(function () { return new Map(entries); });
        }, []),
        remove: (0, react_1.useCallback)(function (key) {
            setMap(function (prev) {
                var copy = new Map(prev);
                copy.delete(key);
                return copy;
            });
        }, []),
        reset: (0, react_1.useCallback)(function () {
            setMap(function () { return new Map(); });
        }, []),
    };
    return [map, actions];
}
exports.default = useMap;
