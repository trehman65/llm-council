import React, { useState, useEffect, useRef } from 'react';
import { Loader2, TrendingUp, AlertTriangle, Target, CheckCircle, Trophy } from 'lucide-react';
import { AccountTree, ArrowBack, ArrowForward } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ConversationHistory from './ConversationHistory';
import './SecondOrderAnalyzer.css';

const SecondOrderAnalyzer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading: authLoading, openLoginModal } = useAuth();
  const isGuest = !token;

  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [stage, setStage] = useState('input');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null); // Track which stage is currently loading
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [notification, setNotification] = useState(null);
  const stageRef = useRef(stage);
  
  // Stage data
  const [firstOrderData, setFirstOrderData] = useState(null);
  const [secondOrderData, setSecondOrderData] = useState(null);
  const [thirdOrderData, setThirdOrderData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);

  const reset = () => {
    setProblem('');
    setSolution('');
    setStage('input');
    setFirstOrderData(null);
    setSecondOrderData(null);
    setThirdOrderData(null);
    setRecommendationsData(null);
    setConversationId(null);
    setError(null);
    setLoading(false);
    setLoadingStage(null);
    setNotification(null);
  };

  const handleNewConversation = () => {
    reset();
  };

  const handleLoadConversation = async (conversation) => {
    try {
      setConversationId(conversation.id);
      
      // Find user message (contains problem and solution)
      const userMessage = conversation.messages?.find(msg => msg.role === 'user');
      if (userMessage && userMessage.content) {
        // Parse "Problem: ...\n\nSolution: ..." format
        const content = userMessage.content;
        const problemMatch = content.match(/Problem:\s*(.+?)(?:\n\nSolution:|$)/s);
        const solutionMatch = content.match(/Solution:\s*(.+?)$/s);
        
        if (problemMatch) {
          setProblem(problemMatch[1].trim());
        }
        if (solutionMatch) {
          setSolution(solutionMatch[1].trim());
        }
      }
      
      // Find assistant message with second-order analysis
      const assistantMessage = conversation.messages?.find(
        msg => msg.role === 'assistant' && msg.type === 'second_order_analysis'
      );
      
      if (assistantMessage) {
        // Load stage data
        if (assistantMessage.first_order) {
          setFirstOrderData(assistantMessage.first_order);
        }
        if (assistantMessage.second_order) {
          setSecondOrderData(assistantMessage.second_order);
        }
        if (assistantMessage.third_order) {
          setThirdOrderData(assistantMessage.third_order);
        }
        if (assistantMessage.recommendations) {
          setRecommendationsData(assistantMessage.recommendations);
        }
        
        // Determine which stage to show (show the last completed stage)
        if (assistantMessage.recommendations) {
          setStage('stage4');
        } else if (assistantMessage.third_order) {
          setStage('stage3');
        } else if (assistantMessage.second_order) {
          setStage('stage2');
        } else if (assistantMessage.first_order) {
          setStage('stage1');
        } else {
          setStage('input');
        }
      } else {
        // No analysis yet, show input stage
        setStage('input');
      }
      
      // Clear any errors and loading states
      setError(null);
      setLoading(false);
      setLoadingStage(null);
      setNotification(null);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!problem.trim() || !solution.trim() || loading) return;

    setError(null);
    setLoading(true);
    setStage('stage1');

    const handleStreamEvent = async (eventType, event) => {
      if (import.meta.env.DEV) {
        console.log('Second-order stream event:', eventType, event);
      }

      switch (eventType) {
        case 'stage1_start':
          setStage('stage1');
          setLoading(true);
          setLoadingStage('stage1');
          break;

        case 'stage1_complete':
          setFirstOrderData(event.data);
          setLoading(false);
          setLoadingStage(null);
          // Don't change stage - keep user on current stage
          break;

        case 'stage2_start':
          setLoading(true);
          setLoadingStage('stage2');
          // Don't change stage - keep user on current stage
          break;

        case 'stage2_complete':
          setSecondOrderData(event.data);
          setLoading(false);
          setLoadingStage(null);
          // Show notification if user is still on Stage 1
          if (stageRef.current === 'stage1') {
            setNotification({
              message: 'Stage 2: Second-Order Impacts complete!',
              stage: 'stage2',
              type: 'success'
            });
          }
          break;

        case 'stage3_start':
          setLoading(true);
          setLoadingStage('stage3');
          // Don't change stage - keep user on current stage
          break;

        case 'stage3_complete':
          setThirdOrderData(event.data);
          setLoading(false);
          setLoadingStage(null);
          // Show notification if user is still on Stage 1 or Stage 2
          if (stageRef.current === 'stage1' || stageRef.current === 'stage2') {
            setNotification({
              message: 'Stage 3: Third-Order Impacts complete!',
              stage: 'stage3',
              type: 'success'
            });
          }
          break;

        case 'stage4_start':
          setLoading(true);
          setLoadingStage('stage4');
          // Don't change stage - keep user on current stage
          break;

        case 'stage4_complete':
          setRecommendationsData(event.data);
          setLoading(false);
          setLoadingStage(null);
          // Show notification if user is still on Stage 1, 2, or 3
          if (stageRef.current === 'stage1' || stageRef.current === 'stage2' || stageRef.current === 'stage3') {
            setNotification({
              message: 'Stage 4: Recommendations ready!',
              stage: 'stage4',
              type: 'success'
            });
          }
          break;

        case 'title_complete':
          // Title updated
          break;

        case 'complete':
          setLoading(false);
          setLoadingStage(null);
          break;

        case 'error':
          setError(event.message || 'Analysis failed');
          setLoading(false);
          setLoadingStage(null);
          setNotification(null);
          setStage('input');
          break;

        default:
          if (import.meta.env.DEV) {
            console.log('Unhandled event type:', eventType);
          }
      }
    };

    try {
      if (isGuest) {
        // Guest mode
        await api.analyzeSecondOrderGuest(problem.trim(), solution.trim(), handleStreamEvent);
      } else {
        // Authenticated mode
        let currentConversationId = conversationId;
        if (!currentConversationId) {
          const conversation = await api.createConversation(token);
          currentConversationId = conversation.id;
          setConversationId(currentConversationId);
        }
        await api.analyzeSecondOrderStream(
          currentConversationId,
          problem.trim(),
          solution.trim(),
          handleStreamEvent,
          token
        );
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to analyze. Please check your connection and try again.');
      setLoading(false);
      setLoadingStage(null);
      setNotification(null);
      setStage('input');
    }
  };

  // Check for conversation data in location state (when navigating from ConversationHistory)
  useEffect(() => {
    if (location.state?.conversation) {
      handleLoadConversation(location.state.conversation);
      // Clear the state to prevent reloading on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Keep stageRef in sync with stage state
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Auto-dismiss notification after 10 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle notification click - navigate to next stage
  const handleNotificationClick = (targetStage) => {
    setNotification(null);
    handleNavigateToStage(targetStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToStage = (targetStage) => {
    const canNavigateTo = (target) => {
      switch (target) {
        case 'stage1':
          return firstOrderData !== null;
        case 'stage2':
          return secondOrderData !== null;
        case 'stage3':
          return thirdOrderData !== null;
        case 'stage4':
          return recommendationsData !== null;
        default:
          return true;
      }
    };

    if (canNavigateTo(targetStage)) {
      setStage(targetStage);
      // Clear notification when navigating to the notified stage
      if (notification && notification.stage === targetStage) {
        setNotification(null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (authLoading) {
    return (
      <div className="second-order-container">
        <div className="second-order-content">
          <div className="loading-state">
            <Loader2 className="spinner" />
            <span className="loading-text">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="second-order-container">
      {/* Guest mode header */}
      {isGuest && (
        <div className="guest-header">
          <span className="guest-header-title">Second-Order Analyzer</span>
          <button className="guest-signin-btn" onClick={openLoginModal}>
            Sign in
          </button>
        </div>
      )}

      {/* Show conversation history only for logged-in users */}
      {!isGuest && (
        <ConversationHistory
          onSelectConversation={handleLoadConversation}
          onNewConversation={handleNewConversation}
          currentConversationId={conversationId}
        />
      )}

      <div className="second-order-content">
        {/* Stage completion notification */}
        {notification && (
          <div 
            className="stage-notification"
            onClick={() => handleNotificationClick(notification.stage)}
          >
            <div className="notification-content">
              <Trophy className="notification-icon" />
              <div className="notification-text">
                <div className="notification-title">{notification.message}</div>
                <div className="notification-subtitle">Click to view</div>
              </div>
            </div>
            <button 
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

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
              Analyze cascading consequences and anticipate unintended outcomes
            </p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Input Stage */}
        {stage === 'input' && (
          <div className="council-card">
            <div className="input-section">
              <label className="input-label">Problem Statement</label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the problem you're trying to solve. Be specific about user pain points, business objectives, or market conditions."
                className="question-input"
                rows={6}
                disabled={loading}
              />
            </div>

            <div className="input-section">
              <label className="input-label">Proposed Solution</label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Describe your proposed solution or product decision. Include key features, changes, or interventions you plan to implement."
                className="question-input"
                rows={6}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !problem.trim() || !solution.trim()}
              className="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="button-icon spinning" />
                  Analyzing...
                </>
              ) : (
                <>
                  <AccountTree style={{ fontSize: 20 }} />
                  Analyze Impacts
                </>
              )}
            </button>
          </div>
        )}

        {/* Stage 1: First-Order Impacts */}
        {stage === 'stage1' && (
          <div className="council-card">
            {problem && (
              <div className="question-display">
                <div className="question-label">Analysis Context</div>
                <div className="question-text">
                  <strong>Problem:</strong> {problem}
                  <br /><br />
                  <strong>Solution:</strong> {solution}
                </div>
              </div>
            )}

            <div className="stage-navigation">
              <div className="stage-nav-item active">
                <TrendingUp className="stage-nav-icon" />
                <span>Stage 1: First-Order Impacts</span>
              </div>
              {secondOrderData && (
                <button
                  onClick={() => handleNavigateToStage('stage2')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 2: Second-Order Impacts"
                >
                  <AlertTriangle className="stage-nav-icon" />
                  <span>Stage 2: Second-Order</span>
                </button>
              )}
              {thirdOrderData && (
                <button
                  onClick={() => handleNavigateToStage('stage3')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 3: Third-Order Impacts"
                >
                  <Target className="stage-nav-icon" />
                  <span>Stage 3: Third-Order</span>
                </button>
              )}
              {recommendationsData && (
                <button
                  onClick={() => handleNavigateToStage('stage4')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 4: Recommendations"
                >
                  <CheckCircle className="stage-nav-icon" />
                  <span>Stage 4: Recommendations</span>
                </button>
              )}
            </div>

            <div className="stage-header">
              <TrendingUp className="stage-icon" />
              <h2 className="stage-title">Stage 1: First-Order Impacts</h2>
            </div>

            {!firstOrderData && loadingStage === 'stage1' ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Analyzing immediate impacts...</span>
              </div>
            ) : firstOrderData ? (
              <div className="analysis-content">
                <div className="analysis-text markdown-content">
                  <ReactMarkdown>{firstOrderData.analysis || ''}</ReactMarkdown>
                </div>
                {secondOrderData && (
                  <div className="action-buttons">
                    <button
                      onClick={() => handleNavigateToStage('stage2')}
                      className="primary-button"
                    >
                      View Second-Order Impacts
                      <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                    </button>
                  </div>
                )}
                {!secondOrderData && loadingStage === 'stage2' && (
                  <div className="action-buttons">
                    <div className="loading-state">
                      <Loader2 className="spinner" />
                      <span className="loading-text">Analyzing second-order impacts...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Stage 2: Second-Order Impacts */}
        {stage === 'stage2' && (
          <div className="council-card">
            {problem && (
              <div className="question-display">
                <div className="question-label">Analysis Context</div>
                <div className="question-text">
                  <strong>Problem:</strong> {problem}
                  <br /><br />
                  <strong>Solution:</strong> {solution}
                </div>
              </div>
            )}

            <div className="stage-navigation">
              <button
                onClick={() => handleNavigateToStage('stage1')}
                className="stage-nav-item clickable"
                title="Go to Stage 1: First-Order Impacts"
              >
                <TrendingUp className="stage-nav-icon" />
                <span>Stage 1: First-Order</span>
              </button>
              <div className="stage-nav-item active">
                <AlertTriangle className="stage-nav-icon" />
                <span>Stage 2: Second-Order Impacts</span>
              </div>
              {thirdOrderData && (
                <button
                  onClick={() => handleNavigateToStage('stage3')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 3: Third-Order Impacts"
                >
                  <Target className="stage-nav-icon" />
                  <span>Stage 3: Third-Order</span>
                </button>
              )}
              {recommendationsData && (
                <button
                  onClick={() => handleNavigateToStage('stage4')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 4: Recommendations"
                >
                  <CheckCircle className="stage-nav-icon" />
                  <span>Stage 4: Recommendations</span>
                </button>
              )}
            </div>

            <div className="stage-header">
              <AlertTriangle className="stage-icon" />
              <h2 className="stage-title">Stage 2: Second-Order Impacts</h2>
            </div>

            {!secondOrderData && loadingStage === 'stage2' ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Analyzing cascading consequences...</span>
              </div>
            ) : secondOrderData ? (
              <div className="analysis-content">
                <div className="analysis-text markdown-content">
                  <ReactMarkdown>{secondOrderData.analysis || ''}</ReactMarkdown>
                </div>
                {thirdOrderData && (
                  <div className="action-buttons">
                    <button
                      onClick={() => handleNavigateToStage('stage3')}
                      className="primary-button"
                    >
                      View Third-Order Impacts
                      <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                    </button>
                  </div>
                )}
                {!thirdOrderData && loadingStage === 'stage3' && (
                  <div className="action-buttons">
                    <div className="loading-state">
                      <Loader2 className="spinner" />
                      <span className="loading-text">Analyzing third-order impacts...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Stage 3: Third-Order Impacts */}
        {stage === 'stage3' && (
          <div className="council-card">
            {problem && (
              <div className="question-display">
                <div className="question-label">Analysis Context</div>
                <div className="question-text">
                  <strong>Problem:</strong> {problem}
                  <br /><br />
                  <strong>Solution:</strong> {solution}
                </div>
              </div>
            )}

            <div className="stage-navigation">
              <button
                onClick={() => handleNavigateToStage('stage1')}
                className="stage-nav-item clickable"
                title="Go to Stage 1: First-Order Impacts"
              >
                <TrendingUp className="stage-nav-icon" />
                <span>Stage 1: First-Order</span>
              </button>
              <button
                onClick={() => handleNavigateToStage('stage2')}
                className="stage-nav-item clickable"
                title="Go to Stage 2: Second-Order Impacts"
              >
                <AlertTriangle className="stage-nav-icon" />
                <span>Stage 2: Second-Order</span>
              </button>
              <div className="stage-nav-item active">
                <Target className="stage-nav-icon" />
                <span>Stage 3: Third-Order Impacts</span>
              </div>
              {recommendationsData && (
                <button
                  onClick={() => handleNavigateToStage('stage4')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 4: Recommendations"
                >
                  <CheckCircle className="stage-nav-icon" />
                  <span>Stage 4: Recommendations</span>
                </button>
              )}
            </div>

            <div className="stage-header">
              <Target className="stage-icon" />
              <h2 className="stage-title">Stage 3: Third-Order Impacts</h2>
            </div>

            {!thirdOrderData && loadingStage === 'stage3' ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Analyzing structural shifts...</span>
              </div>
            ) : thirdOrderData ? (
              <div className="analysis-content">
                <div className="analysis-text markdown-content">
                  <ReactMarkdown>{thirdOrderData.analysis || ''}</ReactMarkdown>
                </div>
                {recommendationsData && (
                  <div className="action-buttons">
                    <button
                      onClick={() => handleNavigateToStage('stage4')}
                      className="primary-button"
                    >
                      View Recommendations
                      <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                    </button>
                  </div>
                )}
                {!recommendationsData && loadingStage === 'stage4' && (
                  <div className="action-buttons">
                    <div className="loading-state">
                      <Loader2 className="spinner" />
                      <span className="loading-text">Generating recommendations...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Stage 4: Recommendations */}
        {stage === 'stage4' && (
          <div className="council-card">
            {problem && (
              <div className="question-display">
                <div className="question-label">Analysis Context</div>
                <div className="question-text">
                  <strong>Problem:</strong> {problem}
                  <br /><br />
                  <strong>Solution:</strong> {solution}
                </div>
              </div>
            )}

            <div className="stage-navigation">
              <button
                onClick={() => handleNavigateToStage('stage1')}
                className="stage-nav-item clickable"
                title="Go to Stage 1: First-Order Impacts"
              >
                <TrendingUp className="stage-nav-icon" />
                <span>Stage 1: First-Order</span>
              </button>
              <button
                onClick={() => handleNavigateToStage('stage2')}
                className="stage-nav-item clickable"
                title="Go to Stage 2: Second-Order Impacts"
              >
                <AlertTriangle className="stage-nav-icon" />
                <span>Stage 2: Second-Order</span>
              </button>
              <button
                onClick={() => handleNavigateToStage('stage3')}
                className="stage-nav-item clickable"
                title="Go to Stage 3: Third-Order Impacts"
              >
                <Target className="stage-nav-icon" />
                <span>Stage 3: Third-Order</span>
              </button>
              <div className="stage-nav-item active">
                <CheckCircle className="stage-nav-icon" />
                <span>Stage 4: Recommendations</span>
              </div>
            </div>

            <div className="stage-header">
              <CheckCircle className="stage-icon" />
              <h2 className="stage-title">Stage 4: Recommendations & Mitigation</h2>
            </div>

            {!recommendationsData && loadingStage === 'stage4' ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Generating recommendations...</span>
              </div>
            ) : recommendationsData ? (
              <div className="analysis-content">
                <div className="analysis-text markdown-content">
                  <ReactMarkdown>{recommendationsData.analysis || ''}</ReactMarkdown>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={reset}
                    className="secondary-button"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondOrderAnalyzer;
