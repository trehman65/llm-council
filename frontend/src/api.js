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
  /**
   * List all conversations.
   */
  async listConversations() {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`);
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
  async createConversation() {
    try {
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  async getConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );
    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @returns {Promise<void>}
   */
  async sendMessageStream(conversationId, content, onEvent) {
    try {
      console.log('Sending stream request to:', `${API_BASE}/api/conversations/${conversationId}/message/stream`);
      const response = await fetch(
        `${API_BASE}/api/conversations/${conversationId}/message/stream`,
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
      console.error('Stream error:', error);
      onEvent('error', { message: error.message || 'Streaming failed' });
      throw error;
    }
  },
};
