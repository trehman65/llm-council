import { useState } from 'react';
import { AccountTree, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConversationHistory from './ConversationHistory';
import './SecondOrderAnalyzer.css';

const SecondOrderAnalyzer = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, openLoginModal } = useAuth();
  const [conversationId, setConversationId] = useState(null);

  const handleLoadConversation = (conversation) => {
    // TODO: Implement conversation loading
    setConversationId(conversation.id);
  };

  const handleNewConversation = () => {
    setConversationId(null);
  };

  return (
    <div className="second-order-container">
      <ConversationHistory
        onSelectConversation={handleLoadConversation}
        onNewConversation={handleNewConversation}
        currentConversationId={conversationId}
      />
      
      <div className="second-order-content">
        <div className="second-order-header">
          <button
            onClick={() => navigate('/')}
            className="back-button"
            title="Back to Home"
          >
            <ArrowBack style={{ fontSize: 20 }} />
            <span>Back</span>
          </button>
          
          <div className="second-order-title-section">
            <div className="second-order-icon-large">
              <AccountTree style={{ fontSize: 40 }} />
            </div>
            <h1 className="second-order-title">Second-Order Effect Analyzer</h1>
            <p className="second-order-subtitle">
              Analyze cascading consequences and ripple effects
            </p>
          </div>
        </div>

        <div className="second-order-placeholder">
          <div className="placeholder-icon">
            <AccountTree style={{ fontSize: 64 }} />
          </div>
          <h2>Coming Soon</h2>
          <p>
            The Second-Order Effect Analyzer is currently under development.
            This tool will help you explore the cascading consequences and 
            ripple effects of decisions, actions, or events.
          </p>
          <button
            onClick={() => navigate('/')}
            className="back-to-home-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecondOrderAnalyzer;

