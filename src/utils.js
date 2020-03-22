function* idGenerator() {
    let i = 1;
    while (i < Number.MAX_SAFE_INTEGER) {
        yield i++;
    }
    throw "Cannot generate more ids";
}

export function makeIdGenerator() {
    const gen = idGenerator();
    return () => gen.next().value;
}