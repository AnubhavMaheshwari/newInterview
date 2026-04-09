import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [unverifiedInterviews, setUnverifiedInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnverified();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnverified = async () => {
    try {
      const res = await API.get('/api/interviews/admin/unverified');
      setUnverifiedInterviews(res.data);
    } catch (error) {
      console.error('Error fetching unverified interviews:', error);
      toast.error('Failed to load unverified interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await API.put(`/api/interviews/${id}/verify`);
      toast.success('Interview verified successfully');
      setUnverifiedInterviews(unverifiedInterviews.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error verifying interview:', error);
      toast.error('Failed to verify interview');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await API.delete(`/api/interviews/${id}`);
      toast.success('Interview deleted');
      setUnverifiedInterviews(unverifiedInterviews.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('Failed to delete interview');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 font-medium">
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️</span> Admin Panel
            </h1>
            <p className="mt-2 text-gray-600">
              Validate and manage interviews shared by the community.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Pending Verification
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {unverifiedInterviews.length}
            </div>
          </div>
        </div>

        {/* Unverified Submissions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-bold text-gray-900">Unverified Submissions</h2>
              <span className="text-sm text-gray-500">{unverifiedInterviews.length} items</span>
            </div>
          </div>

          <div className="p-6">
            {unverifiedInterviews.length === 0 ? (
              <p className="text-gray-600">No pending interviews for verification.</p>
            ) : (
              <div className="space-y-4">
                {unverifiedInterviews.map((interview) => (
                  <div
                    key={interview._id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {interview.company} — {interview.position}
                        </h3>
                        <p className="text-gray-600">
                          <span className="font-semibold text-gray-700">Shared by:</span>{' '}
                          {interview.user?.name} ({interview.user?.email})
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold text-gray-700">Outcome:</span>{' '}
                          {interview.outcome}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {interview.resumeLink && (
                            <a
                              href={interview.resumeLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                            >
                              View Resume
                            </a>
                          )}
                          {interview.linkedIn && (
                            <a
                              href={interview.linkedIn}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerify(interview._id)}
                          className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-transform hover:-translate-y-0.5"
                        >
                          ✅ Verify
                        </button>
                        <button
                          onClick={() => handleDelete(interview._id)}
                          className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-transform hover:-translate-y-0.5"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;