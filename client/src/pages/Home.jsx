import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaRobot } from 'react-icons/fa';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext.jsx';
import InterviewCard from '../components/InterviewCard.jsx';
import AIPrepModal from '../components/AIPrepModal.jsx';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const searchInputRef = useRef(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiCompany, setAiCompany] = useState('');

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await API.get(`/api/interviews${sortBy === 'Popular' ? '?sort=rating' : ''}`);
      setInterviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = (Array.isArray(interviews) ? interviews : []).filter(interview => {
    const matchesSearch =
      interview.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDifficulty =
      filterDifficulty === 'All' || interview.difficulty === filterDifficulty;

    const matchesOutcome =
      filterOutcome === 'All' || interview.outcome === filterOutcome;

    return matchesSearch && matchesDifficulty && matchesOutcome;
  }).sort((a, b) => {
    if (sortBy === 'Popular') {
      const aVotes = a.upvotes ? a.upvotes.length : 0;
      const bVotes = b.upvotes ? b.upvotes.length : 0;
      return bVotes - aVotes;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-medium pt-16">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin" />
        Loading interviews...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Main content with offset for sticky navbar */}
      <div className="pt-16 px-4 sm:px-6 pb-6 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
            <div className="p-6 sm:p-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Interview Experiences
              </h1>
              <p className="mt-3 text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                Learn from real interview experiences shared by the community. Filter by company, role, difficulty, and outcome.
              </p>
              {!user && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/login"
                    className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    Sign In to Share
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-transform hover:-translate-y-0.5"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <FaSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Click to search"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by company or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 transition"
                />
              </div>

              {searchTerm && (
                <button
                  onClick={() => {
                    setAiCompany(searchTerm);
                    setShowAIModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-transform hover:-translate-y-0.5"
                  title="Get AI-powered prep guide for this company"
                >
                  <FaRobot /> AI Prep Guide
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
              >
                <option value="All">All Outcomes</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
              >
                <option value="Recent">Most Recent</option>
                <option value="Popular">Most Helpful (Upvoted)</option>
              </select>
            </div>
          </div>

          {/* Interview List */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Interview Experiences</h2>
              <span className="text-sm text-gray-500">{filteredInterviews.length} posts</span>
            </div>

            {filteredInterviews.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-600">No interviews found matching your criteria.</p>
                <p className="mt-2 text-gray-500">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInterviews.map(interview => (
                  <InterviewCard key={interview._id} interview={interview} />
                ))}
              </div>
            )}
          </div>

          {/* AI Prep Modal */}
          {showAIModal && (
            <AIPrepModal
              company={aiCompany}
              onClose={() => setShowAIModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;