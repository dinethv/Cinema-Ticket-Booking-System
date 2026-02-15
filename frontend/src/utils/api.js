export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("cinema_token");
  const isFormData = options.body instanceof FormData;
  const baseHeaders = isFormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}) 
    },
    ...options
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
