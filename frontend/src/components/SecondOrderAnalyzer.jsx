import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { Plus, X, ChevronRight, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConversationHistory from './ConversationHistory';
import { api } from '../api';
import './SecondOrderAnalyzer.css';

const SecondOrderAnalyzer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading: authLoading } = useAuth();
  const isGuest = !token;
  const conversationHistoryRef = useRef(null);

  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [effects, setEffects] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEffects, setExpandedEffects] = useState(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [conversationId, setConversationId] = useState(null);

  const generateEffectChain = async () => {
    if (!problem.trim() || !solution.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setEffects([]);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      const url = `${apiBase}/api/openrouter/chat`;
      
      // Use OpenRouter API via backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [
            {
              role: 'user',
              content: `You are analyzing second-order and third-order effects. Your response must be ONLY valid JSON with no additional text, explanations, or markdown formatting.

Problem: ${problem}
Solution: ${solution}

Generate a comprehensive effect chain with:
- 3-5 first-order effects (immediate, direct consequences)
- For each first-order effect, generate 2-3 second-order effects (indirect consequences)
- For key second-order effects, generate 1-2 third-order effects (long-term consequences)

Each effect must be categorized as "positive", "negative", or "neutral".

Your response must be ONLY this JSON structure with no other text before or after:
{
  "effects": [
    {
      "text": "Description of first order effect",
      "type": "positive",
      "children": [
        {
          "text": "Description of second order effect",
          "type": "negative",
          "children": [
            {
              "text": "Description of third order effect",
              "type": "neutral"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No preamble, no explanation, no markdown code blocks.`
            }
          ]
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate effects';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error?.message || errorMessage;
        } catch (e) {
          if (response.status === 404) {
            errorMessage = `Endpoint not found. Please restart the backend server to register the new endpoint.`;
      } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Extract the text content from the response
      let textContent = data.content || '';
      
      // Handle if content is an array (some APIs return array format)
      if (Array.isArray(textContent)) {
        textContent = textContent.map(item => 
          typeof item === 'string' ? item : item.text || ''
        ).join('');
      }
      
      if (typeof textContent !== 'string') {
        textContent = String(textContent || '');
      }

      console.log('Raw API Response:', textContent);

      // Clean up the response - remove markdown code fences and any extra text
      textContent = textContent.trim();
      
      // Remove markdown code blocks if present
      textContent = textContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object in the response - look for the outermost braces
      let startIndex = textContent.indexOf('{');
      let endIndex = textContent.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        console.error('No JSON found in response');
        throw new Error('Invalid response format - no JSON object found');
      }
      
      let cleanJson = textContent.substring(startIndex, endIndex + 1);
      
      console.log('Extracted JSON:', cleanJson);
      
      // Parse the JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Attempted to parse:', cleanJson);
        throw new Error('Failed to parse the response. The AI may have returned invalid JSON. Please try again.');
      }

      if (!parsed.effects || !Array.isArray(parsed.effects)) {
        console.error('Invalid structure:', parsed);
        throw new Error('Response is missing the effects array');
      }

      if (parsed.effects.length === 0) {
        throw new Error('No effects were generated. Please try again.');
      }

      // Transform the parsed data into our internal format with IDs
      const addIds = (effectsList, order = 1, parentId = null) => {
        return effectsList.map((effect, index) => ({
          id: Date.now() + Math.random() + index,
          text: effect.text,
          type: effect.type || 'neutral',
          order,
          parent: parentId,
          children: effect.children ? addIds(effect.children, order + 1, effect.id) : []
        }));
      };

      const effectsWithIds = addIds(parsed.effects);
      setEffects(effectsWithIds);

      // Save conversation if authenticated
      console.log('Save check - isGuest:', isGuest, 'hasToken:', !!token);
      if (!isGuest && token) {
        console.log('Attempting to save conversation...');
        try {
          let currentConversationId = conversationId;
          if (!currentConversationId) {
            const conversation = await api.createConversation(token);
            currentConversationId = conversation.id;
            setConversationId(currentConversationId);
          }
          
          // Save user message with problem and solution
          const userMessage = `Problem: ${problem}\n\nSolution: ${solution}`;
          await api.addUserMessage(currentConversationId, userMessage, token);
          
          // Save assistant response with structured data
          const assistantMessage = {
            type: 'second_order_effects',
            effects: parsed.effects,
            problem: problem,
            solution: solution
          };
          console.log('Saving assistant message with effects:', assistantMessage);
          console.log('Conversation ID:', currentConversationId);
          try {
            await api.addAssistantMessage(currentConversationId, JSON.stringify(assistantMessage), token);
            console.log('Assistant message saved successfully');
          } catch (assistantError) {
            console.error('Failed to save assistant message:', assistantError);
            throw assistantError; // Re-throw to trigger outer catch
          }
          
          // Update conversation title
          try {
            const title = problem.length > 50 ? problem.substring(0, 50) + '...' : problem;
            console.log('Updating conversation title to:', title, 'for conversation:', currentConversationId);
            const titleResponse = await api.updateConversationTitle(currentConversationId, title, token);
            console.log('Title update response:', titleResponse);
            
            // Small delay to ensure backend has saved the title
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Refresh conversation list to show updated title (force fresh fetch to bypass cache)
            console.log('Refreshing conversation list...');
            if (conversationHistoryRef.current?.loadConversations) {
              await conversationHistoryRef.current.loadConversations(true);
              console.log('Conversation list refreshed');
            } else {
              console.error('conversationHistoryRef.current is null or loadConversations not available');
            }
          } catch (titleError) {
            console.error('Failed to update title:', titleError);
          }
        } catch (saveError) {
          console.error('Failed to save conversation:', saveError);
          // Don't throw - analysis succeeded even if save failed
        }
      }

    } catch (err) {
      console.error('Error generating effects:', err);
      setError(err.message || 'Failed to generate effect chain. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAnalysis = () => {
    setProblem('');
    setSolution('');
    setEffects([]);
    setError(null);
    setExpandedEffects(new Set());
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setConversationId(null);
  };

  const toggleExpand = (effectId) => {
    const clickedEffect = effects.find(e => e.id === effectId);
    
    if (clickedEffect && clickedEffect.order === 1) {
      if (expandedEffects.has(effectId)) {
        setExpandedEffects(new Set());
      } else {
        setExpandedEffects(new Set([effectId]));
      }
    } else {
      const newExpanded = new Set(expandedEffects);
      if (newExpanded.has(effectId)) {
        newExpanded.delete(effectId);
        effects.forEach(firstOrder => {
          firstOrder.children?.forEach(secondOrder => {
            if (secondOrder.id === effectId) {
              secondOrder.children?.forEach(thirdOrder => {
                newExpanded.delete(thirdOrder.id);
              });
            }
          });
        });
      } else {
        newExpanded.add(effectId);
      }
      setExpandedEffects(newExpanded);
    }
  };

  const handleLoadConversation = async (conversation) => {
    try {
      setError(null);
      setIsGenerating(false);
      
      // If conversation doesn't have messages, fetch the full conversation
      let fullConversation = conversation;
      if (!conversation.messages || conversation.messages.length === 0) {
        try {
          fullConversation = await api.getConversation(conversation.id, token);
        } catch (fetchError) {
          console.error('Failed to fetch full conversation:', fetchError);
          setError('Failed to load conversation details.');
          return;
        }
      }
      
      setConversationId(fullConversation.id);
      
      // Find user message
      const userMessage = fullConversation.messages?.find(msg => msg.role === 'user');
      if (userMessage?.content) {
        const content = userMessage.content;
        const problemMatch = content.match(/Problem:\s*(.+?)(?:\n\nSolution:|$)/s);
        const solutionMatch = content.match(/Solution:\s*(.+?)$/s);
        if (problemMatch) setProblem(problemMatch[1].trim());
        if (solutionMatch) setSolution(solutionMatch[1].trim());
      }
      
      // Find assistant message with second-order effects
      // Check all assistant messages, not just the first one
      const assistantMessages = fullConversation.messages?.filter(
        msg => msg.role === 'assistant' && msg.content
      ) || [];
      
      console.log('Found', assistantMessages.length, 'assistant messages');
      
      let assistantMessage = null;
      let parsed = null;
      
      // Try to find a message with second_order_effects
      for (const msg of assistantMessages) {
        try {
          const testParsed = JSON.parse(msg.content);
          if (testParsed.type === 'second_order_effects' && testParsed.effects && Array.isArray(testParsed.effects) && testParsed.effects.length > 0) {
            assistantMessage = msg;
            parsed = testParsed;
          break;
          }
        } catch (e) {
          // Not JSON or not our format, continue
        }
      }
      
      // If not found, try fallback: any message with effects array
      if (!assistantMessage) {
        for (const msg of assistantMessages) {
          try {
            const testParsed = JSON.parse(msg.content);
            if (testParsed.effects && Array.isArray(testParsed.effects) && testParsed.effects.length > 0) {
              assistantMessage = msg;
              parsed = testParsed;
              break;
            }
          } catch (e) {
            // Not JSON or not our format, continue
          }
        }
      }
      
      if (assistantMessage?.content && parsed) {
        console.log('Parsed assistant message:', { type: parsed.type, hasEffects: !!parsed.effects, effectsCount: parsed.effects?.length });
        
        if (parsed.type === 'second_order_effects' && parsed.effects && Array.isArray(parsed.effects) && parsed.effects.length > 0) {
          // Restore problem and solution if available (they might be more accurate)
          if (parsed.problem) setProblem(parsed.problem);
          if (parsed.solution) setSolution(parsed.solution);
          
          // Restore effects
          const addIds = (effectsList, order = 1, parentId = null) => {
            return effectsList.map((effect, index) => {
              const effectId = Date.now() + Math.random() * 1000 + index;
              return {
                id: effectId,
                text: effect.text,
                type: effect.type || 'neutral',
                order,
                parent: parentId,
                children: effect.children ? addIds(effect.children, order + 1, effectId) : []
              };
            });
          };
          const restoredEffects = addIds(parsed.effects);
          console.log('Restored effects:', restoredEffects.length, 'effects');
          setEffects(restoredEffects);
          
          // Reset view
          setZoom(1);
          setPan({ x: 0, y: 0 });
          setExpandedEffects(new Set());
        } else if (parsed.effects && Array.isArray(parsed.effects) && parsed.effects.length > 0) {
          // Fallback for old format (just effects array without type field)
          console.log('Found effects array without type field, using fallback format');
          if (parsed.problem) setProblem(parsed.problem);
          if (parsed.solution) setSolution(parsed.solution);
          
          const addIds = (effectsList, order = 1, parentId = null) => {
            return effectsList.map((effect, index) => {
              const effectId = Date.now() + Math.random() * 1000 + index;
              return {
                id: effectId,
                text: effect.text,
                type: effect.type || 'neutral',
                order,
                parent: parentId,
                children: effect.children ? addIds(effect.children, order + 1, effectId) : []
              };
            });
          };
          const restoredEffects = addIds(parsed.effects);
          console.log('Restored effects (fallback format):', restoredEffects.length, 'effects');
          setEffects(restoredEffects);
          
          // Reset view
          setZoom(1);
          setPan({ x: 0, y: 0 });
          setExpandedEffects(new Set());
      } else {
          console.warn('No valid effects found in conversation data:', parsed);
          setError('No effects data found in this conversation.');
        }
      } else {
        console.warn('No assistant message found in conversation');
        // Check if there are any messages at all
        if (fullConversation.messages && fullConversation.messages.length > 0) {
          console.log('Available messages:', fullConversation.messages.map(m => ({ 
            role: m.role, 
            hasContent: !!m.content, 
            contentType: typeof m.content,
            contentPreview: m.content ? m.content.substring(0, 100) : 'none'
          })));
        }
        setError('No analysis data found in this conversation.');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation.');
    }
  };

  useEffect(() => {
    if (location.state?.conversation) {
      handleLoadConversation(location.state.conversation);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Radial flowchart component
  const RadialFlowchart = () => {
    const [hoveredEffect, setHoveredEffect] = useState(null);
    const [cursorStyle, setCursorStyle] = useState('grab');
    const containerRef = React.useRef(null);
    const isPanningRef = React.useRef(false);
    const panStartRef = React.useRef({ x: 0, y: 0 });
    const isDraggingRef = React.useRef(false);
    const panRef = React.useRef(pan);
    const zoomRef = React.useRef(zoom);

    // Keep refs in sync with state
    React.useEffect(() => {
      panRef.current = pan;
      zoomRef.current = zoom;
    }, [pan, zoom]);

    const nudgePan = (dx, dy) => {
      setPan({
        x: panRef.current.x + dx,
        y: panRef.current.y + dy
      });
    };

    const handleMouseDown = (e) => {
      // Check if clicking on an effect box or its children
      const isEffectBox = e.target.closest('[data-effect-box]');
      if (isEffectBox) {
        isDraggingRef.current = false;
        isPanningRef.current = false;
        return;
      }
      
      // Check if clicking on controls
      if (e.target.closest('.zoom-controls') || e.target.closest('.flowchart-instructions')) {
        return;
      }
      
      if (e.button === 0) {
        isDraggingRef.current = false;
        isPanningRef.current = true;
        panStartRef.current = { 
          x: e.clientX - panRef.current.x, 
          y: e.clientY - panRef.current.y 
        };
        setCursorStyle('grabbing');
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleMouseMove = (e) => {
      if (isPanningRef.current) {
        const currentX = e.clientX - panStartRef.current.x;
        const currentY = e.clientY - panStartRef.current.y;
        const deltaX = Math.abs(currentX - panRef.current.x);
        const deltaY = Math.abs(currentY - panRef.current.y);
        
        // Only consider it dragging if moved more than 3 pixels
        if (deltaX > 3 || deltaY > 3) {
          isDraggingRef.current = true;
        }
        
        if (isDraggingRef.current) {
          setPan({ x: currentX, y: currentY });
        }
        e.preventDefault();
      }
    };

    const handleMouseUp = (e) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setCursorStyle('grab');
        // Small delay to prevent click from firing after drag
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      }
    };

    const resetView = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setExpandedEffects(new Set());
    };

    const getFirstOrderEffects = () => {
      return effects.filter(e => e.order === 1);
    };

    const getNodePosition = (index, total, radius) => {
      const angle = (index * 360) / total - 90;
      const radian = (angle * Math.PI) / 180;
      return {
        x: radius * Math.cos(radian),
        y: radius * Math.sin(radian),
        angle
      };
    };

    const getChildPosition = (parentPos, childIndex, totalChildren, radius) => {
      const maxSpread = Math.min(90, totalChildren * 30);
      const angleOffset = (childIndex - (totalChildren - 1) / 2) * (maxSpread / Math.max(totalChildren - 1, 1));
      const childAngle = parentPos.angle + angleOffset;
      const radian = (childAngle * Math.PI) / 180;
      
      return {
        x: radius * Math.cos(radian),
        y: radius * Math.sin(radian),
        angle: childAngle
      };
    };

    const firstOrderEffects = getFirstOrderEffects();

    const typeColors = {
      positive: 'from-emerald-500/30 to-emerald-600/20 border-emerald-400/60',
      negative: 'from-rose-500/30 to-rose-600/20 border-rose-400/60',
      neutral: 'from-amber-500/30 to-amber-600/20 border-amber-400/60'
    };

    const typeIconsLarge = {
      positive: <TrendingUp size={20} className="text-emerald-400" />,
      negative: <AlertTriangle size={20} className="text-rose-400" />,
      neutral: <Lightbulb size={20} className="text-amber-400" />
    };

    const hasChildren = (effect) => {
      return effect.children && effect.children.length > 0;
    };

    return (
      <div className="radial-flowchart-container">
        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.min(2, zoom + 0.2))} title="Zoom In">+</button>
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} title="Zoom Out">−</button>
          <button onClick={resetView} title="Reset View">Reset</button>
          <div className="zoom-display">{Math.round(zoom * 100)}%</div>
          <div className="control-divider" />
          <div className="pan-controls">
            <button onClick={() => nudgePan(80, 0)} title="Pan Left" aria-label="Pan left">←</button>
            <button onClick={() => nudgePan(0, 80)} title="Pan Up" aria-label="Pan up">↑</button>
            <button onClick={() => nudgePan(0, -80)} title="Pan Down" aria-label="Pan down">↓</button>
            <button onClick={() => nudgePan(-80, 0)} title="Pan Right" aria-label="Pan right">→</button>
          </div>
        </div>

        {/* Chart Container */}
        <div 
          ref={containerRef}
          className="flowchart-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            cursor: cursorStyle
          }}
        >
          <div
            className="flowchart-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="flowchart-inner">
              <svg className="flowchart-svg">
                {/* Draw concentric circles */}
                <circle cx="50%" cy="50%" r="250" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                <circle cx="50%" cy="50%" r="480" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                <circle cx="50%" cy="50%" r="680" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                
                {/* Draw connection lines */}
                {firstOrderEffects.map((firstOrder, firstIndex) => {
                  const firstPos = getNodePosition(firstIndex, firstOrderEffects.length, 250);
                  
                  return (
                    <g key={`lines-${firstOrder.id}`}>
                      <line
                        x1="50%"
                        y1="50%"
                        x2={`calc(50% + ${firstPos.x}px)`}
                        y2={`calc(50% + ${firstPos.y}px)`}
                        stroke="rgba(6, 182, 212, 0.3)"
                        strokeWidth="2"
                      />
                      
                      {expandedEffects.has(firstOrder.id) && firstOrder.children?.map((secondOrder, secondIndex) => {
                        const secondPos = getChildPosition(firstPos, secondIndex, firstOrder.children.length, 480);
                        
                        return (
                          <g key={`line-${firstOrder.id}-${secondOrder.id}`}>
                            <line
                              x1={`calc(50% + ${firstPos.x}px)`}
                              y1={`calc(50% + ${firstPos.y}px)`}
                              x2={`calc(50% + ${secondPos.x}px)`}
                              y2={`calc(50% + ${secondPos.y}px)`}
                              stroke="rgba(6, 182, 212, 0.3)"
                              strokeWidth="2"
                              className="animate-draw-line"
                            />
                            
                            {expandedEffects.has(secondOrder.id) && secondOrder.children?.map((thirdOrder, thirdIndex) => {
                              const thirdPos = getChildPosition(secondPos, thirdIndex, secondOrder.children.length, 680);
                              return (
                                <line
                                  key={`line-${secondOrder.id}-${thirdOrder.id}`}
                                  x1={`calc(50% + ${secondPos.x}px)`}
                                  y1={`calc(50% + ${secondPos.y}px)`}
                                  x2={`calc(50% + ${thirdPos.x}px)`}
                                  y2={`calc(50% + ${thirdPos.y}px)`}
                                  stroke="rgba(6, 182, 212, 0.3)"
                                  strokeWidth="2"
                                  className="animate-draw-line"
                                />
                              );
                            })}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              {/* Center node - Problem/Solution */}
              <div className="center-node">
                <div className="center-card">
                  <div className="center-label">Solution</div>
                  <p className="center-text">{solution}</p>
                </div>
              </div>

              {/* First order effects */}
              {firstOrderEffects.map((effect, index) => {
                const pos = getNodePosition(index, firstOrderEffects.length, 250);
                const isExpanded = expandedEffects.has(effect.id);
                const canExpand = hasChildren(effect);
                
                return (
                  <div
                    key={effect.id}
                    className="effect-node first-order"
                    style={{
                      left: `calc(50% + ${pos.x}px)`,
                      top: `calc(50% + ${pos.y}px)`,
                    }}
                    onMouseEnter={() => setHoveredEffect(effect.id)}
                    onMouseLeave={() => setHoveredEffect(null)}
                  >
                    <div 
                      data-effect-box="true"
                      className={`effect-card ${typeColors[effect.type]} ${hoveredEffect === effect.id ? 'hovered' : ''} ${isExpanded ? 'expanded' : ''}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        isDraggingRef.current = false;
                        isPanningRef.current = false;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Only toggle if we didn't drag
                        setTimeout(() => {
                          if (!isDraggingRef.current && canExpand) {
                            toggleExpand(effect.id);
                          }
                        }, 0);
                      }}
                    >
                      <div className="effect-header">
                        <div className="effect-icon-label">
                          {typeIconsLarge[effect.type]}
                          <div className="effect-order-label">1st Order</div>
                        </div>
                        {canExpand && (
                          <ChevronRight 
                            size={16} 
                            className={`chevron ${isExpanded ? 'rotated' : ''}`}
                          />
                        )}
                      </div>
                      <p className="effect-text">{effect.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Second order effects */}
              {firstOrderEffects.map((firstOrder, firstIndex) => {
                if (!expandedEffects.has(firstOrder.id)) return null;
                
                const firstPos = getNodePosition(firstIndex, firstOrderEffects.length, 250);
                
                return firstOrder.children?.map((secondOrder, secondIndex) => {
                  const pos = getChildPosition(firstPos, secondIndex, firstOrder.children.length, 480);
                  const isExpanded = expandedEffects.has(secondOrder.id);
                  const canExpand = hasChildren(secondOrder);
                  
                  return (
                    <div
                      key={secondOrder.id}
                      className="effect-node second-order"
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `calc(50% + ${pos.y}px)`,
                      }}
                      onMouseEnter={() => setHoveredEffect(secondOrder.id)}
                      onMouseLeave={() => setHoveredEffect(null)}
                    >
                      <div 
                        data-effect-box="true"
                        className={`effect-card ${typeColors[secondOrder.type]} ${hoveredEffect === secondOrder.id ? 'hovered' : ''} ${isExpanded ? 'expanded' : ''}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          isDraggingRef.current = false;
                          isPanningRef.current = false;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimeout(() => {
                            if (!isDraggingRef.current && canExpand) {
                              toggleExpand(secondOrder.id);
                            }
                          }, 0);
                        }}
                      >
                        <div className="effect-header">
                          <div className="effect-icon-label">
                            {typeIconsLarge[secondOrder.type]}
                            <div className="effect-order-label">2nd Order</div>
                          </div>
                          {canExpand && (
                            <ChevronRight 
                              size={16} 
                              className={`chevron ${isExpanded ? 'rotated' : ''}`}
                            />
                          )}
                        </div>
                        <p className="effect-text">{secondOrder.text}</p>
                      </div>
                    </div>
                  );
                });
              })}

              {/* Third order effects */}
              {firstOrderEffects.map((firstOrder, firstIndex) => {
                if (!expandedEffects.has(firstOrder.id)) return null;
                
                const firstPos = getNodePosition(firstIndex, firstOrderEffects.length, 250);
                
                return firstOrder.children?.map((secondOrder, secondIndex) => {
                  if (!expandedEffects.has(secondOrder.id)) return null;
                  
                  const secondPos = getChildPosition(firstPos, secondIndex, firstOrder.children.length, 480);
                  
                  return secondOrder.children?.map((thirdOrder, thirdIndex) => {
                    const pos = getChildPosition(secondPos, thirdIndex, secondOrder.children.length, 680);
                    
                    return (
                      <div
                        key={thirdOrder.id}
                        className="effect-node third-order"
                        style={{
                          left: `calc(50% + ${pos.x}px)`,
                          top: `calc(50% + ${pos.y}px)`,
                        }}
                        onMouseEnter={() => setHoveredEffect(thirdOrder.id)}
                        onMouseLeave={() => setHoveredEffect(null)}
                      >
                        <div 
                          data-effect-box="true"
                          className={`effect-card ${typeColors[thirdOrder.type]} ${hoveredEffect === thirdOrder.id ? 'hovered' : ''}`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            isDraggingRef.current = false;
                            isPanningRef.current = false;
                          }}
                        >
                          <div className="effect-header">
                            <div className="effect-icon-label">
                              {typeIconsLarge[thirdOrder.type]}
                              <div className="effect-order-label">3rd Order</div>
                            </div>
                          </div>
                          <p className="effect-text">{thirdOrder.text}</p>
                        </div>
                      </div>
                    );
                  });
                });
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="second-order-container">
        <div className="second-order-content">
          <div className="loading-state">
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="second-order-container">
      {!isGuest && (
        <ConversationHistory
          ref={conversationHistoryRef}
          onSelectConversation={handleLoadConversation}
          onNewConversation={resetAnalysis}
          currentConversationId={conversationId}
        />
      )}

      <div className={`second-order-content ${isGuest ? 'guest-mode' : ''}`}>
        {error && (
          <div className="error-message">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Section */}
        {effects.length === 0 && (
          <div className="input-card">
            <div className="input-card-header">
              <button
                onClick={() => navigate('/')}
                className="input-back-button"
                title="Back to Home"
                aria-label="Back to Home"
              >
                <ArrowBack style={{ fontSize: 18 }} />
              </button>
              <h2 className="input-card-title">Second-Order Effect Analyzer</h2>
            </div>
            <div className="input-group">
              <label>Problem Statement</label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g., Employee burnout is increasing and affecting productivity"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div className="input-group">
              <label>Proposed Solution</label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="e.g., Implement a 4-day work week for all employees"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={generateEffectChain}
              disabled={!problem.trim() || !solution.trim() || isGenerating}
              className="analyze-button"
            >
              {isGenerating ? (
                <>
                  <div className="spinner-small" />
                  Analyzing Impacts...
                </>
              ) : (
                <>
                  <Lightbulb size={20} />
                  Analyze Impacts
                </>
              )}
            </button>

            {/* Example Scenarios */}
            {!isGenerating && (
              <div className="examples-section">
                <div className="examples-label">Try:</div>
                <div className="examples-grid">
                  <button
                    onClick={() => {
                      setProblem('Heavy traffic congestion on the main artery of a growing city.');
                      setSolution('Expand the 4-lane highway to 8 lanes.');
                    }}
                    className="example-card"
                  >
                    <div className="example-line">
                      <span className="example-label">Problem:</span> Heavy traffic congestion on the main artery of a growing city.
                      </div>
                    <div className="example-line">
                      <span className="example-label">Solution:</span> Expand the 4-lane highway to 8 lanes.
                    </div>
                  </button>

                <button
                    onClick={() => {
                      setProblem('Management feels remote employees are becoming disengaged and distracted during meetings.');
                      setSolution('A strict "cameras must always be on" policy for every internal meeting.');
                    }}
                    className="example-card"
                  >
                    <div className="example-line">
                      <span className="example-label">Problem:</span> Management feels remote employees are becoming disengaged and distracted during meetings.
            </div>
                    <div className="example-line">
                      <span className="example-label">Solution:</span> A strict "cameras must always be on" policy for every internal meeting.
            </div>
                      </button>

              <button
                    onClick={() => {
                      setProblem('A social media platform is losing daily active users to competitors.');
                      setSolution('Change the feed algorithm to prioritize content that generates the highest number of comments and shares.');
                    }}
                    className="example-card"
                  >
                    <div className="example-line">
                      <span className="example-label">Problem:</span> A social media platform is losing daily active users to competitors.
              </div>
                    <div className="example-line">
                      <span className="example-label">Solution:</span> Change the feed algorithm to prioritize content that generates the highest number of comments and shares.
            </div>
                      </button>
                    </div>
                  </div>
                )}
          </div>
        )}

        {/* Effects Visualization */}
        {effects.length > 0 && (
          <div className="visualization-section">
            <div className="context-card">
              <div className="context-title">Analysis Context</div>
              <div className="context-content">
                <div>
                  <strong>Problem:</strong> {problem}
                </div>
                <div>
                  <strong>Solution:</strong> {solution}
                </div>
              </div>
            </div>

            <div className="visualization-header">
              <div className="header-left">
                <ChevronRight className="header-icon" size={24} />
                <h2>Effect Chain Analysis</h2>
            </div>
              <button onClick={resetAnalysis} className="reset-button">
                <X size={18} />
                    New Analysis
                  </button>
                </div>
            
            <RadialFlowchart />
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondOrderAnalyzer;
