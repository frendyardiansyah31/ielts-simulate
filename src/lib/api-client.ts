/**
 * Thin fetch wrapper for calling our own /api/admin/* and /api routes from
 * client components — unwraps the { data } / { error } envelope (api-spec.md)
 * into a plain return value or a thrown Error.
 */
export async function apiRequest<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Something went wrong");
  }

  return body?.data as T;
}
