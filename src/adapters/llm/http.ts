export type FetchFn = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export const DEFAULT_LLM_TIMEOUT_MS = 60_000;

/** POSTs JSON with a timeout and returns the parsed body. Errors carry the status only, never headers. */
export async function postJson(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
  label: string,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${label} request failed with status ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
