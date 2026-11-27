import { useEffect, useState } from 'react';
import { resolveUserName, type UserNameResult } from '../utils/userNames';

export function useUserName(id?: string): UserNameResult | undefined {
  const [resolved, setResolved] = useState<{ id: string; result: UserNameResult }>();
  useEffect(() => {
    if (!id) return;
    let active = true;
    void resolveUserName(id).then((result) => {
      if (active) setResolved({ id, result });
    });
    return () => { active = false; };
  }, [id]);
  return resolved && resolved.id === id ? resolved.result : undefined;
}
