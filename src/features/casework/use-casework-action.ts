import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import { useNotification } from '../../components/notification-context';

export function useCaseworkAction() {
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function run(operation: () => Promise<unknown>, onSuccess: () => void) {
    if (pending.current || !mounted.current) return;
    pending.current = true;
    setSaving(true);
    try {
      await operation();
      if (mounted.current) onSuccess();
    } catch (error) {
      if (mounted.current) showNotification(errorMessage(error), 'error');
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return { saving, run };
}
