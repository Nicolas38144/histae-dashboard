import { useEffect, useRef, useState } from 'react';
import { changePhonePolicy, type PhoneChange, type PhoneEntry, type PhoneTarget } from '../../api/phone-blocklist';

type PhoneReview = { entry: PhoneEntry; target: PhoneTarget };

export function usePhonePolicy(onUpdated: () => void) {
  const [review, setReview] = useState<PhoneReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const pending = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const open = (entry: PhoneEntry, target?: PhoneTarget) => {
    const resolvedTarget: PhoneTarget | undefined = entry.id ? { entry_id: entry.id } : target;
    if (pending.current || !resolvedTarget) return;
    setReview({ entry, target: resolvedTarget });
  };

  const close = () => {
    if (!pending.current) setReview(null);
  };

  const save = async (change: PhoneChange) => {
    if (pending.current || !review) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      await changePhonePolicy(change);
    } catch (reason) {
      if (mounted.current) setError(reason);
    } finally {
      pending.current = false;
      if (mounted.current) {
        // Resolve an uncertain write with a fresh read, never by retrying the mutation.
        setReview(null);
        setSaving(false);
        onUpdated();
      }
    }
  };

  return { review, saving, error, open, close, save };
}
