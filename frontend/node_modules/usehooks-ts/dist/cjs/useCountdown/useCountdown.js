"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useCountdown(countdownOption) {
    var isDeprecated = false;
    var countStart, intervalMs, isIncrement, countStop;
    if ('seconds' in countdownOption) {
        console.warn('[useCountdown:DEPRECATED] new interface is already available (see https://usehooks-ts.com/react-hook/use-countdown), the old version will retire on usehooks-ts@3.');
        isDeprecated = true;
        countStart = countdownOption.seconds;
        intervalMs = countdownOption.interval;
        isIncrement = countdownOption.isIncrement;
    }
    else {
        ;
        (countStart = countdownOption.countStart, intervalMs = countdownOption.intervalMs, isIncrement = countdownOption.isIncrement, countStop = countdownOption.countStop);
    }
    intervalMs = intervalMs !== null && intervalMs !== void 0 ? intervalMs : 1000;
    isIncrement = isIncrement !== null && isIncrement !== void 0 ? isIncrement : false;
    countStop = countStop !== null && countStop !== void 0 ? countStop : 0;
    var _a = (0, __1.useCounter)(countStart), count = _a.count, increment = _a.increment, decrement = _a.decrement, resetCounter = _a.reset;
    var _b = (0, __1.useBoolean)(false), isCountdownRunning = _b.value, startCountdown = _b.setTrue, stopCountdown = _b.setFalse;
    var resetCountdown = function () {
        stopCountdown();
        resetCounter();
    };
    var countdownCallback = (0, react_1.useCallback)(function () {
        if (count === countStop) {
            stopCountdown();
            return;
        }
        if (isIncrement) {
            increment();
        }
        else {
            decrement();
        }
    }, [count, countStop, decrement, increment, isIncrement, stopCountdown]);
    (0, __1.useInterval)(countdownCallback, isCountdownRunning ? intervalMs : null);
    return isDeprecated
        ? [
            count,
            {
                start: startCountdown,
                stop: stopCountdown,
                reset: resetCountdown,
            },
        ]
        : [
            count,
            {
                startCountdown: startCountdown,
                stopCountdown: stopCountdown,
                resetCountdown: resetCountdown,
            },
        ];
}
exports.default = useCountdown;
