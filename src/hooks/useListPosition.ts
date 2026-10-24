import { useContext, useEffect } from 'react';
import { ListMemory } from '../state/list-memory-context';

export function useListPosition(key: string | undefined, ready: boolean) {
  const memory = useContext(ListMemory);
  useEffect(() => {
    if (!memory || !key || !ready) return;
    const positionKey = key + ':scroll';
    const save = () => memory.set(positionKey, window.scrollY);
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, Number(memory.get(positionKey) ?? 0));
      window.addEventListener('scroll', save, { passive: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', save);
    };
  }, [memory, key, ready]);
}
