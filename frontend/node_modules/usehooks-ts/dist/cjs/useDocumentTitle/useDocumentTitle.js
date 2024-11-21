"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
function useDocumentTitle(title) {
    (0, __1.useIsomorphicLayoutEffect)(function () {
        window.document.title = title;
    }, [title]);
}
exports.default = useDocumentTitle;
