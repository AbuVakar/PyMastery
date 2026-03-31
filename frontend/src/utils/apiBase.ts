const normalizeUrl = (value: string) => value.replace(/\/$/, '');
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isLoopbackUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(value);

const resolveDefaultApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  return `${window.location.protocol}//${window.location.hostname}:8000`;
};

const resolveDefaultFrontendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5173';
  }

  return window.location.origin;
};

const resolveConfiguredApiUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredApiUrl) {
    return resolveDefaultApiUrl();
  }

  if (
    typeof window !== 'undefined' &&
    LOOPBACK_HOSTS.has(window.location.hostname) &&
    isAbsoluteUrl(configuredApiUrl) &&
    !isLoopbackUrl(configuredApiUrl)
  ) {
    return resolveDefaultApiUrl();
  }

  return configuredApiUrl;
};

export const API_BASE_URL = normalizeUrl(resolveConfiguredApiUrl());
export const FRONTEND_BASE_URL = normalizeUrl(import.meta.env.VITE_FRONTEND_URL || resolveDefaultFrontendUrl());
export const WS_BASE_URL = normalizeUrl(import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/i, 'ws'));

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const buildFrontendUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${FRONTEND_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const buildWsUrl = (path: string) => {
  if (/^wss?:\/\//i.test(path)) {
    return path;
  }

  return `${WS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
