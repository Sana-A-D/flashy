import { ACTUAL_API_URL } from '../services/api/client';

/**
 * Resolves an image URL safely.
 * If the URL is already absolute (http://, https://, or data:), returns as-is.
 * If it is a relative path starting with '/', prepends the active host/server base.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const baseUrl = ACTUAL_API_URL.replace(/\/api\/v1\/?$/, '');
    return `${baseUrl}${trimmed}`;
  }

  return trimmed;
}
