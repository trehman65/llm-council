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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:29',message:'initiateLogin called',data:{apiBase:API_BASE},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:31',message:'Fetch starting',data:{url:`${API_BASE}/api/auth/login`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      const response = await fetch(`${API_BASE}/api/auth/login`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:40',message:'Fetch response received',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to initiate login';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:50',message:'Response not OK',data:{status:response.status,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      const result = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:55',message:'Login successful',data:{hasAuthUrl:!!result.auth_url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:58',message:'Fetch error caught',data:{errorMessage:error.message,errorName:error.name,errorType:typeof error,isNetworkError:error.message.includes('Failed to fetch')||error.message.includes('NetworkError')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:130',message:'createConversation called',data:{hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    try {
      const headers = getAuthHeaders(token);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:133',message:'Sending createConversation request',data:{url:`${API_BASE}/api/conversations`,hasContentType:headers['Content-Type']==='application/json'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      const response = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:142',message:'createConversation response',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      if (!response.ok) {
        const errorText = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:147',message:'createConversation error',data:{status:response.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd1d46a-9d09-40cc-ad1b-a06e884f18b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:153',message:'createConversation success',data:{conversationId:result.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
      console.log('Sending guest stream request to:', `${API_BASE}/api/guest/message/stream`);
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
      console.error('Guest stream error:', error);
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
      console.log('Sending stream request to:', `${API_BASE}/api/conversations/${conversationId}/message/stream`);
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
