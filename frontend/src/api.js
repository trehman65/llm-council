/**
 * API client for the LLM Council backend.
 */

// Use environment variable in production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Log API base URL only in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE);
  if (!API_BASE || API_BASE === 'http://localhost:8001') {
    console.warn('⚠️ API_BASE is using default localhost. In production, set VITE_API_BASE_URL environment variable.');
  }
}

// Helper function to get auth headers
const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  /**
   * Initiate Google OAuth login.
   */
  async initiateLogin() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to initiate login';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the backend is running.`);
      }
      throw error;
    }
  },

  /**
   * Get current user information.
   */
  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(token),
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        throw new Error('Authentication required');
      }
      throw new Error('Failed to get user info');
    }
    return response.json();
  },

  /**
   * Logout the current user.
   */
  async logout(token) {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    return response.json();
  },

  /**
   * List all conversations.
   */
  async listConversations(token) {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        headers: getAuthHeaders(token),
        credentials: 'include',
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
      const headers = getAuthHeaders(token);
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      return result;
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
        headers: getAuthHeaders(token),
        credentials: 'include',
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
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  /**
   * Send a message in guest mode and receive streaming updates (no authentication required).
   * @param {string} content - The message content
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @returns {Promise<void>}
   */
  async sendGuestMessageStream(content, onEvent) {
    try {
      if (import.meta.env.DEV) {
        console.log('Sending guest stream request to:', `${API_BASE}/api/guest/message/stream`);
      }
      const response = await fetch(
        `${API_BASE}/api/guest/message/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Guest stream response error:', response.status, errorText);
        }
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
          if (import.meta.env.DEV) {
            console.log('Guest stream completed');
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

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
      if (import.meta.env.DEV) {
        console.error('Guest stream error:', error);
      }
      onEvent('error', { message: error.message || 'Streaming failed' });
      throw error;
    }
  },

  /**
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @param {string} token - Authentication token
   * @returns {Promise<void>}
   */
  async sendMessageStream(conversationId, content, onEvent, token = null) {
    try {
      if (import.meta.env.DEV) {
        console.log('Sending stream request to:', `${API_BASE}/api/conversations/${conversationId}/message/stream`);
      }
      const response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}/message/stream`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          credentials: 'include',
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Stream response error:', response.status, errorText);
        }
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
          if (import.meta.env.DEV) {
            console.log('Stream completed');
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const event = JSON.parse(data);
                onEvent(event.type, event);
              } catch (e) {
                if (import.meta.env.DEV) {
                  console.error('Failed to parse SSE event:', e, 'Data:', data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Stream error:', error);
      }
      onEvent('error', { message: error.message || 'Streaming failed' });
      throw error;
    }
  },

  /**
   * Analyze second-order impacts in guest mode (no authentication required).
   * @param {string} problem - The problem statement
   * @param {string} solution - The proposed solution
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @returns {Promise<void>}
   */
  async analyzeSecondOrderGuest(problem, solution, onEvent) {
    try {
      if (import.meta.env.DEV) {
        console.log('Sending second-order analysis request (guest)');
      }
      const response = await fetch(
        `${API_BASE}/api/second-order/analyze/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ problem, solution }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Second-order analysis error:', response.status, errorText);
        }
        throw new Error(`Failed to analyze: ${response.status} ${response.statusText}. ${errorText}`);
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
          if (import.meta.env.DEV) {
            console.log('Second-order analysis stream completed');
          }
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
                if (import.meta.env.DEV) {
                  console.error('Failed to parse SSE event:', e, 'Data:', data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Second-order analysis error:', error);
      }
      onEvent('error', { message: error.message || 'Analysis failed' });
      throw error;
    }
  },

  /**
   * Analyze second-order impacts and save to conversation.
   * @param {string} conversationId - The conversation ID
   * @param {string} problem - The problem statement
   * @param {string} solution - The proposed solution
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @param {string} token - Authentication token
   * @returns {Promise<void>}
   */
  async analyzeSecondOrderStream(conversationId, problem, solution, onEvent, token = null) {
    try {
      if (import.meta.env.DEV) {
        console.log('Sending second-order analysis request to conversation:', conversationId);
      }
      const response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}/second-order/analyze/stream`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          credentials: 'include',
          body: JSON.stringify({ problem, solution }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Second-order analysis error:', response.status, errorText);
        }
        throw new Error(`Failed to analyze: ${response.status} ${response.statusText}. ${errorText}`);
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
          if (import.meta.env.DEV) {
            console.log('Second-order analysis stream completed');
          }
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
                if (import.meta.env.DEV) {
                  console.error('Failed to parse SSE event:', e, 'Data:', data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Second-order analysis error:', error);
      }
      onEvent('error', { message: error.message || 'Analysis failed' });
      throw error;
    }
  },

  /**
   * Generate key takeaways from analysis text.
   * @param {string} analysisText - The analysis text to summarize
   * @param {string} stageType - Type of analysis: 'first', 'second', 'third', or 'recommendations'
   * @param {string} token - Optional authentication token
   * @returns {Promise<{takeaways: string[]}>}
   */
  async generateKeyTakeaways(analysisText, stageType = 'first', token = null) {
    try {
      const response = await fetch(
        `${API_BASE}/api/second-order/key-takeaways`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          credentials: 'include',
          body: JSON.stringify({
            analysis_text: analysisText,
            stage_type: stageType,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Key takeaways error:', response.status, errorText);
        }
        throw new Error(`Failed to generate key takeaways: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Key takeaways error:', error);
      }
      throw error;
    }
  },
};
