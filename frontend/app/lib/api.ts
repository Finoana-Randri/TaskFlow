const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, '');

export function apiUrl(pathname: string) {
  return `${API_BASE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
