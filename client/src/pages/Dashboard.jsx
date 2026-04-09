import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../utils/api';
import InterviewCard from '../components/InterviewCard.jsx';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [myInterviews, setMyInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    selected: 0,
    rejected: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchMyInterviews = async () => {
      try {
        const res = await API.get(`/api/interviews/user/${user._id}`);
        setMyInterviews(res.data);

        setStats({
          total: res.data.length,
          selected: res.data.filter(i => i.outcome === 'Selected').length,
          rejected: res.data.filter(i => i.outcome === 'Rejected').length,
          pending: res.data.filter(i => i.outcome === 'Pending').length
        });
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMyInterviews();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await API.delete(`/api/interviews/${id}`);
      setMyInterviews(myInterviews.filter(i => i._id !== id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        [myInterviews.find(i => i._id === id)?.outcome.toLowerCase()]: prev[myInterviews.find(i => i._id === id)?.outcome.toLowerCase()] - 1
      }));
    } catch (error) {
      console.error('Error deleting interview:', error);
      alert('Failed to delete interview');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 font-medium">
        Loading your interviews...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-14 w-14 rounded-xl border border-gray-200 dark:border-slate-700 object-cover"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 dark:text-slate-300 mt-1">Manage your interview experiences</p>
              </div>
            </div>
            <Link
              to="/create-interview"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              + Share New Interview
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, border: 'border-gray-200' },
            { label: 'Selected', value: stats.selected, border: 'border-green-200', bg: 'bg-green-50/30' },
            { label: 'Rejected', value: stats.rejected, border: 'border-red-200', bg: 'bg-red-50/30' },
            { label: 'Pending', value: stats.pending, border: 'border-amber-200', bg: 'bg-amber-50/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white dark:bg-slate-900 border ${stat.border} dark:border-slate-800 rounded-xl p-5 shadow-sm ${stat.bg || ''}`}
            >
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {stat.label}
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Interview List */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Interview Experiences</h2>
            <span className="text-sm text-gray-500 dark:text-slate-400">{myInterviews.length} posts</span>
          </div>

          {myInterviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <p className="text-gray-600 dark:text-slate-300">You haven't shared any interviews yet.</p>
              <Link
                to="/create-interview"
                className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Share Your First Interview
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myInterviews.map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  isDashboard={true}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;