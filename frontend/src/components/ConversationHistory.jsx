import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../api';
import './ConversationHistory.css';

const ConversationHistory = ({ onSelectConversation, onNewConversation, currentConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Refresh conversations when a new one is created or when navigating
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try localStorage cache first
      const cached = localStorage.getItem('llm_council_conversations');
      const cacheTime = localStorage.getItem('llm_council_conversations_time');
      
      // Use cache if it's less than 5 minutes old
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < 5 * 60 * 1000) {
          try {
            const cachedConversations = JSON.parse(cached);
            setConversations(cachedConversations);
            setLoading(false);
            // Still fetch in background to update cache
            fetchConversations(true);
            return;
          } catch (e) {
            // Cache invalid, fetch fresh
          }
        }
      }
      
      await fetchConversations(false);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchConversations = async (background = false) => {
    try {
      const data = await api.listConversations();
      setConversations(data);
      
      // Cache in localStorage
      localStorage.setItem('llm_council_conversations', JSON.stringify(data));
      localStorage.setItem('llm_council_conversations_time', Date.now().toString());
      
      if (!background) {
        setLoading(false);
      }
    } catch (err) {
      if (!background) {
        setError(err.message || 'Failed to fetch conversations');
        setLoading(false);
      }
      throw err;
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      const conversation = await api.getConversation(conversationId);
      onSelectConversation(conversation);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Show full date for older conversations
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className={`conversation-history ${isOpen ? 'open' : 'closed'}`}>
      <div className="conversation-history-header">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="history-toggle"
          title={isOpen ? 'Hide history' : 'Show history'}
        >
          <MessageSquare className="history-icon" />
          <span className="history-title">Conversations</span>
        </button>
        {isOpen && (
          <button
            onClick={() => {
              loadConversations();
              onNewConversation();
            }}
            className="new-conversation-button"
            title="New conversation"
          >
            <Plus className="icon-small" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="conversation-list">
          {loading && conversations.length === 0 ? (
            <div className="conversation-loading">
              <Loader2 className="spinner-small" />
              <span>Loading conversations...</span>
            </div>
          ) : error && conversations.length === 0 ? (
            <div className="conversation-error">
              <p>{error}</p>
              <button onClick={loadConversations} className="retry-button">
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="conversation-empty">
              <MessageSquare className="empty-icon" />
              <p>No conversations yet</p>
              <button
                onClick={() => {
                  loadConversations();
                  onNewConversation();
                }}
                className="start-button"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                title={conv.title}
              >
                <MessageSquare className="conversation-icon" />
                <div className="conversation-content">
                  <div className="conversation-title">{conv.title || 'Untitled'}</div>
                  <div className="conversation-meta">
                    {conv.message_count || 0} message{conv.message_count !== 1 ? 's' : ''} • {formatDate(conv.created_at)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;

