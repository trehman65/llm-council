import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Trophy, Loader2 } from 'lucide-react';
import { api } from '../api';
import './LLMCouncil.css';

// Get API base URL for debugging
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

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
              setStage2Data(formattedReviews);
              setReviews(formattedReviews);
              // Don't change stage - wait for user to click "Generate Final Answer"
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

  // Get models from config (for display)
  const models = [
    { name: 'Claude Sonnet 4.5', id: 'claude', color: 'bg-orange-500' },
    { name: 'GPT-5.1', id: 'gpt4', color: 'bg-green-500' },
    { name: 'Gemini Pro', id: 'gemini', color: 'bg-blue-500' },
    { name: 'Grok', id: 'grok', color: 'bg-purple-500' }
  ];

  return (
    <div className="llm-council-container">
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
                  <p className="response-text">
                    {responses[selectedTab]?.response}
                  </p>
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
            <div className="stage-header">
              <Trophy className="stage-icon" />
              <h2 className="stage-title">Stage 2: Peer Review</h2>
            </div>

            {loading && !reviews.length ? (
              <div className="loading-state">
                <Loader2 className="spinner" />
                <span className="loading-text">Models are reviewing each other's responses...</span>
              </div>
            ) : reviews.length > 0 ? (
              <>
                <div className="reviews-list">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="review-card">
                      <h3 className="review-title">
                        {review.reviewer}'s Rankings
                      </h3>
                      <div className="rankings-list">
                        {review.rankings.map((rank, ridx) => (
                          <div key={ridx} className="ranking-item">
                            <span className="ranking-number">#{rank.rank}</span>
                            <div className="ranking-content">
                              <span className="ranking-model">{rank.model}</span>
                              <span className="ranking-reasoning">— {rank.reasoning}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
            ) : null}
          </div>
        )}

        {stage === 'stage3' && (
          <div className="council-card">
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
                  <div className="final-answer-text" dangerouslySetInnerHTML={{ __html: formatFinalAnswer(finalAnswer) }} />
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

// Format final answer with markdown-like styling
const formatFinalAnswer = (text) => {
  if (!text) return '';
  
  // Convert markdown-style headers
  let formatted = text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$2</h2>')
    .replace(/^### (.+)$/gm, '<h3>$3</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  formatted = formatted.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in ul tags
  formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Convert line breaks to paragraphs
  const paragraphs = formatted.split('\n\n').filter(p => p.trim());
  formatted = paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<li')) {
      return p;
    }
    return '<p>' + p + '</p>';
  }).join('');
  
  return formatted;
};

export default LLMCouncil;
