import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';
import InterviewForm from '../components/InterviewForm.jsx';

const EditInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await API.get(`/api/interviews/${id}`);
        setInterview(res.data);
      } catch (error) {
        console.error('Error fetching interview:', error);
        toast.error('Failed to load interview details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    try {
      await API.put(`/api/interviews/${id}`, formData);
      toast.success('Interview updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating interview:', error);
      toast.error(error.response?.data?.msg || 'Failed to update interview');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 font-medium">
        Loading interview details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Edit Your Interview Experience
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-300">
              Update your interview journey details.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
          <InterviewForm onSubmit={handleSubmit} initialData={interview} />
        </div>
      </div>
    </div>
  );
};

export default EditInterview;