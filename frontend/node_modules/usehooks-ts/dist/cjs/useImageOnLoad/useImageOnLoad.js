"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useImageOnLoad() {
    var _a = (0, react_1.useState)(false), isLoaded = _a[0], setIsLoaded = _a[1];
    var handleImageOnLoad = function () {
        setIsLoaded(true);
    };
    var css = {
        thumbnail: {
            visibility: isLoaded ? 'hidden' : 'visible',
            filter: 'blur(8px)',
            transition: 'visibility 0ms ease-out 500ms',
        },
        fullSize: {
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 500ms ease-in 0ms',
        },
    };
    return { handleImageOnLoad: handleImageOnLoad, css: css };
}
exports.default = useImageOnLoad;
