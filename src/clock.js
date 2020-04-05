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

    function tick() {
        const t = now();
        const dt = t - time;
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
        ...events
    };
}