import { useLocale } from '../i18n/useLocale';
import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../api/client';

export function useAsyncData<T>(loader: () => Promise<T>) {
  const locale = useLocale();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => { if (active) setData(value); })
      .catch((reason: unknown) => { if (active) setError(reason); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader, revision, locale]);

  return { data, loading, error: error === null ? null : errorMessage(error), reload };
}
