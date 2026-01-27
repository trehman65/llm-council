import React, { useState, useEffect, useRef } from 'react';
import { Loader2, TrendingUp, AlertTriangle, Target, CheckCircle, Trophy, Network } from 'lucide-react';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ConversationHistory from './ConversationHistory';
import './SecondOrderAnalyzer.css';

// Generate executive summary key takeaways from analysis text
const extractKeyTakeaways = (analysisText, stageType = 'first') => {
  if (!analysisText || typeof analysisText !== 'string') return [];
  
  // Clean the text
  const cleanText = analysisText
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .trim();
  
  if (cleanText.length < 100) return [];
  
  const takeaways = [];
  
  // Parse into paragraphs and sections
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 50);
  const allSentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  
  // Identify key themes and insights
  const themes = {
    risks: [],
    benefits: [],
    impacts: [],
    recommendations: [],
    concerns: []
  };
  
  // Categorize sentences by theme
  allSentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    const trimmed = sentence.trim();
    
    // Risk indicators
    if (/(risk|danger|threat|concern|problem|issue|challenge|difficulty|negative|adverse|harmful)/i.test(lower)) {
      if (trimmed.length > 40 && trimmed.length < 200) {
        themes.risks.push(trimmed);
      }
    }
    
    // Benefit indicators
    if (/(benefit|advantage|positive|improve|enhance|increase|boost|gain|opportunity|value)/i.test(lower)) {
      if (trimmed.length > 40 && trimmed.length < 200) {
        themes.benefits.push(trimmed);
      }
    }
    
    // Impact indicators
    if (/(impact|effect|consequence|result|outcome|lead to|cause|trigger|influence|affect)/i.test(lower)) {
      if (trimmed.length > 40 && trimmed.length < 200) {
        themes.impacts.push(trimmed);
      }
    }
    
    // Recommendation indicators
    if (/(recommend|suggest|should|consider|implement|strategy|approach|solution|action)/i.test(lower)) {
      if (trimmed.length > 40 && trimmed.length < 200) {
        themes.recommendations.push(trimmed);
      }
    }
    
    // Concern indicators
    if (/(critical|important|significant|major|key|essential|crucial|vital|urgent|priority)/i.test(lower)) {
      if (trimmed.length > 40 && trimmed.length < 200) {
        themes.concerns.push(trimmed);
      }
    }
  });
  
  // Generate executive summaries based on stage type
  if (stageType === 'first') {
    // First-order: Focus on immediate, direct impacts
    if (themes.impacts.length > 0) {
      const impact = themes.impacts[0];
      takeaways.push(impact.length > 150 ? impact.substring(0, 140) + '...' : impact);
    }
    if (themes.risks.length > 0 && takeaways.length < 3) {
      const risk = themes.risks[0];
      takeaways.push(risk.length > 150 ? risk.substring(0, 140) + '...' : risk);
    }
    if (themes.benefits.length > 0 && takeaways.length < 3) {
      const benefit = themes.benefits[0];
      takeaways.push(benefit.length > 150 ? benefit.substring(0, 140) + '...' : benefit);
    }
  } else if (stageType === 'second') {
    // Second-order: Focus on cascading, indirect effects
    if (themes.impacts.length > 0) {
      const impact = themes.impacts[0];
      takeaways.push(impact.length > 150 ? impact.substring(0, 140) + '...' : impact);
    }
    if (themes.risks.length > 0 && takeaways.length < 3) {
      const risk = themes.risks[0];
      takeaways.push(risk.length > 150 ? risk.substring(0, 140) + '...' : risk);
    }
    if (themes.concerns.length > 0 && takeaways.length < 3) {
      const concern = themes.concerns[0];
      takeaways.push(concern.length > 150 ? concern.substring(0, 140) + '...' : concern);
    }
  } else if (stageType === 'third') {
    // Third-order: Focus on structural, systemic changes
    if (themes.impacts.length > 0) {
      const impact = themes.impacts[0];
      takeaways.push(impact.length > 150 ? impact.substring(0, 140) + '...' : impact);
    }
    if (themes.concerns.length > 0 && takeaways.length < 3) {
      const concern = themes.concerns[0];
      takeaways.push(concern.length > 150 ? concern.substring(0, 140) + '...' : concern);
    }
    if (themes.risks.length > 0 && takeaways.length < 3) {
      const risk = themes.risks[0];
      takeaways.push(risk.length > 150 ? risk.substring(0, 140) + '...' : risk);
    }
  } else if (stageType === 'recommendations') {
    // Recommendations: Focus on actionable insights
    if (themes.recommendations.length > 0) {
      themes.recommendations.slice(0, 2).forEach(rec => {
        if (takeaways.length < 4) {
          takeaways.push(rec.length > 150 ? rec.substring(0, 140) + '...' : rec);
        }
      });
    }
    if (themes.concerns.length > 0 && takeaways.length < 3) {
      const concern = themes.concerns[0];
      takeaways.push(concern.length > 150 ? concern.substring(0, 140) + '...' : concern);
    }
  }
  
  // If we don't have enough, extract from paragraphs intelligently
  if (takeaways.length < 3) {
    paragraphs.forEach(para => {
      if (takeaways.length >= 5) return;
      
      const lowerPara = para.toLowerCase();
      const trimmedPara = para.trim();
      
      // Find paragraphs with high information density
      const hasKeyTerms = /(because|due to|leads to|results in|causes|enables|prevents|will|would|could|may|might|should)/i.test(lowerPara);
      const hasImpactTerms = /(impact|effect|consequence|result|outcome|risk|benefit|critical|important|significant)/i.test(lowerPara);
      
      if (hasKeyTerms && hasImpactTerms && trimmedPara.length > 80 && trimmedPara.length < 400) {
        // Extract the core message - first sentence or most important part
        const sentences = trimmedPara.split(/[.!?]+/).filter(s => s.trim().length > 40);
        if (sentences.length > 0) {
          let takeaway = sentences[0].trim();
          
          // Clean and shorten if needed
          takeaway = takeaway.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim();
          
          if (takeaway.length > 180) {
            // Try to find the main clause
            const parts = takeaway.split(/[,;]/);
            if (parts.length > 1) {
              takeaway = parts[0].trim();
            } else {
              takeaway = takeaway.substring(0, 160).trim();
            }
          }
          
          if (!takeaway.match(/[.!?]$/)) {
            takeaway += '.';
          }
          
          if (takeaway.length > 40 && takeaway.length < 200) {
            const normalized = takeaway.toLowerCase().substring(0, 50);
            const isDuplicate = takeaways.some(t => t.toLowerCase().substring(0, 50) === normalized);
            if (!isDuplicate) {
              takeaways.push(takeaway);
            }
          }
        }
      }
    });
  }
  
  // Ensure takeaways are complete thoughts
  const finalTakeaways = takeaways.map(takeaway => {
    let cleaned = takeaway.trim();
    if (!cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    return cleaned;
  }).filter(t => t.length > 30 && t.length < 200);
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  finalTakeaways.forEach(takeaway => {
    const normalized = takeaway.toLowerCase().substring(0, 60);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(takeaway);
    }
  });
  
  return unique.slice(0, 5);
};

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
  
  // Track which analysis texts we've already generated takeaways for
  const generatedTakeawaysRef = useRef({
    first: null,
    second: null,
    third: null,
    recommendations: null,
  });
  
  // Stage data
  const [firstOrderData, setFirstOrderData] = useState(null);
  const [secondOrderData, setSecondOrderData] = useState(null);
  const [thirdOrderData, setThirdOrderData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  
  // Key takeaways for each stage
  const [firstOrderTakeaways, setFirstOrderTakeaways] = useState([]);
  const [secondOrderTakeaways, setSecondOrderTakeaways] = useState([]);
  const [thirdOrderTakeaways, setThirdOrderTakeaways] = useState([]);
  const [recommendationsTakeaways, setRecommendationsTakeaways] = useState([]);
  
  // Loading states for takeaways
  const [loadingTakeaways, setLoadingTakeaways] = useState({
    first: false,
    second: false,
    third: false,
    recommendations: false,
  });

  const reset = () => {
    setProblem('');
    setSolution('');
    setStage('input');
    setFirstOrderData(null);
    setSecondOrderData(null);
    setThirdOrderData(null);
    setRecommendationsData(null);
    setFirstOrderTakeaways([]);
    setSecondOrderTakeaways([]);
    setThirdOrderTakeaways([]);
    setRecommendationsTakeaways([]);
    generatedTakeawaysRef.current = {
      first: null,
      second: null,
      third: null,
      recommendations: null,
    };
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
        // Reset takeaways ref so they can be regenerated for loaded data
        generatedTakeawaysRef.current = {
          first: null,
          second: null,
          third: null,
          recommendations: null,
        };
        
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

  // Generate key takeaways when analysis data changes
  useEffect(() => {
    if (!firstOrderData) {
      setFirstOrderTakeaways([]);
      generatedTakeawaysRef.current.first = null;
      return;
    }
    
    const analysisText = typeof firstOrderData === 'string' ? firstOrderData : (firstOrderData?.analysis || '');
    if (import.meta.env.DEV) {
      console.log('First-order data:', firstOrderData);
      console.log('Extracted analysis text length:', analysisText?.length);
    }
    
    if (!analysisText || analysisText.length < 100) {
      if (import.meta.env.DEV) {
        console.log('Analysis text too short or empty, skipping takeaways generation');
      }
      setFirstOrderTakeaways([]);
      generatedTakeawaysRef.current.first = null;
      return;
    }
    
    // Only generate if we haven't generated takeaways for this exact text yet
    if (generatedTakeawaysRef.current.first !== analysisText) {
      if (import.meta.env.DEV) {
        console.log('Generating key takeaways for first-order analysis...', { textLength: analysisText.length });
      }
      generatedTakeawaysRef.current.first = analysisText;
      setLoadingTakeaways(prev => ({ ...prev, first: true }));
      api.generateKeyTakeaways(analysisText, 'first', token)
        .then(result => {
          if (import.meta.env.DEV) {
            console.log('Key takeaways received:', result, 'Count:', result.takeaways?.length);
          }
          setFirstOrderTakeaways(result.takeaways || []);
        })
        .catch(error => {
          console.error('Error generating first-order takeaways:', error);
          setFirstOrderTakeaways([]);
          generatedTakeawaysRef.current.first = null; // Reset on error so we can retry
        })
        .finally(() => {
          setLoadingTakeaways(prev => ({ ...prev, first: false }));
        });
    } else {
      if (import.meta.env.DEV) {
        console.log('Takeaways already generated for this analysis text');
      }
    }
  }, [firstOrderData, token]);

  useEffect(() => {
    if (!secondOrderData) {
      setSecondOrderTakeaways([]);
      generatedTakeawaysRef.current.second = null;
      return;
    }
    
    const analysisText = typeof secondOrderData === 'string' ? secondOrderData : (secondOrderData?.analysis || '');
    if (!analysisText || analysisText.length < 100) {
      setSecondOrderTakeaways([]);
      generatedTakeawaysRef.current.second = null;
      return;
    }
    
    if (generatedTakeawaysRef.current.second !== analysisText) {
      generatedTakeawaysRef.current.second = analysisText;
      setLoadingTakeaways(prev => ({ ...prev, second: true }));
      api.generateKeyTakeaways(analysisText, 'second', token)
        .then(result => {
          setSecondOrderTakeaways(result.takeaways || []);
        })
        .catch(error => {
          console.error('Error generating second-order takeaways:', error);
          setSecondOrderTakeaways([]);
          generatedTakeawaysRef.current.second = null;
        })
        .finally(() => {
          setLoadingTakeaways(prev => ({ ...prev, second: false }));
        });
    }
  }, [secondOrderData, token]);

  useEffect(() => {
    if (!thirdOrderData) {
      setThirdOrderTakeaways([]);
      generatedTakeawaysRef.current.third = null;
      return;
    }
    
    const analysisText = typeof thirdOrderData === 'string' ? thirdOrderData : (thirdOrderData?.analysis || '');
    if (!analysisText || analysisText.length < 100) {
      setThirdOrderTakeaways([]);
      generatedTakeawaysRef.current.third = null;
      return;
    }
    
    if (generatedTakeawaysRef.current.third !== analysisText) {
      generatedTakeawaysRef.current.third = analysisText;
      setLoadingTakeaways(prev => ({ ...prev, third: true }));
      api.generateKeyTakeaways(analysisText, 'third', token)
        .then(result => {
          setThirdOrderTakeaways(result.takeaways || []);
        })
        .catch(error => {
          console.error('Error generating third-order takeaways:', error);
          setThirdOrderTakeaways([]);
          generatedTakeawaysRef.current.third = null;
        })
        .finally(() => {
          setLoadingTakeaways(prev => ({ ...prev, third: false }));
        });
    }
  }, [thirdOrderData, token]);

  useEffect(() => {
    if (!recommendationsData) {
      setRecommendationsTakeaways([]);
      generatedTakeawaysRef.current.recommendations = null;
      return;
    }
    
    const analysisText = typeof recommendationsData === 'string' ? recommendationsData : (recommendationsData?.analysis || '');
    if (!analysisText || analysisText.length < 100) {
      setRecommendationsTakeaways([]);
      generatedTakeawaysRef.current.recommendations = null;
      return;
    }
    
    if (generatedTakeawaysRef.current.recommendations !== analysisText) {
      generatedTakeawaysRef.current.recommendations = analysisText;
      setLoadingTakeaways(prev => ({ ...prev, recommendations: true }));
      api.generateKeyTakeaways(analysisText, 'recommendations', token)
        .then(result => {
          setRecommendationsTakeaways(result.takeaways || []);
        })
        .catch(error => {
          console.error('Error generating recommendations takeaways:', error);
          setRecommendationsTakeaways([]);
          generatedTakeawaysRef.current.recommendations = null;
        })
        .finally(() => {
          setLoadingTakeaways(prev => ({ ...prev, recommendations: false }));
        });
    }
  }, [recommendationsData, token]);

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

      <div className={`second-order-content ${isGuest ? 'guest-mode' : ''}`}>
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
            aria-label="Back to Home"
          >
            <ArrowBack style={{ fontSize: 24 }} />
          </button>

          <div className="second-order-title-section">
            <div className="second-order-icon-large">
              <Network style={{ fontSize: 20 }} />
            </div>
            <h1 className="second-order-title">Second-Order Effect Analyzer</h1>
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
                placeholder="Describe the problem you're trying to solve..."
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
                placeholder="Describe your proposed solution or product decision..."
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
                  <Network style={{ fontSize: 20 }} />
                  Analyze Impacts
                </>
              )}
            </button>

            {/* Recommended Examples - Always visible below CTA */}
            <div className="recommended-chips-container">
              <span className="chips-label">Try:</span>
              <div className="recommended-chips">
                {[
                  {
                    problem: "Users complain about 5-second page load times, causing 30% bounce rate on mobile",
                    solution: "Implement aggressive caching, CDN, and lazy loading to reduce load times to under 2 seconds"
                  },
                  {
                    problem: "Freemium conversion rate stuck at 2% despite 50K free users, need to hit 5% to be profitable",
                    solution: "Add paywall after 10 document exports and limit free tier to 5 projects instead of unlimited"
                  },
                  {
                    problem: "Competitors launched AI features and we're losing enterprise deals, sales team reports 40% of lost deals mention AI",
                    solution: "Build AI-powered auto-complete feature that learns from user patterns and suggests next actions"
                  }
                ].map((example, index) => (
                  <button
                    key={index}
                    className="recommended-chip"
                    onClick={() => {
                      setProblem(example.problem);
                      setSolution(example.solution);
                    }}
                    disabled={loading}
                    type="button"
                  >
                    <div className="chip-content">
                      <div className="chip-line">
                        <span className="chip-label">Problem:</span> {example.problem}
                      </div>
                      <div className="chip-line">
                        <span className="chip-label">Solution:</span> {example.solution}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
                {/* Key Takeaways */}
                {loadingTakeaways.first ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-loading">
                      <Loader2 className="spinner" style={{ width: 16, height: 16 }} />
                      <span>Generating key takeaways...</span>
                    </div>
                  </div>
                ) : firstOrderTakeaways.length > 0 ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-list">
                      {firstOrderTakeaways.map((takeaway, index) => (
                        <div key={index} className="takeaway-item">
                          <div className="takeaway-bullet"></div>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <div className="analysis-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof firstOrderData === 'string' ? firstOrderData : (firstOrderData?.analysis || '')}</ReactMarkdown>
                </div>
                
                {/* Loading indicator for Stage 2 - inline, like LLMCouncil */}
                {loadingStage === 'stage2' && (
                  <div className="stage-loading">
                    <Loader2 className="spinner" />
                    <span>Running Stage 2: Analyzing second-order impacts...</span>
                  </div>
                )}
                
                {/* Stage 2 content - appears after loading */}
                {secondOrderData && (
                  <div className="stage-content">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleNavigateToStage('stage2')}
                        className="primary-button"
                      >
                        View Second-Order Impacts
                        <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                      </button>
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
                {/* Key Takeaways */}
                {loadingTakeaways.second ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-loading">
                      <Loader2 className="spinner" style={{ width: 16, height: 16 }} />
                      <span>Generating key takeaways...</span>
                    </div>
                  </div>
                ) : secondOrderTakeaways.length > 0 ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-list">
                      {secondOrderTakeaways.map((takeaway, index) => (
                        <div key={index} className="takeaway-item">
                          <div className="takeaway-bullet"></div>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <div className="analysis-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof secondOrderData === 'string' ? secondOrderData : (secondOrderData?.analysis || '')}</ReactMarkdown>
                </div>
                
                {/* Loading indicator for Stage 3 - inline, like LLMCouncil */}
                {loadingStage === 'stage3' && (
                  <div className="stage-loading">
                    <Loader2 className="spinner" />
                    <span>Running Stage 3: Analyzing third-order impacts...</span>
                  </div>
                )}
                
                {/* Stage 3 content - appears after loading */}
                {thirdOrderData && (
                  <div className="stage-content">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleNavigateToStage('stage3')}
                        className="primary-button"
                      >
                        View Third-Order Impacts
                        <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                      </button>
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
                {/* Key Takeaways */}
                {loadingTakeaways.third ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-loading">
                      <Loader2 className="spinner" style={{ width: 16, height: 16 }} />
                      <span>Generating key takeaways...</span>
                    </div>
                  </div>
                ) : thirdOrderTakeaways.length > 0 ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-list">
                      {thirdOrderTakeaways.map((takeaway, index) => (
                        <div key={index} className="takeaway-item">
                          <div className="takeaway-bullet"></div>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <div className="analysis-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof thirdOrderData === 'string' ? thirdOrderData : (thirdOrderData?.analysis || '')}</ReactMarkdown>
                </div>
                
                {/* Loading indicator for Stage 4 - inline, like LLMCouncil */}
                {loadingStage === 'stage4' && (
                  <div className="stage-loading">
                    <Loader2 className="spinner" />
                    <span>Running Stage 4: Generating recommendations...</span>
                  </div>
                )}
                
                {/* Stage 4 content - appears after loading */}
                {recommendationsData && (
                  <div className="stage-content">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleNavigateToStage('stage4')}
                        className="primary-button"
                      >
                        View Recommendations
                        <ArrowForward style={{ fontSize: 18, marginLeft: 8 }} />
                      </button>
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
                {/* Key Takeaways */}
                {loadingTakeaways.recommendations ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-loading">
                      <Loader2 className="spinner" style={{ width: 16, height: 16 }} />
                      <span>Generating key takeaways...</span>
                    </div>
                  </div>
                ) : recommendationsTakeaways.length > 0 ? (
                  <div className="key-takeaways">
                    <h3 className="takeaways-title">Key Takeaways</h3>
                    <div className="takeaways-list">
                      {recommendationsTakeaways.map((takeaway, index) => (
                        <div key={index} className="takeaway-item">
                          <div className="takeaway-bullet"></div>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                <div className="analysis-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof recommendationsData === 'string' ? recommendationsData : (recommendationsData?.analysis || '')}</ReactMarkdown>
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

        <div className="footer">
          <p>
            Based on{' '}
            <a 
              href="https://docs.google.com/document/d/131dyBmW1EBl0hxbkahLthFNiRRLdK-o5CMz0EgF00u0/edit?tab=t.0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              The Second-Order Toolkit: An Operational Manual for Strategic Impact Analysis in Product Management
            </a>
          </p>
          <p>Analyzing cascading consequences and unintended outcomes</p>
        </div>
      </div>
    </div>
  );
};

export default SecondOrderAnalyzer;
