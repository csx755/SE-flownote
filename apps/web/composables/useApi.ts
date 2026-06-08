interface ApiOptions extends RequestInit {
  token?: string;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const request = async <T>(path: string, options: ApiOptions = {}) => {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  };

  return { request };
};
