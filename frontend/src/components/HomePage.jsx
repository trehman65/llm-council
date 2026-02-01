import { useNavigate } from 'react-router-dom';
import { Groups, ArrowForward, ViewKanban } from '@mui/icons-material';
import { Network } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const handleSelectTool = (tool) => {
    if (tool === 'llm-council') {
      navigate('/llm-council');
    } else if (tool === 'second-order') {
      navigate('/second-order');
    } else if (tool === 'project-manager') {
      navigate('/project-manager');
    }
  };

  return (
    <div className="homepage-container">
      {/* Main Content */}
      <div className="homepage-content">
        <div className="homepage-main">
          {/* Header */}
          <div className="homepage-header">
            <h1 className="homepage-title">
              Make better product decisions
            </h1>
            <p className="homepage-subtitle">
              AI-powered tools to help product managers analyze complex questions and anticipate consequences
            </p>
          </div>

          {/* Tools Grid */}
          <div className="tools-grid">
            {/* LLM Council Tool */}
            <div 
              className="tool-card"
              onClick={() => handleSelectTool('llm-council')}
            >
              <div className="tool-icon-wrapper llm-council-icon">
                <Groups style={{ fontSize: 24 }} />
              </div>
              <div className="tool-content">
                <h3 className="tool-title">LLM Council</h3>
                <p className="tool-description">
                  Get multiple AI perspectives on your toughest product questions through structured debate
                </p>
                <div className="tool-link">
                  Open <ArrowForward style={{ fontSize: 16, marginLeft: 4 }} />
                </div>
              </div>
            </div>

            {/* Second-Order Effect Analyzer Tool */}
            <div 
              className="tool-card"
              onClick={() => handleSelectTool('second-order')}
            >
              <div className="tool-icon-wrapper second-order-icon">
                <Network style={{ fontSize: 24 }} />
              </div>
              <div className="tool-content">
                <h3 className="tool-title">Second-Order Effects</h3>
                <p className="tool-description">
                  Analyze cascading consequences and unintended outcomes of product decisions
                </p>
                <div className="tool-link">
                  Open <ArrowForward style={{ fontSize: 16, marginLeft: 4 }} />
                </div>
              </div>
            </div>

            <div 
              className="tool-card"
              onClick={() => handleSelectTool('project-manager')}
            >
              <div className="tool-icon-wrapper project-manager-icon">
                <ViewKanban style={{ fontSize: 24 }} />
              </div>
              <div className="tool-content">
                <h3 className="tool-title">Momentum</h3>
                <p className="tool-description">
                  Plan projects, track progress, and manage timelines in one place
                </p>
                <div className="tool-link">
                  Open <ArrowForward style={{ fontSize: 16, marginLeft: 4 }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;

