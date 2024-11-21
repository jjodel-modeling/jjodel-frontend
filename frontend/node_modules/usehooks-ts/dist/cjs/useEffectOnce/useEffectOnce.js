"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useEffectOnce(effect) {
    (0, react_1.useEffect)(effect, []);
}
exports.default = useEffectOnce;
