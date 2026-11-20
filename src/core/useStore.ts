import { useState, useEffect } from 'preact/hooks';
import { Store } from './store';

/**
 * Preact hook to subscribe to any reactive store.
 */
export function useStore<T>(store: Store<T>): T {
  const [state, setState] = useState<T>(store.get());

  useEffect(() => {
    return store.subscribe((next) => {
      setState(next);
    });
  }, [store]);

  return state;
}
