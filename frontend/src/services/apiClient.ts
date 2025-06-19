"use client";

import { cognitoService } from './cognito';

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const token = await cognitoService.getIdToken();
      console.log('🔐 API Client Debug - Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.error('🔐 API Client Debug - Error getting token:', error);
    }
    console.log('🔐 API Client Debug - No token available, proceeding without auth');
    return {};
  }

  private async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Get auth headers unless explicitly skipped
    const authHeaders = skipAuth ? {} : await this.getAuthHeaders();

    // Merge headers
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    };

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Debug logging
    const authHeader = 'Authorization' in finalHeaders ? finalHeaders.Authorization as string : undefined;
    console.log('🌐 API Client Debug - Making request:', {
      url,
      method: restOptions.method || 'GET',
      hasAuth: !!authHeader,
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'none'
    });

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: finalHeaders,
      });

      // Try to parse JSON response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Check for API errors
      if (!response.ok) {
        console.error('🚨 API Client Debug - Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url,
          data
        });
        throw new Error(
          typeof data === 'object' && (data.error || data.message)
            ? data.error || data.message
            : `Request failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  // HTTP method helpers
  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Convenience exports for specific API endpoints
export const api = {
  // Conversations
  conversations: {
    list: () => apiClient.get('/api/conversations'),
    get: (id: string) => apiClient.get(`/api/conversations/${id}`),
    create: (data: any) => apiClient.post('/api/conversations', data),
    update: (id: string, data: any) => apiClient.put(`/api/conversations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/conversations/${id}`),
    close: (id: string, data: { reason?: string; status?: 'completed' | 'terminated' }) => 
      apiClient.post(`/api/conversations/${id}/close`, data),
  },

  // Messages
  messages: {
    list: (conversationId: string) => apiClient.get(`/api/conversations/${conversationId}/messages`),
    create: (conversationId: string, data: any) => apiClient.post(`/api/conversations/${conversationId}/messages`, data),
    update: (conversationId: string, messageId: string, data: any) => apiClient.put(`/api/conversations/${conversationId}/messages/${messageId}`, data),
    delete: (conversationId: string, messageId: string) => apiClient.delete(`/api/conversations/${conversationId}/messages/${messageId}`),
  },

  // Personas
  personas: {
    list: () => apiClient.get('/api/personas'),
    get: (id: string) => apiClient.get(`/api/personas/${id}`),
    create: (data: any) => apiClient.post('/api/personas', data),
    update: (id: string, data: any) => apiClient.put(`/api/personas/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/personas/${id}`),
  },

  // Admin
  admin: {
    databaseStatus: () => apiClient.get('/api/admin/database-status'),
    health: () => apiClient.get('/api/health', { skipAuth: true }),
    seedDatabase: () => apiClient.post('/api/admin/seed-database'),
    setupDatabase: () => apiClient.post('/api/admin/setup-database'),
    testAI: (data: any) => apiClient.post('/api/ai/generate-response', data),
  },

  // AI
  ai: {
    generateResponse: (conversationId: string, data: any) => apiClient.post(`/api/ai/generate-response`, { conversationId, ...data }),
  },
};