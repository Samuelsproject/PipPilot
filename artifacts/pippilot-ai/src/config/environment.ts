const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

/**
 * Public client configuration only.
 * VITE_ variables are bundled into browser code and must not contain secrets.
 */
export const environment = Object.freeze({
  apiBaseUrl: apiBaseUrl || undefined,
  hasApiBaseUrl: Boolean(apiBaseUrl),
});
