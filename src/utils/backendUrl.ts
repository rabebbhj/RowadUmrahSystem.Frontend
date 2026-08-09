const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5045";

export function backendUrl(path: string) {
  return `${backendBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
