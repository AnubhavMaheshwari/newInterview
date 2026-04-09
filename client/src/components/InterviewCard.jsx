import React, { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaEdit, FaTrashAlt, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../utils/api';

const InterviewCard = ({ interview, isDashboard = false, onDelete }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [upvotes, setUpvotes] = useState(interview.upvotes || []);

  const getGuestId = () => {
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('guest_id', guestId);
    }
    return guestId;
  };

  const guestId = getGuestId();
  const isUpvoted = user ? upvotes.includes(user._id) : upvotes.includes(guestId);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await API.put(`/api/interviews/${interview._id}/upvote`, { guestId: getGuestId() });
      setUpvotes(res.data);
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const initials = interview.user?.name
    ? interview.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const showName = (interview.isAnonymous && (!user || user.role !== 'admin'))
    ? 'Anonymous User'
    : interview.isAnonymous
      ? `${interview.user?.name || 'Guest'} (Anon)`
      : (interview.user?.name || 'Guest');

  return (
    <div
      onClick={() => navigate(`/interview/${interview._id}`)}
      className="group overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-slate-700 shadow-sm"
    >
      {/* Accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#7F77DD] via-[#1D9E75] to-[#E85D24]" />

      <div className="p-4 sm:p-[16px]">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + name */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-800 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                {interview.isAnonymous
                  ? '🎭'
                  : (interview.user?.avatar
                    ? <img src={interview.user.avatar} alt="" className="h-full w-full object-cover" />
                    : initials)}
              </div>
              {interview.isAnonymous && (
                <div className="absolute -bottom-1 -right-1 h-[18px] w-[18px] rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px]">
                  <FaLock size={8} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                {showName}
                {interview.isAnonymous && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
                    Anon
                  </span>
                )}
              </div>
              {!interview.isAnonymous && interview.college && (
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                  {interview.college}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {isDashboard ? (
              <>
                <Link
                  to={`/edit-interview/${interview._id}`}
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                >
                  <FaEdit size={11} /> Edit
                </Link>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(interview._id); }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                >
                  <FaTrashAlt size={11} /> Del
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpvote}
                  className={[
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition",
                    isUpvoted
                      ? "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/40"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800",
                  ].join(' ')}
                >
                  {isUpvoted ? <FaHeart size={11} /> : <FaRegHeart size={11} />} {upvotes.length}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/interview/${interview._id}`); }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                >
                  <FaComment size={11} /> {interview.comments?.length ?? 0}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Meta chips */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Company', value: interview.company },
            { label: 'Role', value: interview.position },
            { label: 'Rounds', value: interview.rounds?.length ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-2"
            >
              <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">
            {new Date(interview.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/interview/${interview._id}`); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-slate-900 hover:bg-gray-800 dark:hover:bg-slate-100 transition"
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;