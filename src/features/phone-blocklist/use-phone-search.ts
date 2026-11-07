import { useEffect, useState } from 'react';
import { lookupPhone, type PhoneEntry } from '../../api/phone-blocklist';

type SearchResult = { query: string; revision: number; entry: PhoneEntry | null; error: unknown };

export function usePhoneSearch(phone: string, revision: number) {
  const query = phone.trim().replace(/[ .()-]/g, '');
  const complete = phone.length <= 64 && /^\+33[1-9][0-9]{8}$/.test(query);
  const [result, setResult] = useState<SearchResult | null>(null);
  const current = result?.query === query && result.revision === revision ? result : null;

  useEffect(() => {
    setResult(null);
    if (!complete) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void lookupPhone(query, controller.signal).then(
        (entry) => { if (!controller.signal.aborted) setResult({ query, revision, entry, error: null }); },
        (error: unknown) => { if (!controller.signal.aborted) setResult({ query, revision, entry: null, error }); },
      );
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [complete, query, revision]);

  return {
    query,
    active: phone.trim().length > 0,
    entry: complete ? current?.entry ?? null : null,
    error: complete ? current?.error ?? null : null,
    loading: complete && current === null,
  };
}
