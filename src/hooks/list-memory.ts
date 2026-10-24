import { useContext, useEffect, useState } from 'react';
import { ListMemory } from '../state/list-memory-context';

export function useRememberedState<T>(key: string, initial: T) {
  const memory = useContext(ListMemory);
  const [value, setValue] = useState<T>(() =>
    memory?.has(key) ? memory.get(key) as T : initial);

  useEffect(() => { memory?.set(key, value); }, [memory, key, value]);
  return [value, setValue] as const;
}
