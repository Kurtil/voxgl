function makeEventHandler() {
  let id = 1;
  const subscriptions = new Map();
  const eventHandlers = new Map();

  return {
    on(eventName, callback) {
      if (typeof callback !== "function") {
        throw `callback must be a function, get ${typeof callback}`;
      }
      const subscriptionId = id++;
      subscriptions.set(subscriptionId, { eventName, callback });
      if (eventHandlers.has(eventName)) {
        eventHandlers.get(eventName).push(callback);
      } else {
        eventHandlers.set(eventName, [callback]);
      }
      return subscriptionId;
    },
    once(eventName, callback) {
      if (typeof callback !== "function") {
        throw `callback must be a function, get ${typeof callback}`;
      }
      const subscriptionId = this.on(eventName, (...args) => {
        this.off(subscriptionId);
        callback(...args);
      });
      return subscriptionId;
    },
    off(subscriptionId) {
      const subscription = subscriptions.get(subscriptionId);
      if (subscription) {
        const { eventName, callback } = subscription;
        const handlers = eventHandlers
          .get(eventName)
          .filter(handler => handler !== callback);
        if (handlers.length) {
          eventHandlers.set(eventName, handlers);
        } else {
          eventHandlers.delete(eventName);
        }
        subscriptions.delete(subscriptionId);
      }
    },
    emit(eventName, payload) {
      const handlers = eventHandlers.get(eventName) || [];
      handlers.forEach(handler => handler(payload));
    },
    clear() {
      subscriptions.clear();
      eventHandlers.clear();
    }
  };
}

export default makeEventHandler;