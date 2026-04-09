import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaArrowLeft, FaBriefcase, FaGraduationCap,
  FaCalendarAlt, FaLightbulb, FaExchangeAlt,
  FaQuestionCircle, FaHeart, FaRegHeart, FaTrash, FaLinkedin
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../utils/api';
import { getAnonymousAvatar } from '../utils/avatarUtils';

const InterviewDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await API.get(`/api/interviews/${id}`);
        setInterview(res.data);
      } catch (error) {
        console.error('Error fetching interview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const guestId = localStorage.getItem('guest_id');
      const payload = {
        text: commentText,
        name: isCommentAnonymous ? 'Anonymous' : (user ? user.name : commentName),
        isAnonymous: isCommentAnonymous,
        guestId
      };
      const res = await API.post(`/api/interviews/${id}/comment`, payload);
      setInterview({ ...interview, comments: res.data });
      setCommentText('');
      setCommentName('');
      setIsCommentAnonymous(false);
      toast.success('Comment posted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const guestId = localStorage.getItem('guest_id');
      await API.delete(`/api/interviews/${id}/comment/${commentId}`, {
        data: { guestId }
      });
      const updatedComments = interview.comments.filter(c => c._id !== commentId);
      setInterview({ ...interview, comments: updatedComments });
      toast.success('Comment deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  const handleUpvote = async (e) => {
    e.stopPropagation();
    try {
      const guestId = localStorage.getItem('guest_id');
      const res = await API.put(`/api/interviews/${id}/upvote`, { guestId });
      setInterview({ ...interview, upvotes: res.data });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upvote');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-medium">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-4 py-2 font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <FaArrowLeft /> Not found — Go Back
          </Link>
        </div>
      </div>
    );
  }

  const isUpvoted = () => {
    const upvotes = interview.upvotes || [];
    const guestId = localStorage.getItem('guest_id');
    return user ? upvotes.includes(user._id) : upvotes.includes(guestId);
  };

  const initials = interview.user?.name
    ? interview.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const authorName = (interview.isAnonymous && (!user || user.role !== 'admin'))
    ? 'Anonymous User'
    : interview.isAnonymous
      ? `${interview.user?.name || 'Guest'} (Anon)`
      : (interview.user?.name || 'Guest');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
        >
          <FaArrowLeft size={14} /> Back
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center text-2xl font-bold border border-gray-200 dark:border-slate-700">
                {interview.company?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {interview.company}
                </h1>
                <h2 className="text-base sm:text-lg text-gray-600 dark:text-slate-300 font-medium mt-0.5">
                  {interview.position}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!interview.isAnonymous && interview.linkedIn && (
                <a
                  href={interview.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-[#0077b5] hover:-translate-y-0.5 transition-transform"
                  title="LinkedIn Profile"
                >
                  <FaLinkedin size={20} />
                </a>
              )}
              <button
                onClick={handleUpvote}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5 ${
                  isUpvoted()
                    ? 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-200'
                }`}
                title="Upvote"
              >
                {isUpvoted() ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                <span className="text-[11px] font-bold mt-0.5">{interview.upvotes?.length || 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Difficulty', value: interview.difficulty, icon: <FaExchangeAlt /> },
            { label: 'Outcome', value: interview.outcome, icon: <FaQuestionCircle /> },
            { label: 'Date', value: interview.interviewDate ? new Date(interview.interviewDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—', icon: <FaCalendarAlt /> },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                {icon}
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {label}
                </div>
                <div className="text-base font-semibold text-gray-900">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Author Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center font-medium text-base border border-gray-200 overflow-hidden">
                {interview.isAnonymous ? (
                  '🎭'
                ) : interview.user?.avatar ? (
                  <img src={interview.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-semibold text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                {authorName}
                {interview.isAnonymous && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">
                    Anon
                  </span>
                )}
              </div>
              {!interview.isAnonymous && interview.college && (
                <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <FaGraduationCap size={12} /> {interview.college}
                </div>
              )}
            </div>
          </div>

          {!interview.isAnonymous && (interview.linkedIn || interview.resumeLink) && (
            <div className="flex flex-wrap gap-2">
              {interview.linkedIn && (
                <a
                  href={interview.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  LinkedIn
                </a>
              )}
              {interview.resumeLink && (
                <a
                  href={interview.resumeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Resume
                </a>
              )}
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FaBriefcase className="text-[#E85D24]" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                The Journey
              </h3>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {interview.experience}
            </p>
          </div>
        </div>

        {/* Tips Section */}
        {interview.tips && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaLightbulb className="text-[#E85D24]" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Expert Advice
                </h3>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {interview.tips}
              </p>
            </div>
          </div>
        )}

        {/* Rounds Section */}
        {interview.rounds && interview.rounds.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaExchangeAlt className="text-[#E85D24]" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Interview Rounds
                </h3>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              {interview.rounds.map((round, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-5"
                >
                  <div className="font-bold text-gray-900">
                    Round {idx + 1}: {round.roundName}{' '}
                    <span className="text-sm font-medium text-gray-500">
                      ({round.outcome})
                    </span>
                  </div>
                  <ul className="mt-3 list-disc pl-5 space-y-1 text-gray-700">
                    {round.questions.map((q, qidx) => (
                      <li key={qidx}>{q}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Discussion
            </h3>
          </div>
          <div className="p-5 sm:p-6">
            {/* Existing Comments */}
            <div className="space-y-4">
              {interview.comments?.map((comment, idx) => {
                const isAuthor =
                  interview.user &&
                  comment.user?.toString() === interview.user._id?.toString();
                const canDelete =
                  (user && comment.user?.toString() === user._id?.toString()) ||
                  (comment.guestId && comment.guestId === localStorage.getItem('guest_id'));

                return (
                  <div
                    key={idx}
                    className={`border border-gray-200 rounded-lg p-4 ${
                      isAuthor ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <img
                        src={
                          comment.isAnonymous
                            ? getAnonymousAvatar(comment._id || comment.guestId)
                            : comment.avatar || getAnonymousAvatar(comment.user)
                        }
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-bold text-gray-900">
                        {comment.isAnonymous ? 'Anon' : comment.name}
                      </span>
                      {isAuthor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 font-medium">
                          Author
                        </span>
                      )}
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-600 hover:text-red-700 transition p-1"
                          title="Delete comment"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mt-6 pt-5 border-t border-gray-200">
              {!user && (
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition mb-4"
                />
              )}
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCommentAnonymous}
                  onChange={(e) => setIsCommentAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                Comment anonymously
              </label>
              <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition resize-y mb-4"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="w-full py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
              >
                {submittingComment ? 'Sending...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetail;