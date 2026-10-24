import { useCallback, useContext, useMemo } from 'react';
import { ListMemory } from '../state/list-memory-context';

export function useListRestoration(key: string | undefined) {
  const memory = useContext(ListMemory);
  const readDepth = useCallback(() => {
    const value = key ? Number(memory?.get(key + ':depth') ?? 1) : 1;
    return Number.isSafeInteger(value) && value > 0 ? value : 1;
  }, [memory, key]);
  const rememberDepth = useCallback((depth: number) => {
    if (key) memory?.set(key + ':depth', depth);
  }, [memory, key]);
  const reset = useCallback(() => {
    if (!key) return;
    memory?.set(key + ':depth', 1);
    memory?.set(key + ':scroll', 0);
  }, [memory, key]);
  return useMemo(() => ({ readDepth, rememberDepth, reset }), [readDepth, rememberDepth, reset]);
}
