/**
 * Map over `items`, running at most `concurrency` async workers at a time.
 * Results preserve input order.
 *
 * Used to cap WCL GraphQL fan-out: a single request (e.g. an 8-boss, 25-player
 * CLA audit) would otherwise fire ~30+ simultaneous queries and trip WCL's
 * per-second concurrency limit, turning the fixed-backoff retries into a 429
 * storm. Bounding concurrency keeps one request's burst well under the limit.
 */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Math.max(1, Math.min(concurrency, items.length));

  async function run(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: workers }, run));
  return results;
}
