"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useScreen() {
    var getScreen = function () {
        if (typeof window !== 'undefined' && window.screen) {
            return window.screen;
        }
        return undefined;
    };
    var _a = (0, react_1.useState)(getScreen()), screen = _a[0], setScreen = _a[1];
    function handleSize() {
        setScreen(getScreen());
    }
    (0, __1.useEventListener)('resize', handleSize);
    (0, __1.useIsomorphicLayoutEffect)(function () {
        handleSize();
    }, []);
    return screen;
}
exports.default = useScreen;
