export type Subscriber<T> = (state: T) => void;
export type Unsubscribe = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  update: (fn: (current: T) => T) => void;
  subscribe: (fn: Subscriber<T>) => Unsubscribe;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const subscribers = new Set<Subscriber<T>>();

  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      subscribers.forEach((fn) => fn(state));
    },
    update: (fn: (current: T) => T) => {
      state = fn(state);
      subscribers.forEach((fn) => fn(state));
    },
    subscribe: (fn: Subscriber<T>) => {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
  };
}
