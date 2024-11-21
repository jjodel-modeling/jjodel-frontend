"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useStep(maxStep) {
    var _a = (0, react_1.useState)(1), currentStep = _a[0], setCurrentStep = _a[1];
    var canGoToNextStep = (0, react_1.useMemo)(function () { return currentStep + 1 <= maxStep; }, [currentStep, maxStep]);
    var canGoToPrevStep = (0, react_1.useMemo)(function () { return currentStep - 1 >= 1; }, [currentStep]);
    var setStep = (0, react_1.useCallback)(function (step) {
        var newStep = step instanceof Function ? step(currentStep) : step;
        if (newStep >= 1 && newStep <= maxStep) {
            setCurrentStep(newStep);
            return;
        }
        throw new Error('Step not valid');
    }, [maxStep, currentStep]);
    var goToNextStep = (0, react_1.useCallback)(function () {
        if (canGoToNextStep) {
            setCurrentStep(function (step) { return step + 1; });
        }
    }, [canGoToNextStep]);
    var goToPrevStep = (0, react_1.useCallback)(function () {
        if (canGoToPrevStep) {
            setCurrentStep(function (step) { return step - 1; });
        }
    }, [canGoToPrevStep]);
    var reset = (0, react_1.useCallback)(function () {
        setCurrentStep(1);
    }, []);
    return [
        currentStep,
        {
            goToNextStep: goToNextStep,
            goToPrevStep: goToPrevStep,
            canGoToNextStep: canGoToNextStep,
            canGoToPrevStep: canGoToPrevStep,
            setStep: setStep,
            reset: reset,
        },
    ];
}
exports.default = useStep;
