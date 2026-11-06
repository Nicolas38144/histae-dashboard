import { useEffect, useRef, useState } from 'react';
import { changePhonePolicy, lookupPhone, type PhoneChange, type PhoneEntry, type PhoneTarget } from '../../api/phone-blocklist';

type PhoneReview = { entry: PhoneEntry; target: PhoneTarget };
type PendingOperation = 'lookup' | 'save' | null;

export function usePhonePolicy(onUpdated: () => void) {
  const [review, setReview] = useState<PhoneReview | null>(null);
  const [operation, setOperation] = useState<PendingOperation>(null);
  const [error, setError] = useState<unknown>(null);
  const pending = useRef<PendingOperation>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  const open = (entry: PhoneEntry) => {
    if (pending.current || !entry.id) return;
    setReview({ entry, target: { entry_id: entry.id } });
  };

  const close = () => {
    if (!pending.current) setReview(null);
  };

  const search = async (phone: string) => {
    if (pending.current || !phone.trim()) return;
    const controller = new AbortController();
    request.current = controller;
    pending.current = 'lookup';
    setOperation('lookup');
    setError(null);
    try {
      const entry = await lookupPhone(phone, controller.signal);
      if (!controller.signal.aborted) {
        setReview({ entry, target: entry.id ? { entry_id: entry.id } : { phone_number: phone } });
      }
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason);
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setOperation(null);
    }
  };

  const save = async (change: PhoneChange) => {
    if (pending.current || !review) return;
    pending.current = 'save';
    setOperation('save');
    setError(null);
    try {
      await changePhonePolicy(change);
    } catch (reason) {
      if (mounted.current) setError(reason);
    } finally {
      pending.current = null;
      if (mounted.current) {
        // Resolve an uncertain write with a fresh read, never by retrying the mutation.
        setReview(null);
        setOperation(null);
        onUpdated();
      }
    }
  };

  return { review, looking: operation === 'lookup', saving: operation === 'save', error, open, close, search, save };
}
