"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useLockedBody(initialLocked, rootId) {
    if (initialLocked === void 0) { initialLocked = false; }
    if (rootId === void 0) { rootId = '___gatsby'; }
    var _a = (0, react_1.useState)(initialLocked), locked = _a[0], setLocked = _a[1];
    (0, __1.useIsomorphicLayoutEffect)(function () {
        if (!locked) {
            return;
        }
        var originalOverflow = document.body.style.overflow;
        var originalPaddingRight = document.body.style.paddingRight;
        document.body.style.overflow = 'hidden';
        var root = document.getElementById(rootId);
        var scrollBarWidth = root ? root.offsetWidth - root.scrollWidth : 0;
        if (scrollBarWidth) {
            document.body.style.paddingRight = "".concat(scrollBarWidth, "px");
        }
        return function () {
            document.body.style.overflow = originalOverflow;
            if (scrollBarWidth) {
                document.body.style.paddingRight = originalPaddingRight;
            }
        };
    }, [locked]);
    (0, react_1.useEffect)(function () {
        if (locked !== initialLocked) {
            setLocked(initialLocked);
        }
    }, [initialLocked]);
    return [locked, setLocked];
}
exports.default = useLockedBody;
