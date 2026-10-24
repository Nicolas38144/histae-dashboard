export type CursorPage<T> = { items: T[]; nextCursor: string | null };
export type MergeCursorPage<T> = (
  current: T[], incoming: T[], getKey: (item: T) => string,
) => T[];

type PageRequest<T> = {
  loader: (cursor: string | undefined, signal: AbortSignal) => Promise<CursorPage<T>>;
  cursor?: string;
  signal: AbortSignal;
  depth: number;
  getKey: (item: T) => string;
  mergePage: MergeCursorPage<T>;
};

export async function loadCursorPages<T>({ loader, cursor, signal, depth, getKey, mergePage }: PageRequest<T>) {
  let page = await loader(cursor, signal);
  let loadedDepth = 1;
  while (loadedDepth < depth && page.nextCursor && !signal.aborted) {
    const next = await loader(page.nextCursor, signal);
    page = { items: mergePage(page.items, next.items, getKey), nextCursor: next.nextCursor };
    loadedDepth += 1;
  }
  return { ...page, depth: loadedDepth };
}
