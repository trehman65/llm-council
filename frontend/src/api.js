/**
 * API client for the LLM Council backend.
 */

// Use environment variable in production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Log API base URL (always log to help debug production issues)
console.log('API Base URL:', API_BASE);
if (!API_BASE || API_BASE === 'http://localhost:8001') {
  console.warn('⚠️ API_BASE is using default localhost. In production, set VITE_API_BASE_URL environment variable.');
}

export const api = {
  // ==================== Authentication Methods ====================

  /**
   * Initiate Google OAuth login.
   * Returns the authorization URL to redirect the user to.
   */
  async initiateLogin() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initiate login: ${response.status} ${response.statusText}. ${errorText}`);
      }
      return response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the backend is running.`);
      }
      throw error;
    }
  },

  /**
   * Get the current authenticated user.
   */
  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to get current user');
    }
    return response.json();
  },

  /**
   * Logout the current user.
   */
  async logout(token) {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    return response.json();
  },

  // ==================== Conversation Methods ====================

  /**
   * List all conversations for the current user.
   */
  async listConversations(token) {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list conversations: ${response.status} ${response.statusText}. ${errorText}`);
      }
      return response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the backend is running.`);
      }
      throw error;
    }
  },

  /**
   * Create a new conversation.
   */
  async createConversation(token) {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}. ${errorText}`);
      }
      return response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the backend is running.`);
      }
      throw error;
    }
  },

  /**
   * Get a specific conversation.
   */
  async getConversation(conversationId, token) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content, token) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  /**
   * Send a message and receive streaming updates (authenticated).
   */
  async sendMessageStream(conversationId, content, token, onEvent) {
    try {
      console.log('Sending stream request to:', `${API_BASE}/api/conversations/${conversationId}/message/stream`);
      const response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}/message/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream response error:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}. ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null - streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const event = JSON.parse(data);
                onEvent(event.type, event);
              } catch (e) {
                console.error('Failed to parse SSE event:', e, 'Data:', data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      onEvent('error', { message: error.message || 'Streaming failed' });
      throw error;
    }
  },

  // ==================== Guest Mode Methods ====================

  /**
   * Send a message in guest mode (no authentication required).
   * Conversations are not saved.
   */
  async sendGuestMessageStream(content, onEvent) {
    try {
      console.log('Sending guest stream request to:', `${API_BASE}/api/guest/message/stream`);
      const response = await fetch(
        `${API_BASE}/api/guest/message/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Guest stream response error:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}. ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null - streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Guest stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const event = JSON.parse(data);
                onEvent(event.type, event);
              } catch (e) {
                console.error('Failed to parse SSE event:', e, 'Data:', data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Guest stream error:', error);
      onEvent('error', { message: error.message || 'Streaming failed' });
      throw error;
    }
  },
};

export default api;
