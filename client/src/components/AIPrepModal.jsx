import React, { useState, useCallback } from 'react';
import { FaTimes, FaRobot, FaLightbulb, FaChartLine, FaBullseye, FaQuestionCircle } from 'react-icons/fa';

const AIPrepModal = ({ company, onClose }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/company-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [company]);

  React.useEffect(() => {
    if (company) {
      generateInsights();
    }
  }, [company, generateInsights]);

  const formatInsights = (text) => {
    if (!text) return null;

    const sections = text.split(/\n(?=\d+\.\s\*\*|###)/);

    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0]?.replace(/^\d+\.\s\*\*|\*\*$/g, '').replace(/^###\s/, '').trim();
      const content = lines.slice(1);

      const icons = {
        'Common Interview Patterns': <FaChartLine />,
        'Difficulty Analysis': <FaBullseye />,
        'Key Preparation Areas': <FaLightbulb />,
        'Success Strategies': <FaBullseye />,
        'Common Questions': <FaQuestionCircle />
      };

      return (
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-[#E85D24]">
              {icons[Object.keys(icons).find(key => title?.includes(key))] || <FaLightbulb />}
            </span>
            <span>{title}</span>
          </h3>
          <div className="mt-2 space-y-2 text-gray-700">
            {content.map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    <span>{trimmed.substring(2)}</span>
                  </div>
                );
              }
              return <p key={i}>{trimmed}</p>;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FaRobot size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Prep Guide</h2>
              <p className="mt-1 text-sm text-gray-500">
                {company} Interview Preparation
                {insights && ` • ${insights.interviewCount} Experience${insights.interviewCount > 1 ? 's' : ''} Analyzed`}
              </p>
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="min-h-[180px] flex flex-col items-center justify-center gap-3 text-gray-500 font-medium">
              <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin" />
              Analyzing interview experiences...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-700">❌ {error}</p>
              <button
                className="mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-transform hover:-translate-y-0.5"
                onClick={generateInsights}
              >
                Try Again
              </button>
            </div>
          )}

          {insights && !loading && (
            <div className="space-y-4">
              {formatInsights(insights.insights)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPrepModal;