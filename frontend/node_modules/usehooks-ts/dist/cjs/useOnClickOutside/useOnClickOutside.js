"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
function useOnClickOutside(ref, handler, mouseEvent) {
    if (mouseEvent === void 0) { mouseEvent = 'mousedown'; }
    (0, __1.useEventListener)(mouseEvent, function (event) {
        var el = ref === null || ref === void 0 ? void 0 : ref.current;
        if (!el || el.contains(event.target)) {
            return;
        }
        handler(event);
    });
}
exports.default = useOnClickOutside;
