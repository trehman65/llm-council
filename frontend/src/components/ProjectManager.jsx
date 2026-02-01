import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Icons = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Folder: () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Bold: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  Italic: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  Heading: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>,
  List: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Image: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Link: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  FileText: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ExternalLink: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);

  // Configure DOMPurify to allow safe HTML elements
  const sanitizeConfig = {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel'],
    ADD_ATTR: ['target'], // Allow target attribute for links
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Sanitize content before setting innerHTML
      editorRef.current.innerHTML = DOMPurify.sanitize(value || '', sanitizeConfig);
    }
  }, []);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  };

  const execCommand = (command, value = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      // Sanitize content before saving
      const sanitizedContent = DOMPurify.sanitize(editorRef.current.innerHTML, sanitizeConfig);
      onChange(sanitizedContent);
    }
  };

  const insertImage = () => {
    saveSelection();
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    saveSelection();
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleToolbarMouseDown = (e) => {
    e.preventDefault();
    saveSelection();
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/60 text-slate-100">
      <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-900/60 flex-wrap">
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Heading 1"
        >
          <span className="font-bold text-sm">H1</span>
        </button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Heading 2"
        >
          <span className="font-bold text-xs">H2</span>
        </button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Heading 3"
        >
          <span className="font-bold text-xs">H3</span>
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Bold"
        >
          <Icons.Bold />
        </button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Italic"
        >
          <Icons.Italic />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Bullet List"
        >
          <Icons.List />
        </button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Numbered List"
        >
          <span className="text-xs font-mono">1.</span>
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={insertImage}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Insert Image"
        >
          <Icons.Image />
        </button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={insertLink}
          className="p-2 hover:bg-slate-800 rounded text-slate-200"
          title="Insert Link"
        >
          <Icons.Link />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={saveSelection}
        onBlur={saveSelection}
        className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none text-slate-100"
        style={{ 
          overflowY: 'auto', 
          maxHeight: '400px',
        }}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] { color: #e2e8f0; }
        [contenteditable] h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        [contenteditable] h2 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] li { margin: 0.25rem 0; }
        [contenteditable] img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5rem 0; }
        [contenteditable] a { color: #4f46e5; text-decoration: underline; }
      `}</style>
    </div>
  );
};

const GanttChart = ({ projects, onSelectProject }) => {
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    today.setDate(1);
    return today;
  });
  
  const projectsWithDates = projects.filter(p => p.startDate);
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const months = [];
  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(viewStart.getFullYear(), viewStart.getMonth() + i, 1);
    months.push({
      date: monthDate,
      name: getMonthName(monthDate),
      days: getDaysInMonth(monthDate)
    });
  }
  
  const totalDays = months.reduce((sum, m) => sum + m.days, 0);
  
  const getBarPosition = (project) => {
    const start = new Date(project.startDate);
    const end = project.endDate ? new Date(project.endDate) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const viewStartTime = viewStart.getTime();
    const viewEndTime = new Date(viewStart.getFullYear(), viewStart.getMonth() + 3, 0).getTime();
    
    const barStart = Math.max(start.getTime(), viewStartTime);
    const barEnd = Math.min(end.getTime(), viewEndTime);
    
    if (barEnd < viewStartTime || barStart > viewEndTime) return null;
    
    const dayWidth = 100 / totalDays;
    const startOffset = (barStart - viewStartTime) / (24 * 60 * 60 * 1000);
    const duration = (barEnd - barStart) / (24 * 60 * 60 * 1000) + 1;
    
    return {
      left: `${startOffset * dayWidth}%`,
      width: `${Math.max(duration * dayWidth, 2)}%`
    };
  };
  
  const healthColors = {
    green: 'bg-gradient-to-r from-emerald-400 to-green-500',
    yellow: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    red: 'bg-gradient-to-r from-red-400 to-rose-500'
  };
  
  const navigateMonth = (direction) => {
    setViewStart(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  return (
    <div className="bg-slate-900/70 rounded-xl shadow-lg overflow-hidden border border-slate-700/60 backdrop-blur text-slate-100">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900/80 to-indigo-900/40">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Project Timeline</h2>
          <p className="text-xs text-slate-400">Track delivery windows across the next 3 months</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-200 border border-slate-800"
          >
            <Icons.ChevronLeft />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center text-slate-200">
            {getMonthName(viewStart)}
          </span>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-200 border border-slate-800"
          >
            <Icons.ChevronRight />
          </button>
        </div>
      </div>
      
      {projectsWithDates.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <p>No projects with dates to display</p>
          <p className="text-sm mt-1">Add start dates to your projects to see them here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-slate-800 bg-slate-900/40">
              <div className="w-48 flex-shrink-0 p-3 font-semibold text-slate-200 border-r border-slate-800">
                Project
              </div>
              <div className="flex-1 flex">
                {months.map((month, idx) => (
                  <div 
                    key={idx} 
                    className="text-center py-2 text-sm font-semibold text-slate-200 border-r border-slate-800 last:border-r-0"
                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex border-b border-slate-800 bg-slate-900/30">
              <div className="w-48 flex-shrink-0 border-r border-slate-800" />
              <div className="flex-1 flex">
                {months.map((month, mIdx) => (
                  <div 
                    key={mIdx} 
                    className="flex border-r border-slate-800 last:border-r-0"
                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                  >
                    {[...Array(month.days)].map((_, d) => (
                      <div 
                        key={d} 
                        className={`flex-1 text-center text-[10px] py-1 text-slate-500 ${d % 7 === 0 ? 'bg-slate-900/50' : ''}`}
                        style={{ minWidth: '20px' }}
                      >
                        {(d + 1) % 5 === 0 ? d + 1 : ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {projectsWithDates.map(project => {
              const barPos = getBarPosition(project);
              return (
                <div 
                  key={project.id} 
                  className="flex border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer"
                  onClick={() => onSelectProject(project)}
                >
                  <div className="w-48 flex-shrink-0 p-3 border-r border-slate-800">
                    <div className="font-semibold text-sm truncate text-slate-100">{project.name}</div>
                    <div className="text-xs text-slate-400">{project.status}</div>
                  </div>
                  <div className="flex-1 relative h-16 flex items-center">
                    {barPos && (
                      <div 
                        className={`absolute h-8 rounded-full ${healthColors[project.health]} shadow-md flex items-center px-3 border border-white/10`}
                        style={{ left: barPos.left, width: barPos.width, minWidth: '80px' }}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {project.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const { token, user, loading: authLoading, openLoginModal } = useAuth();
  const didLoadProjectsRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const [statuses] = useState(['To do', 'Discovery', 'Development', 'Testing', 'A/B test', 'Launched']);
  const emojiOptions = [
    '📁','📂','🗂️','📌','📝','📒','📓','📔','📋','📊','📈','📉','🗓️','⏱️','⏳','🧭','🧪','🧫','🔬','🧰',
    '🛠️','⚙️','🧩','🧠','💡','🔍','🔭','📡','🛰️','🧪','🚀','🛸','💻','🖥️','📱','🧾','✅','🟢','🟡','🔴',
    '🚧','🧯','🧱','🧵','🪡','🔗','📎','📍','📦','🧳','🎯','🏁','📣','📢','🧾','🗒️','🖊️','✏️','🖌️','🎨',
    '📷','🖼️','🎞️','🎥','🎬','🎧','🎵','📚','📖','📄','📃','📑','📜','📰','🗃️','🗄️','📤','📥','📨','✉️'
  ];

  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [draggingProjectId, setDraggingProjectId] = useState(null);

  const EmojiPicker = ({ onSelect }) => (
    <div className="absolute z-20 mt-2 w-72 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg p-2">
      <div className="grid grid-cols-8 gap-1">
        {emojiOptions.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 rounded hover:bg-slate-100 flex items-center justify-center text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [authLoading, user, openLoginModal]);

  useEffect(() => {
    if (!token || !user) {
      setProjects([]);
      return;
    }
    let isCancelled = false;
    const loadProjects = async () => {
      try {
        const result = await api.getMomentumProjects(token);
        if (!isCancelled) {
          setProjects(result.projects || []);
          didLoadProjectsRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load Momentum projects:', error);
        didLoadProjectsRef.current = true;
      }
    };
    loadProjects();
    return () => {
      isCancelled = true;
    };
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || !didLoadProjectsRef.current) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveMomentumProjects(token, projects);
      } catch (error) {
        console.error('Failed to save Momentum projects:', error);
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projects, token, user]);

  const generateId = () => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updateProject = (id, updates) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedProject?.id === id) {
      setSelectedProject(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const toggleTodo = (projectId, todoIndex) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newTodos = [...project.todos];
    newTodos[todoIndex] = { ...newTodos[todoIndex], completed: !newTodos[todoIndex].completed };
    const progress = newTodos.length > 0 ? Math.round((newTodos.filter(t => t.completed).length / newTodos.length) * 100) : 0;
    updateProject(projectId, { todos: newTodos, progress });
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const normalizeUrl = (url) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isEndDateValid = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6 text-slate-100">
      <style>{`
        .project-card { transition: all 0.3s; }
        .project-card:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        .health-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .health-yellow { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .health-red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        input[type="date"] { color-scheme: dark; }
        input[type="date"] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23ffffff' stroke-width='2' viewBox='0 0 24 24'%3E%3Crect x='3' y='4' width='18' height='18' rx='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px 16px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
        }
      `}</style>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900/60 rounded-2xl shadow-lg p-6 border border-slate-700/60 backdrop-blur">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700 bg-slate-900/40 text-slate-200 shadow-sm hover:border-slate-500 hover:text-white hover:shadow"
                title="Back to Home"
              >
                <Icons.ChevronLeft />
              </a>
              <h1 className="text-2xl font-semibold text-slate-100">
                Momentum
              </h1>
            </div>
            <p className="text-slate-400 mt-1 text-sm">Keep product work moving forward</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border border-slate-700 bg-slate-900/40 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
              />
            </div>
            <div className="flex gap-2 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60">
              {['list', 'timeline', 'kanban'].map(v => (
                <button 
                  key={v} 
                  onClick={() => setView(v)} 
                  className={`px-4 py-2 rounded-md ${
                    view === v ? 'bg-slate-900 text-slate-100 shadow-sm font-medium' : 'text-slate-400'
                  }`}
                >
                  {v === 'timeline' ? 'Gantt' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowNewProject(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg"
            >
              <Icons.Plus /> New Project
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {view === 'list' && (
          <div className="bg-slate-900/60 rounded-xl shadow-sm divide-y divide-slate-800 border border-slate-700/60 backdrop-blur">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto text-slate-600 mb-4 flex justify-center"><Icons.Folder /></div>
                <p className="text-slate-300 text-lg">No projects yet</p>
                <p className="text-slate-500">Click "New Project" to start</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => { setSelectedProject(project); setActiveTab('details'); }}
                  className="flex gap-3 px-4 py-4 hover:bg-slate-800/60 cursor-pointer"
                >
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEmojiPicker(activeEmojiPicker === project.id ? null : project.id);
                      }}
                      className="w-12 h-12 rounded-lg border border-slate-700 bg-slate-900/40 flex items-center justify-center text-xl hover:bg-slate-800"
                      title="Change emoji"
                    >
                      {project.emoji || '📁'}
                    </button>
                    {activeEmojiPicker === project.id && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <EmojiPicker
                          onSelect={(emoji) => {
                            updateProject(project.id, { emoji });
                            setActiveEmojiPicker(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title row with progress */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base text-slate-100 leading-tight">{project.name}</h3>
                      <span className="text-sm text-slate-400 font-medium flex-shrink-0">{project.progress}%</span>
                    </div>
                    
                    {/* Meta info - wraps on mobile */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`health-${project.health} w-2 h-2 rounded-full flex-shrink-0`}></span>
                        <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{project.status}</span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Icons.Clock /> {project.startDate}
                      </span>
                      {project.todos.length > 0 && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Icons.CheckCircle /> {project.todos.filter(t => t.completed).length}/{project.todos.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'timeline' && (
          <GanttChart 
            projects={filteredProjects} 
            onSelectProject={(p) => { setSelectedProject(p); setActiveTab('details'); }}
          />
        )}

        {view === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ height: 'calc(100vh - 260px)' }}>
            {statuses.map(status => {
              const statusProjects = filteredProjects.filter(p => p.status === status);
              return (
                <div
                  key={status}
                  className="bg-slate-900/60 rounded-xl shadow-sm border border-slate-700/60 flex flex-col w-80 flex-shrink-0 h-full backdrop-blur"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedId = e.dataTransfer.getData('text/plain');
                    if (droppedId) {
                      updateProject(droppedId, { status });
                    }
                    setDraggingProjectId(null);
                  }}
                >
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200">{status}</span>
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{statusProjects.length}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 min-h-[120px] flex-1">
                    {statusProjects.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-6">No projects</div>
                    ) : (
                      statusProjects.map(project => (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', project.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingProjectId(project.id);
                          }}
                          onDragEnd={() => setDraggingProjectId(null)}
                          onClick={() => { setSelectedProject(project); setActiveTab('details'); }}
                          className={`bg-slate-900 border border-slate-800 rounded-lg p-3 hover:bg-slate-800 cursor-pointer ${
                            draggingProjectId === project.id ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEmojiPicker(activeEmojiPicker === project.id ? null : project.id);
                              }}
                              className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center text-base"
                              title="Change emoji"
                            >
                              {project.emoji || '📁'}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate text-slate-100">{project.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1"><Icons.Clock /> {project.startDate}</span>
                                {project.todos.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Icons.CheckCircle /> {project.todos.filter(t => t.completed).length}/{project.todos.length}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">{project.progress}%</div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                          {activeEmojiPicker === project.id && (
                            <div onClick={(e) => e.stopPropagation()} className="mt-2">
                              <EmojiPicker
                                onSelect={(emoji) => {
                                  updateProject(project.id, { emoji });
                                  setActiveEmojiPicker(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedProject(null)}
          />
          <div
            className="absolute right-0 w-full max-w-5xl bg-slate-900 text-slate-100 shadow-2xl flex flex-col border-l border-slate-700"
            style={{
              top: 'var(--global-header-height)',
              height: 'calc(100vh - var(--global-header-height))',
            }}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'details-header' ? null : 'details-header')}
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-lg flex items-center justify-center"
                    title="Change emoji"
                  >
                    {selectedProject.emoji || '📁'}
                  </button>
                  {activeEmojiPicker === 'details-header' && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        updateProject(selectedProject.id, { emoji });
                        setActiveEmojiPicker(null);
                      }}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <Icons.X />
              </button>
            </div>

            <div className="flex border-b border-slate-800 bg-slate-900/80 overflow-x-auto">
              {['details', 'team', 'tasks', 'notes', 'docs'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 font-medium capitalize transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'text-indigo-300 border-b-2 border-indigo-400 bg-slate-900' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={selectedProject.name}
                      onChange={(e) => updateProject(selectedProject.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <select 
                        value={selectedProject.status} 
                        onChange={(e) => updateProject(selectedProject.id, { status: e.target.value })} 
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Health</label>
                      <select 
                        value={selectedProject.health} 
                        onChange={(e) => updateProject(selectedProject.id, { health: e.target.value })} 
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                      >
                        <option value="green">🟢 Green</option>
                        <option value="yellow">🟡 Yellow</option>
                        <option value="red">🔴 Red</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={selectedProject.startDate} 
                        onChange={(e) => {
                          const newStart = e.target.value;
                          if (!isEndDateValid(newStart, selectedProject.endDate)) {
                            updateProject(selectedProject.id, { startDate: newStart, endDate: '' });
                            alert('End date must be after the start date. End date cleared.');
                            return;
                          }
                          updateProject(selectedProject.id, { startDate: newStart });
                        }} 
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={selectedProject.endDate} 
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          if (!isEndDateValid(selectedProject.startDate, newEnd)) {
                            alert('End date must be after the start date.');
                            return;
                          }
                          updateProject(selectedProject.id, { endDate: newEnd });
                        }} 
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedProject.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                          {tag}
                          <button 
                            onClick={() => updateProject(selectedProject.id, { 
                              tags: selectedProject.tags.filter((_, i) => i !== idx) 
                            })} 
                            className="hover:bg-indigo-500/20 rounded-full"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add tag (press Enter)" 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          updateProject(selectedProject.id, { tags: [...selectedProject.tags, e.target.value.trim()] });
                          e.target.value = '';
                        }
                      }} 
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-800">
                    <button 
                      onClick={() => { deleteProject(selectedProject.id); setSelectedProject(null); }} 
                      className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
                    >
                      <Icons.Trash /> Delete Project
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">P13N PM</label>
                      <input 
                        type="text" 
                        value={selectedProject.team?.p13nPM || ''} 
                        onChange={(e) => updateProject(selectedProject.id, { 
                          team: { ...selectedProject.team, p13nPM: e.target.value } 
                        })} 
                        placeholder="Enter name"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Engineering Lead</label>
                      <input 
                        type="text" 
                        value={selectedProject.team?.engineeringLead || ''} 
                        onChange={(e) => updateProject(selectedProject.id, { 
                          team: { ...selectedProject.team, engineeringLead: e.target.value } 
                        })} 
                        placeholder="Enter name"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">W+ PM</label>
                      <input 
                        type="text" 
                        value={selectedProject.team?.wPlusPM || ''} 
                        onChange={(e) => updateProject(selectedProject.id, { 
                          team: { ...selectedProject.team, wPlusPM: e.target.value } 
                        })} 
                        placeholder="Enter name"
                        className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Other Stakeholders</label>
                    <div className="space-y-2 mb-3">
                      {(selectedProject.team?.otherStakeholders || []).map((stakeholder, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                          <Icons.Users />
                          <span className="flex-1">{stakeholder.name}</span>
                          <span className="text-sm text-slate-400">{stakeholder.role}</span>
                          <button 
                            onClick={() => {
                              const newStakeholders = (selectedProject.team?.otherStakeholders || []).filter((_, i) => i !== idx);
                              updateProject(selectedProject.id, { 
                                team: { ...selectedProject.team, otherStakeholders: newStakeholders } 
                              });
                            }}
                            className="text-red-400 hover:bg-red-500/20 p-1 rounded"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id={`stakeholder-name-${selectedProject.id}`}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                      <input 
                        type="text" 
                        id={`stakeholder-role-${selectedProject.id}`}
                        placeholder="Role"
                        className="flex-1 px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                      <button 
                        onClick={() => {
                          const nameInput = document.getElementById(`stakeholder-name-${selectedProject.id}`);
                          const roleInput = document.getElementById(`stakeholder-role-${selectedProject.id}`);
                          if (nameInput.value.trim()) {
                            const newStakeholders = [...(selectedProject.team?.otherStakeholders || []), {
                              name: nameInput.value.trim(),
                              role: roleInput.value.trim()
                            }];
                            updateProject(selectedProject.id, { 
                              team: { ...selectedProject.team, otherStakeholders: newStakeholders } 
                            });
                            nameInput.value = '';
                            roleInput.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                      >
                        <Icons.Plus />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    Use the toolbar to add headings, formatting, images, and links to your notes.
                  </p>
                  <RichTextEditor
                    value={selectedProject.notes}
                    onChange={(notes) => updateProject(selectedProject.id, { notes })}
                    placeholder="Start writing your project notes here... Use the toolbar above to format text, add headings, insert images, and more."
                  />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <span className="text-sm font-medium text-indigo-200">
                      {selectedProject.todos.filter(t => t.completed).length} of {selectedProject.todos.length} tasks completed
                    </span>
                    <span className="text-sm font-bold text-indigo-200">{selectedProject.progress}%</span>
                  </div>

                  <div className="space-y-2">
                    {selectedProject.todos.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No tasks yet. Add your first task below.</p>
                    ) : (
                      selectedProject.todos.map((todo, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border transition-colors ${
                            todo.completed ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-900 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={todo.completed} 
                              onChange={() => toggleTodo(selectedProject.id, idx)} 
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${todo.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {todo.title}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icons.Clock />
                              <input 
                                type="date" 
                                value={todo.dueDate || ''} 
                                onChange={(e) => {
                                  const newTodos = [...selectedProject.todos];
                                  newTodos[idx] = { ...newTodos[idx], dueDate: e.target.value };
                                  updateProject(selectedProject.id, { todos: newTodos });
                                }}
                                className="text-xs px-2 py-1 border border-slate-700 rounded bg-slate-900/60 text-slate-100"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const newTodos = selectedProject.todos.filter((_, i) => i !== idx);
                                const progress = newTodos.length > 0 ? 
                                  Math.round((newTodos.filter(t => t.completed).length / newTodos.length) * 100) : 0;
                                updateProject(selectedProject.id, { todos: newTodos, progress });
                              }} 
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded"
                              title="Delete task"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id={`todo-${selectedProject.id}`} 
                        placeholder="Add a new task..." 
                        className="flex-1 px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg text-sm"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            const newTodos = [...selectedProject.todos, { 
                              title: e.target.value.trim(), 
                              dueDate: '',
                              completed: false 
                            }];
                            updateProject(selectedProject.id, { todos: newTodos });
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const titleInput = document.getElementById(`todo-${selectedProject.id}`);
                          if (titleInput.value.trim()) {
                            const newTodos = [...selectedProject.todos, { 
                              title: titleInput.value.trim(), 
                              dueDate: '',
                              completed: false 
                            }];
                            updateProject(selectedProject.id, { todos: newTodos });
                            titleInput.value = '';
                          }
                        }} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Icons.Link /> Links
                    </h3>
                    <div className="space-y-2 mb-3">
                      {(selectedProject.docs?.links || []).length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">No links added yet</p>
                      ) : (
                        (selectedProject.docs?.links || []).map((link, idx) => {
                          const normalizedUrl = normalizeUrl(link.url);
                          return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg group border border-slate-700">
                            <Icons.ExternalLink />
                            <div className="flex-1 min-w-0">
                              <a 
                                href={normalizedUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-300 hover:text-indigo-200 font-medium truncate block"
                              >
                                {link.title || link.url}
                              </a>
                              {link.title && (
                                <span className="text-xs text-slate-400 truncate block">{link.url}</span>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                const newLinks = (selectedProject.docs?.links || []).filter((_, i) => i !== idx);
                                updateProject(selectedProject.id, { 
                                  docs: { ...selectedProject.docs, links: newLinks } 
                                });
                              }}
                              className="text-red-400 hover:bg-red-500/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        );
                        })
                      )}
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        id={`link-title-${selectedProject.id}`}
                        placeholder="Link title (optional)"
                        className="w-full px-3 py-2.5 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg text-sm"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                      <input 
                        type="url" 
                        id={`link-url-${selectedProject.id}`}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg text-sm"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                      <button 
                        onClick={() => {
                          const titleInput = document.getElementById(`link-title-${selectedProject.id}`);
                          const urlInput = document.getElementById(`link-url-${selectedProject.id}`);
                          if (urlInput.value.trim()) {
                            const newLinks = [...(selectedProject.docs?.links || []), {
                              title: titleInput.value.trim(),
                              url: urlInput.value.trim()
                            }];
                            updateProject(selectedProject.id, { 
                              docs: { ...selectedProject.docs, links: newLinks } 
                            });
                            titleInput.value = '';
                            urlInput.value = '';
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                      >
                        Add Link
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Icons.FileText /> Files
                    </h3>
                    <div className="space-y-2 mb-3">
                      {(selectedProject.docs?.files || []).length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">No files uploaded yet</p>
                      ) : (
                        (selectedProject.docs?.files || []).map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg group border border-slate-700">
                            <Icons.FileText />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block text-slate-100">{file.name}</span>
                              <span className="text-xs text-slate-400">{file.size}</span>
                            </div>
                            <button 
                              onClick={() => {
                                const newFiles = (selectedProject.docs?.files || []).filter((_, i) => i !== idx);
                                updateProject(selectedProject.id, { 
                                  docs: { ...selectedProject.docs, files: newFiles } 
                                });
                              }}
                              className="text-red-400 hover:bg-red-500/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors text-slate-300">
                      <Icons.Upload />
                      <span className="text-sm text-slate-300">Click to upload files</span>
                      <input 
                        type="file" 
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          // Only store metadata - files are stored in browser memory via object URLs
                          // Note: Object URLs are automatically revoked when the page is unloaded
                          const newFiles = files.map(f => {
                            // Create object URL for preview
                            const objectUrl = URL.createObjectURL(f);
                            return {
                              name: f.name,
                              size: f.size < 1024 ? `${f.size} B` : 
                                    f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : 
                                    `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                              type: f.type,
                              // Note: Object URLs don't persist across sessions - use for preview only
                              // For production, implement proper file upload to cloud storage
                            };
                          });
                          updateProject(selectedProject.id, { 
                            docs: { 
                              ...selectedProject.docs, 
                              files: [...(selectedProject.docs?.files || []), ...newFiles] 
                            } 
                          });
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewProject(false)}
          />
          <div
            className="absolute right-0 w-full max-w-xl bg-slate-900 text-slate-100 shadow-2xl flex flex-col border-l border-slate-700"
            style={{
              top: 'var(--global-header-height)',
              height: 'calc(100vh - var(--global-header-height))',
            }}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'new' ? null : 'new')}
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-lg flex items-center justify-center"
                    title="Choose emoji"
                  >
                    {document.getElementById('new-project-emoji')?.value || '📁'}
                  </button>
                  {activeEmojiPicker === 'new' && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        const emojiInput = document.getElementById('new-project-emoji');
                        if (emojiInput) emojiInput.value = emoji;
                        setActiveEmojiPicker(null);
                      }}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-bold">New Project</h2>
              </div>
              <button onClick={() => setShowNewProject(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <Icons.X />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <input 
                  type="text" 
                  id="new-project-name"
                  className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                />
              </div>
              <input type="hidden" id="new-project-emoji" defaultValue="📁" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select id="new-project-status" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Health</label>
                  <select id="new-project-health" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg">
                    <option value="green">🟢 Green</option>
                    <option value="yellow">🟡 Yellow</option>
                    <option value="red">🔴 Red</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input 
                    type="date" 
                    id="new-project-start"
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input 
                    type="date" 
                    id="new-project-end" 
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/60 text-slate-100 rounded-lg"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-3">
              <button 
                  onClick={() => {
                    const name = document.getElementById('new-project-name').value;
                    if (!name.trim()) return alert('Project name is required');
                    const startValue = document.getElementById('new-project-start').value || new Date().toISOString().split('T')[0];
                    const endValue = document.getElementById('new-project-end').value || '';
                    if (!isEndDateValid(startValue, endValue)) {
                      return alert('End date must be after the start date.');
                    }
                  const defaultTasks = [
                    { title: 'Align on requirements (customer problem, business goals, expected impact, scope, timeline)', completed: false, dueDate: '' },
                    { title: 'Get stakeholder sign-off', completed: false, dueDate: '' },
                    { title: 'Finalize P13N team scope', completed: false, dueDate: '' },
                    { title: 'Finalize designs', completed: false, dueDate: '' },
                    { title: 'Add Athena attributes to Yaba specs', completed: false, dueDate: '' },
                    { title: 'Validate Yaba specs', completed: false, dueDate: '' },
                    { title: 'Complete integration testing', completed: false, dueDate: '' },
                    { title: 'Complete end-to-end testing', completed: false, dueDate: '' },
                    { title: 'Finalize A/B test plan and success metrics', completed: false, dueDate: '' },
                    { title: 'Set up monitoring and rollback plan', completed: false, dueDate: '' },
                    { title: 'Launch', completed: false, dueDate: '' },
                    { title: 'Complete readout and share results', completed: false, dueDate: '' },
                  ];
                  const newProject = {
                    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: name.trim(),
                    status: document.getElementById('new-project-status').value,
                    health: document.getElementById('new-project-health').value,
                    emoji: document.getElementById('new-project-emoji').value,
                    startDate: startValue,
                    endDate: endValue,
                    notes: '',
                    tags: [],
                    todos: defaultTasks,
                    progress: 0,
                    team: {
                      p13nPM: '',
                      engineeringLead: '',
                      wPlusPM: '',
                      otherStakeholders: []
                    },
                    docs: {
                      links: [],
                      files: []
                    }
                  };
                  setProjects(prev => [...prev, newProject]);
                  setShowNewProject(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium"
              >
                Create
              </button>
              <button 
                onClick={() => setShowNewProject(false)} 
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
