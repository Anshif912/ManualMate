const urlParams = new URLSearchParams(window.location.search);
export const BACKEND_PORT = urlParams.get("port") || "8000";
export const BASE_URL = `http://localhost:${BACKEND_PORT}`;

// Safe fetch helper: never throws, logs failures and returns null instead
export async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.error(`API error ${res.status} for ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Network error fetching ${url}:`, err);
    return null;
  }
}
