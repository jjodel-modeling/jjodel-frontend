"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
function useClickAnyWhere(handler) {
    (0, __1.useEventListener)('click', function (event) {
        handler(event);
    });
}
exports.default = useClickAnyWhere;
