import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Trash2, Loader2, User, LogOut } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import './ConversationHistory.css';

const ConversationHistory = ({ onSelectConversation, onNewConversation, currentConversationId }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Close sidebar on mobile by default, open on desktop
  // On desktop, user can still close it and reopen via toggle button
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        setIsOpen(false);
      } else {
        // On desktop, maintain current state but default to open if not set
        if (isOpen === undefined) {
          setIsOpen(true);
        }
      }
    };
    
    // Only set initial state, don't override user's choice on resize
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Refresh conversations when a new one is created or when navigating
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear old cache to ensure we get first_question field
      // Try localStorage cache first
      const cached = localStorage.getItem('llm_council_conversations');
      const cacheTime = localStorage.getItem('llm_council_conversations_time');
      
      // Use cache if it's less than 1 minute old (reduced from 5 minutes to ensure fresh data)
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < 1 * 60 * 1000) {
          try {
            const cachedConversations = JSON.parse(cached);
            // Check if cached data has first_question field, if not, fetch fresh
            if (cachedConversations.length > 0 && cachedConversations[0].hasOwnProperty('first_question')) {
              setConversations(cachedConversations);
              setLoading(false);
              // Still fetch in background to update cache
              fetchConversations(true);
              return;
            }
          } catch (e) {
            // Cache invalid, fetch fresh
          }
        }
      }
      
      // Clear cache if it's outdated or missing first_question field
      localStorage.removeItem('llm_council_conversations');
      localStorage.removeItem('llm_council_conversations_time');
      
      await fetchConversations(false);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchConversations = async (background = false) => {
    try {
      const data = await api.listConversations(token);
      
      // Debug: Log first conversation to check for first_question field
      if (import.meta.env.DEV && data.length > 0) {
        console.log('First conversation data:', data[0]);
      }
      
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

  const detectConversationType = (conversation) => {
    // Check messages to determine conversation type
    if (!conversation.messages || conversation.messages.length === 0) {
      return null; // Can't determine type for empty conversations
    }
    
    // Look for assistant messages with type indicators
    for (const msg of conversation.messages) {
      if (msg.role === 'assistant') {
        // Second-order analysis has type field
        if (msg.type === 'second_order_analysis') {
          return 'second-order';
        }
        // LLM Council has stage1, stage2, stage3 fields (no type field)
        if (msg.stage1 || msg.stage2 || msg.stage3) {
          return 'llm-council';
        }
      }
    }
    
    // If no assistant messages yet, check user message format
    const userMessage = conversation.messages.find(msg => msg.role === 'user');
    if (userMessage) {
      const content = userMessage.content || '';
      // Second-order has "Problem:" and "Solution:" format
      if (content.includes('Problem:') && content.includes('Solution:')) {
        return 'second-order';
      }
      // Otherwise assume LLM Council (regular question format)
      return 'llm-council';
    }
    
    return null;
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      const conversation = await api.getConversation(conversationId, token);
      
      // Detect conversation type and navigate to appropriate tool
      const conversationType = detectConversationType(conversation);
      const currentPath = window.location.pathname;
      
      if (conversationType === 'second-order' && currentPath !== '/second-order') {
        // Navigate to second-order analyzer with conversation data in state
        navigate('/second-order', { state: { conversation } });
      } else if (conversationType === 'llm-council' && currentPath !== '/llm-council') {
        // Navigate to LLM Council with conversation data in state
        navigate('/llm-council', { state: { conversation } });
      } else {
        // Already on the correct page, just load the conversation
        onSelectConversation(conversation);
      }
      
      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <>
      {/* Mobile toggle button - always visible when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mobile-history-toggle"
          title="Show conversations"
          aria-label="Show conversations"
        >
          <MessageSquare className="history-icon" />
        </button>
      )}

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <div 
          className="conversation-history-overlay"
          onClick={() => {
            if (window.innerWidth <= 768) {
              setIsOpen(false);
            }
          }}
        />
      )}

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

      {/* User profile section at bottom */}
      {isOpen && user && (
        <div className="user-profile-section">
          <div className="user-info">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="user-avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`user-avatar-fallback ${user.picture ? 'hidden' : ''}`}>
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default ConversationHistory;

