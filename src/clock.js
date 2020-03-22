import makeEventHandler from "./events.js";

export default function makeClock(
    nextTick = window.requestAnimationFrame,
    now = performance.now.bind(performance)
) {
    if (typeof nextTick !== "function") {
        throw `"nextTick" must be a function, get "${typeof nextTick}".`;
    }
    if (typeof now !== "function") {
        throw `"now" must be a function, get "${typeof now}".`;
    }
    const events = makeEventHandler();
    let running = false;
    let time = null;
    let nextTickFunction = null;

    function tick() {
        const t = now();
        const dt = t - time;
        if (nextTickFunction) {
            nextTickFunction(dt);
            nextTickFunction = null;
        }
        events.emit("tick", dt);
        time = t;
    }

    return {
        start() {
            running = true;
            time = now();
            tick();
            let runningFunction = null;
            nextTick(
                (runningFunction = () => {
                    tick();
                    if (running) {
                        nextTick(runningFunction);
                    }
                })
            );
        },
        stop() {
            running = false;
        },
        nextTick(func) {
            if (typeof func !== "function") {
                throw `nextTick argument must be a function, get ${typeof func}.`;
            }
            nextTickFunction = func;
        },
        ...events
    };
}