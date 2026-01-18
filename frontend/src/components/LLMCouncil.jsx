import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Trophy, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import ConversationHistory from './ConversationHistory';
import './LLMCouncil.css';

// Get API base URL for debugging
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Safe inline markdown component for ranking reasoning
// ReactMarkdown v10 expects a single string as children, not arrays/nodes.
// We normalize everything into a string before passing it in.
const InlineMarkdown = ({ text }) => {
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  try {
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <span>{children}</span>,
          h1: ({ children }) => <span>{children}</span>,
          h2: ({ children }) => <span>{children}</span>,
          h3: ({ children }) => <span>{children}</span>,
        }}
      >
        {safeText}
      </ReactMarkdown>
    );
  } catch (e) {
    console.error('Error rendering markdown:', e);
    return <span>{safeText}</span>;
  }
};

const LLMCouncil = () => {
  const [question, setQuestion] = useState('');
  const [stage, setStage] = useState('input');
  const [responses, setResponses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  
  // Store data as it arrives from stream
  const [stage1Data, setStage1Data] = useState(null);
  const [stage2Data, setStage2Data] = useState(null);
  const [stage3Data, setStage3Data] = useState(null);
  const [stage2Metadata, setStage2Metadata] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Show debug info in production if API URL looks wrong
  useEffect(() => {
    if (API_BASE.includes('localhost') && window.location.hostname !== 'localhost') {
      setShowDebug(true);
    }
  }, []);

  // Map backend model names to display names and colors
  const getModelInfo = (modelName) => {
    const modelMap = {
      'anthropic/claude-sonnet-4.5': { name: 'Claude Sonnet 4.5', color: 'bg-orange-500' },
      'openai/gpt-5.1': { name: 'GPT-5.1', color: 'bg-green-500' },
      'google/gemini-3-pro-preview': { name: 'Gemini Pro', color: 'bg-blue-500' },
      'x-ai/grok-4': { name: 'Grok', color: 'bg-purple-500' },
    };
    return modelMap[modelName] || { name: modelName, color: 'bg-gray-500' };
  };

  const extractReasoning = (rankingText) => {
    if (!rankingText) return null;
    // Extract text before "FINAL RANKING:" if it exists
    const parts = rankingText.split('FINAL RANKING:');
    if (parts.length > 0 && parts[0].trim()) {
      const reasoning = parts[0].trim();
      return reasoning.substring(0, 150) + (reasoning.length > 150 ? '...' : '');
    }
    return rankingText.substring(0, 150) + (rankingText.length > 150 ? '...' : '');
  };

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    setError(null);
    setLoading(true);
    setStage('stage1');
    setResponses([]);
    setReviews([]);
    setFinalAnswer('');
    setSelectedTab(0);
    setStage1Data(null);
    setStage2Data(null);
    setStage3Data(null);
    setStage2Metadata(null);

    try {
      console.log('Creating conversation...');
      // Create a new conversation
      const conversation = await api.createConversation();
      console.log('Conversation created:', conversation.id);
      setConversationId(conversation.id);

      // Send message with streaming - collect all data but don't auto-advance stages
      console.log('Starting message stream...');
      await api.sendMessageStream(conversation.id, question, (eventType, event) => {
        console.log('Stream event:', eventType, event);
        switch (eventType) {
          case 'stage1_start':
            console.log('Stage 1 started');
            setStage('stage1');
            setLoading(true);
            break;

          case 'stage1_complete':
            console.log('Stage 1 complete, data:', event.data);
            if (event.data && Array.isArray(event.data)) {
              const formattedResponses = event.data.map((result) => {
                const modelInfo = getModelInfo(result.model);
                return {
                  model: modelInfo.name,
                  response: result.response || '',
                  id: result.model,
                  color: modelInfo.color,
                  originalModel: result.model
                };
              });
              setStage1Data(formattedResponses);
              setResponses(formattedResponses);
              setLoading(false);
              console.log('Stage 1 responses set:', formattedResponses.length);
              // STOP HERE - wait for user to click "Proceed to Cross-Review"
            } else {
              console.error('Stage 1 data invalid:', event.data);
              setError('Failed to get model responses. Please try again.');
              setLoading(false);
            }
            break;

          case 'stage2_start':
            // Stage 2 data is being fetched, but we're still showing Stage 1
            // Don't change stage yet - wait for user action
            break;

          case 'stage2_complete':
            console.log('Stage 2 complete, data:', event.data);
            if (event.data && Array.isArray(event.data) && event.metadata) {
              setStage2Metadata(event.metadata);
              const labelToModel = event.metadata.label_to_model || {};
              
              const formattedReviews = event.data.map((review) => {
                const modelInfo = getModelInfo(review.model);
                const rankings = [];
                
                // Parse rankings from parsed_ranking array
                if (review.parsed_ranking && Array.isArray(review.parsed_ranking)) {
                  review.parsed_ranking.forEach((label, idx) => {
                    const originalModel = labelToModel[label];
                    if (originalModel) {
                      const rankedModelInfo = getModelInfo(originalModel);
                      rankings.push({
                        model: rankedModelInfo.name,
                        rank: idx + 1,
                        reasoning: extractReasoning(review.ranking) || 'Ranked based on peer review'
                      });
                    }
                  });
                } else {
                  // Fallback: use all other models
                  const otherModels = stage1Data?.filter(r => r.originalModel !== review.model) || [];
                  otherModels.forEach((r, idx) => {
                    rankings.push({
                      model: r.model,
                      rank: idx + 1,
                      reasoning: 'Ranked based on peer review'
                    });
                  });
                }

                return {
                  reviewer: modelInfo.name,
                  rankings: rankings
                };
              });
              console.log('Formatted reviews:', formattedReviews);
              setStage2Data(formattedReviews);
              setReviews(formattedReviews);
              // Don't change stage - wait for user to click "Generate Final Answer"
            } else {
              console.error('Stage 2 data invalid:', event.data, event.metadata);
            }
            break;

          case 'stage3_start':
            // Stage 3 data is being fetched, but we're still showing Stage 2
            // Don't change stage yet - wait for user action
            break;

          case 'stage3_complete':
            if (event.data && event.data.response) {
              setStage3Data(event.data.response);
              setFinalAnswer(event.data.response);
              // Don't change stage - wait for user to click button
            } else {
              setStage3Data('Error: Unable to generate final synthesis.');
              setFinalAnswer('Error: Unable to generate final synthesis.');
            }
            break;

          case 'error':
            setError(event.message || 'An error occurred');
            setLoading(false);
            break;

          case 'complete':
            setLoading(false);
            break;
        }
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to submit question to council. Please check your connection and try again.');
      setLoading(false);
      setStage('input');
    }
  };

  const handleProceedToReview = () => {
    // User clicked "Proceed to Cross-Review" - move to Stage 2
    if (stage2Data) {
      setStage('stage2');
      setSelectedTab(0);
    }
  };

  const handleGenerateFinal = () => {
    // User clicked "Generate Final Answer" - move to Stage 3
    if (stage3Data) {
      setStage('stage3');
    }
  };

  const handleNavigateToStage = (targetStage) => {
    // Helper to check if we can navigate to a stage
    const canNavigateTo = (target) => {
      switch (target) {
        case 'stage1':
          return stage1Data !== null;
        case 'stage2':
          return stage2Data !== null;
        case 'stage3':
          return stage3Data !== null;
        default:
          return true;
      }
    };

    if (canNavigateTo(targetStage)) {
      setStage(targetStage);
    }
  };

  const reset = () => {
    setQuestion('');
    setStage('input');
    setResponses([]);
    setReviews([]);
    setFinalAnswer('');
    setSelectedTab(0);
    setConversationId(null);
    setError(null);
    setStage1Data(null);
    setStage2Data(null);
    setStage3Data(null);
    setStage2Metadata(null);
  };

  // Load a conversation from history
  const handleLoadConversation = (conversation) => {
    setConversationId(conversation.id);
    
    // Find the last message with all stages
    const lastMessage = conversation.messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant' && msg.stage1 && msg.stage2 && msg.stage3);
    
    if (lastMessage) {
      // Find the user question (last user message before this assistant message)
      const userMessages = conversation.messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        setQuestion(userMessages[userMessages.length - 1].content);
      }
      
      // Restore Stage 1 data
      if (lastMessage.stage1 && Array.isArray(lastMessage.stage1)) {
        const formattedResponses = lastMessage.stage1.map((result) => {
          const modelInfo = getModelInfo(result.model);
          return {
            model: modelInfo.name,
            response: result.response || '',
            id: result.model,
            color: modelInfo.color,
            originalModel: result.model
          };
        });
        setStage1Data(formattedResponses);
        setResponses(formattedResponses);
      }
      
      // Restore Stage 2 data
      if (lastMessage.stage2 && Array.isArray(lastMessage.stage2) && lastMessage.stage1) {
        // Reconstruct label_to_model mapping (Response A = first model, Response B = second, etc.)
        const labelToModel = {};
        lastMessage.stage1.forEach((resp, idx) => {
          const label = String.fromCharCode(65 + idx); // A, B, C, ...
          labelToModel[`Response ${label}`] = resp.model;
        });
        
        const formattedReviews = lastMessage.stage2.map((review) => {
          const modelInfo = getModelInfo(review.model);
          const rankings = [];
          
          // Parse rankings using the reconstructed mapping
          if (review.parsed_ranking && Array.isArray(review.parsed_ranking)) {
            review.parsed_ranking.forEach((label, idx) => {
              const originalModel = labelToModel[label];
              if (originalModel) {
                const rankedModelInfo = getModelInfo(originalModel);
                rankings.push({
                  model: rankedModelInfo.name,
                  rank: idx + 1,
                  reasoning: extractReasoning(review.ranking) || 'Ranked based on peer review'
                });
              }
            });
          }
          
          return {
            reviewer: modelInfo.name,
            rankings: rankings
          };
        });
        setStage2Data(formattedReviews);
        setReviews(formattedReviews);
      }
      
      // Restore Stage 3 data
      if (lastMessage.stage3 && lastMessage.stage3.response) {
        setStage3Data(lastMessage.stage3.response);
        setFinalAnswer(lastMessage.stage3.response);
      }
      
      // Determine which stage to show (show the last completed stage)
      if (lastMessage.stage3 && lastMessage.stage3.response) {
        setStage('stage3');
      } else if (lastMessage.stage2 && lastMessage.stage2.length > 0) {
        setStage('stage2');
      } else if (lastMessage.stage1 && lastMessage.stage1.length > 0) {
        setStage('stage1');
      }
    } else {
      // No complete message, just show the question
      const userMessages = conversation.messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        setQuestion(userMessages[userMessages.length - 1].content);
        setStage('input');
      }
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    reset();
  };

  // Get models from config (for display)
  const models = [
    { name: 'Claude Sonnet 4.5', id: 'claude', color: 'bg-orange-500' },
    { name: 'GPT-5.1', id: 'gpt4', color: 'bg-green-500' },
    { name: 'Gemini Pro', id: 'gemini', color: 'bg-blue-500' },
    { name: 'Grok', id: 'grok', color: 'bg-purple-500' }
  ];

  return (
    <div className="llm-council-container">
      <ConversationHistory
        onSelectConversation={handleLoadConversation}
        onNewConversation={handleNewConversation}
        currentConversationId={conversationId}
      />
      <div className="llm-council-content">
        <div className="llm-council-header">
          <div className="header-title">
            <Users className="header-icon" />
            <h1 className="header-text">LLM Council</h1>
          </div>
          <p className="header-subtitle">
            Multiple AI models debate to answer your hardest questions
          </p>
        </div>

        {showDebug && (
          <div className="error-message" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }}>
            <strong>⚠️ Configuration Warning:</strong>
            <br />
            API URL is set to: <code>{API_BASE}</code>
            <br />
            <small style={{ marginTop: '0.5rem', display: 'block' }}>
              In Render, set <code>VITE_API_BASE_URL</code> environment variable to your backend URL (e.g., https://your-backend.onrender.com) and rebuild.
            </small>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <br />
            <small style={{ marginTop: '0.5rem', display: 'block' }}>
              API URL: <code>{API_BASE}</code>
              <br />
              Check browser console (F12) for more details. Make sure VITE_API_BASE_URL is set correctly in Render.
            </small>
          </div>
        )}

        {stage === 'input' && (
          <div className="council-card">
            <div className="input-section">
              <label className="input-label">Ask the Council</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What question should the AI council debate? (e.g., 'What are the most important factors to consider when choosing a career path?')"
                className="question-input"
                disabled={loading}
              />
            </div>
            
            <div className="council-members-section">
              <p className="members-label">Council Members:</p>
              <div className="members-list">
                {models.map((model) => (
                  <div key={model.id} className="member-badge">
                    <div className={`member-dot ${model.color}`} />
                    <span>{model.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="button-icon spinning" />
                  Consulting Council...
                </>
              ) : (
                <>
                  <Send className="button-icon" />
                  Submit to Council
                </>
              )}
            </button>
          </div>
        )}

        {stage === 'stage1' && (
          <div className="council-card">
            <div className="stage-navigation">
              <div className="stage-nav-item active">
                <MessageSquare className="stage-nav-icon" />
                <span>Stage 1: Initial Opinions</span>
              </div>
              {stage2Data && (
                <button
                  onClick={() => handleNavigateToStage('stage2')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 2: Peer Review"
                >
                  <Trophy className="stage-nav-icon" />
                  <span>Stage 2: Peer Review</span>
                </button>
              )}
              {stage3Data && (
                <button
                  onClick={() => handleNavigateToStage('stage3')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 3: Final Answer"
                >
                  <Trophy className="stage-nav-icon" />
                  <span>Stage 3: Final Answer</span>
                </button>
              )}
            </div>

            <div className="stage-header">
              <MessageSquare className="stage-icon" />
              <h2 className="stage-title">Stage 1: Initial Opinions</h2>
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Council members are formulating their responses...</span>
              </div>
            ) : responses.length > 0 ? (
              <>
                <div className="model-tabs">
                  {responses.map((resp, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTab(idx)}
                      className={`model-tab ${selectedTab === idx ? 'active' : ''}`}
                    >
                      {resp.model}
                    </button>
                  ))}
                </div>

                <div className="response-display">
                  <div className="response-header">
                    <div className={`response-dot ${responses[selectedTab]?.color}`} />
                    <h3 className="response-model">{responses[selectedTab]?.model}</h3>
                  </div>
                  <div className="response-text">
                    <ReactMarkdown>{responses[selectedTab]?.response || ''}</ReactMarkdown>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={handleProceedToReview}
                    disabled={!stage2Data}
                    className="primary-button"
                  >
                    {stage2Data ? 'Proceed to Cross-Review' : 'Waiting for reviews...'}
                  </button>
                  <button
                    onClick={reset}
                    className="secondary-button"
                  >
                    New Question
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {stage === 'stage2' && (
          <div className="council-card">
            <div className="stage-navigation">
              <button
                onClick={() => handleNavigateToStage('stage1')}
                className="stage-nav-item clickable"
                title="Go to Stage 1: Initial Opinions"
              >
                <MessageSquare className="stage-nav-icon" />
                <span>Stage 1: Initial Opinions</span>
              </button>
              <div className="stage-nav-item active">
                <Trophy className="stage-nav-icon" />
                <span>Stage 2: Peer Review</span>
              </div>
              {stage3Data && (
                <button
                  onClick={() => handleNavigateToStage('stage3')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 3: Final Answer"
                >
                  <Trophy className="stage-nav-icon" />
                  <span>Stage 3: Final Answer</span>
                </button>
              )}
            </div>

            <div className="stage-header">
              <Trophy className="stage-icon" />
              <h2 className="stage-title">Stage 2: Peer Review</h2>
            </div>

            {loading && !reviews.length ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Models are reviewing each other's responses...</span>
              </div>
            ) : reviews && reviews.length > 0 ? (
              <>
                <div className="reviews-list">
                  {reviews.map((review, idx) => {
                    if (!review || !review.reviewer) {
                      console.error('Invalid review at index', idx, review);
                      return null;
                    }
                    return (
                      <div key={idx} className="review-card">
                        <h3 className="review-title">
                          {review.reviewer}'s Rankings
                        </h3>
                        <div className="rankings-list">
                          {review.rankings && Array.isArray(review.rankings) && review.rankings.length > 0 ? (
                            review.rankings.map((rank, ridx) => {
                              if (!rank || !rank.model) {
                                console.error('Invalid rank at index', ridx, rank);
                                return null;
                              }
                              return (
                                <div key={ridx} className="ranking-item">
                                  <span className="ranking-number">#{rank.rank || ridx + 1}</span>
                                  <div className="ranking-content">
                                    <span className="ranking-model">{rank.model}</span>
                                    <span className="ranking-reasoning">
                                      <InlineMarkdown text={`— ${rank.reasoning || 'No reasoning provided'}`} />
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="ranking-item">No rankings available</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="action-buttons">
                  <button
                    onClick={handleGenerateFinal}
                    disabled={!stage3Data}
                    className="primary-button"
                  >
                    {stage3Data ? 'Generate Final Answer' : 'Waiting for synthesis...'}
                  </button>
                  <button
                    onClick={reset}
                    className="secondary-button"
                  >
                    New Question
                  </button>
                </div>
              </>
            ) : (
              <div className="loading-state">
                <p>No reviews available yet. Waiting for peer reviews...</p>
                {stage2Data && stage2Data.length > 0 && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                    Data received but not formatted correctly. Check console for details.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {stage === 'stage3' && (
          <div className="council-card">
            <div className="stage-navigation">
              <button
                onClick={() => handleNavigateToStage('stage1')}
                className="stage-nav-item clickable"
                title="Go to Stage 1: Initial Opinions"
              >
                <MessageSquare className="stage-nav-icon" />
                <span>Stage 1: Initial Opinions</span>
              </button>
              {stage2Data && (
                <button
                  onClick={() => handleNavigateToStage('stage2')}
                  className="stage-nav-item clickable"
                  title="Go to Stage 2: Peer Review"
                >
                  <Trophy className="stage-nav-icon" />
                  <span>Stage 2: Peer Review</span>
                </button>
              )}
              <div className="stage-nav-item active">
                <Trophy className="stage-nav-icon" />
                <span>Stage 3: Final Answer</span>
              </div>
            </div>

            <div className="stage-header">
              <Trophy className="stage-icon final" />
              <h2 className="stage-title">Final Council Decision</h2>
            </div>

            {loading && !finalAnswer ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Chairman is synthesizing the final answer...</span>
              </div>
            ) : (
              <>
                <div className="final-answer">
                  <div className="final-answer-text">
                    <ReactMarkdown>{cleanFinalAnswer(finalAnswer)}</ReactMarkdown>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="primary-button full-width"
                >
                  Ask Another Question
                </button>
              </>
            )}
          </div>
        )}

        <div className="footer">
          <p>Inspired by Andrej Karpathy's LLM Council concept</p>
          <p>Multiple AI perspectives, synthesized into better answers</p>
        </div>
      </div>
    </div>
  );
};

// Clean final answer text - remove artifacts and normalize
const cleanFinalAnswer = (text) => {
  if (!text) return '';
  
  // Remove "$3" artifacts (likely from regex replacement issues or backend artifacts)
  let cleaned = text
    .replace(/\$3/g, '') // Remove standalone $3
    .replace(/\$\d+/g, '') // Remove any $ followed by digits
    .replace(/\n\s*\$\d+\s*\n/g, '\n\n') // Remove $3 on its own line
    .replace(/\n\s*\$\d+\s*/g, '\n'); // Remove $3 at end of line
  
  // Remove any single asterisks on their own line (likely artifacts)
  cleaned = cleaned.replace(/^\s*\*\s*$/gm, '');
  
  // Clean up multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
};

export default LLMCouncil;
