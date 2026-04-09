import React, { useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import InterviewForm from '../components/InterviewForm.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../utils/api';

const CreateInterview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true, state: { from: '/create-interview' } });
  }, [user, navigate]);

  const handleSubmit = async (formData) => {
    try {
      await API.post('/api/interviews', formData);
      toast.success('Interview experience shared successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error(error.response?.data?.msg || 'Failed to share interview. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Share Your Interview Experience
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-300">
              Help others by sharing your interview journey. Your insights can make a difference.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
          <InterviewForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default CreateInterview;