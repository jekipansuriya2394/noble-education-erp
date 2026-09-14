const API_BASE = '/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const { params, ...customConfig } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('noble_access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customConfig.headers,
  };

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
      credentials: 'include', // Support HTTP-only cookies
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !url.includes('/auth/login')) {
        // Token expired or unauthenticated
        localStorage.removeItem('noble_access_token');
        localStorage.removeItem('noble_user');
      }
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return { success: true, ...data };
  } catch (err: any) {
    console.error('API Request Error:', err);
    return {
      success: false,
      error: err.message || 'Network connection failed. Please verify server is running.',
    };
  }
}

export default apiRequest;
