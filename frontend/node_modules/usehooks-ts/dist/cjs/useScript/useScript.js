"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var cachedScriptStatuses = {};
function getScriptNode(src) {
    var node = document.querySelector("script[src=\"".concat(src, "\"]"));
    var status = node === null || node === void 0 ? void 0 : node.getAttribute('data-status');
    return {
        node: node,
        status: status,
    };
}
function useScript(src, options) {
    var _a = (0, react_1.useState)(function () {
        var _a;
        if (!src || (options === null || options === void 0 ? void 0 : options.shouldPreventLoad)) {
            return 'idle';
        }
        if (typeof window === 'undefined') {
            return 'loading';
        }
        return (_a = cachedScriptStatuses[src]) !== null && _a !== void 0 ? _a : 'loading';
    }), status = _a[0], setStatus = _a[1];
    (0, react_1.useEffect)(function () {
        var _a, _b;
        if (!src || (options === null || options === void 0 ? void 0 : options.shouldPreventLoad)) {
            return;
        }
        var cachedScriptStatus = cachedScriptStatuses[src];
        if (cachedScriptStatus === 'ready' || cachedScriptStatus === 'error') {
            setStatus(cachedScriptStatus);
            return;
        }
        var script = getScriptNode(src);
        var scriptNode = script.node;
        if (!scriptNode) {
            scriptNode = document.createElement('script');
            scriptNode.src = src;
            scriptNode.async = true;
            scriptNode.setAttribute('data-status', 'loading');
            document.body.appendChild(scriptNode);
            var setAttributeFromEvent = function (event) {
                var scriptStatus = event.type === 'load' ? 'ready' : 'error';
                scriptNode === null || scriptNode === void 0 ? void 0 : scriptNode.setAttribute('data-status', scriptStatus);
            };
            scriptNode.addEventListener('load', setAttributeFromEvent);
            scriptNode.addEventListener('error', setAttributeFromEvent);
        }
        else {
            setStatus((_b = (_a = script.status) !== null && _a !== void 0 ? _a : cachedScriptStatus) !== null && _b !== void 0 ? _b : 'loading');
        }
        var setStateFromEvent = function (event) {
            var newStatus = event.type === 'load' ? 'ready' : 'error';
            setStatus(newStatus);
            cachedScriptStatuses[src] = newStatus;
        };
        scriptNode.addEventListener('load', setStateFromEvent);
        scriptNode.addEventListener('error', setStateFromEvent);
        return function () {
            if (scriptNode) {
                scriptNode.removeEventListener('load', setStateFromEvent);
                scriptNode.removeEventListener('error', setStateFromEvent);
            }
            if (scriptNode && (options === null || options === void 0 ? void 0 : options.removeOnUnmount)) {
                scriptNode.remove();
            }
        };
    }, [src, options === null || options === void 0 ? void 0 : options.shouldPreventLoad, options === null || options === void 0 ? void 0 : options.removeOnUnmount]);
    return status;
}
exports.default = useScript;
