import React, { useState } from 'react';

const InterviewForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    company: initialData.company || '',
    position: initialData.position || '',
    experience: initialData.experience || '',
    college: initialData.college || '',
    rounds: initialData.rounds || [{ roundName: '', questions: [''], difficulty: 'Medium', outcome: 'Pending' }],
    // Legacy support or fallback
    questions: initialData.questions || [],
    tips: initialData.tips || '',
    difficulty: initialData.difficulty || 'Medium',
    outcome: initialData.outcome || 'Pending',
    interviewDate: initialData.interviewDate || '',
    linkedIn: initialData.linkedIn || '',
    resumeLink: initialData.resumeLink || '',
    isAnonymous: initialData.isAnonymous || false,
    isResumeFile: false // UI toggle state, not sent to backend
  });



  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  /* Round Support Functions */
  const handleRoundChange = (roundIndex, field, value) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex][field] = value;
    setFormData({ ...formData, rounds: newRounds });
  };

  const handleRoundQuestionChange = (roundIndex, qIndex, value) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex].questions[qIndex] = value;
    setFormData({ ...formData, rounds: newRounds });
  };

  const addRoundQuestion = (roundIndex) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex].questions.push('');
    setFormData({ ...formData, rounds: newRounds });
  };

  const removeRoundQuestion = (roundIndex, qIndex) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex].questions = newRounds[roundIndex].questions.filter((_, i) => i !== qIndex);
    setFormData({ ...formData, rounds: newRounds });
  };

  const addRound = () => {
    setFormData({
      ...formData,
      rounds: [
        ...formData.rounds,
        { roundName: '', questions: [''], difficulty: 'Medium', outcome: 'Pending' }
      ]
    });
  };

  const removeRound = (index) => {
    const newRounds = formData.rounds.filter((_, i) => i !== index);
    setFormData({ ...formData, rounds: newRounds });
  };

  const handleKeyDown = (e) => {
    // Prevent Enter from submitting the form in input/select fields
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out empty questions in each round
    const cleanedRounds = formData.rounds.map(round => ({
      ...round,
      questions: round.questions.filter(q => q.trim() !== '')
    }));

    // For backward compatibility or if you want to flatten all questions into the main 'questions' array as fallback
    const allQuestions = cleanedRounds.flatMap(r => r.questions);

    onSubmit({
      ...formData,
      rounds: cleanedRounds,
      questions: allQuestions // Keep this populated for potential legacy viewers
    });
  };

  const inputClass =
    "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 outline-none " +
    "text-slate-900 placeholder-slate-400 " +
    "focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 " +
    "dark:focus:border-slate-200 dark:focus:bg-slate-800 dark:focus:ring-white/10";
  const labelClass = "text-sm font-extrabold text-slate-700 dark:text-slate-200";

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
        <input
          type="checkbox"
          name="isAnonymous"
          checked={formData.isAnonymous}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Post Anonymously (Hide Name & Profile)</span>
      </label>
      <div className="space-y-2">
        <label className={labelClass}>Company Name *</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          placeholder="e.g., Google, Microsoft"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Position *</label>
        <input
          type="text"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          placeholder="e.g., Software Engineer, Data Analyst"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>College Name</label>
        <input
          type="text"
          name="college"
          value={formData.college}
          onChange={handleChange}
          placeholder="e.g., IIT Bombay, NIT Trichy"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Difficulty</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} className={inputClass}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Outcome</label>
          <select name="outcome" value={formData.outcome} onChange={handleChange} className={inputClass}>
            <option value="Pending">Pending</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Interview Date</label>
          <input
            type="date"
            name="interviewDate"
            value={formData.interviewDate}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Your Experience *</label>
        <textarea
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
          rows="4"
          placeholder="Share your overall interview experience..."
          className={`${inputClass} min-h-32`}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 md:p-5">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Interview Rounds</h3>
          <button
            type="button"
            onClick={addRound}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:-translate-y-0.5 transition dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            + Add Round
          </button>
        </div>
        {formData.rounds.map((round, rIndex) => (
          <div key={rIndex} className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-black text-slate-900 dark:text-white">Round {rIndex + 1}</h4>
              {formData.rounds.length > 1 && (
                <button type="button" onClick={() => removeRound(rIndex)} className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm font-extrabold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40">
                  Remove Round
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <label className={labelClass}>Round Name *</label>
              <input
                type="text"
                value={round.roundName}
                onChange={(e) => handleRoundChange(rIndex, 'roundName', e.target.value)}
                placeholder="e.g., Online Assessment, Technical Round 1"
                required
                className={inputClass}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Difficulty</label>
                <select
                  value={round.difficulty}
                  onChange={(e) => handleRoundChange(rIndex, 'difficulty', e.target.value)}
                  className={inputClass}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Outcome</label>
                <select
                  value={round.outcome}
                  onChange={(e) => handleRoundChange(rIndex, 'outcome', e.target.value)}
                  className={inputClass}
                >
                  <option value="Cleared">Cleared</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className={labelClass}>Questions</label>
              {round.questions.map((q, qIndex) => (
                <div key={qIndex} className="flex gap-2">
                  <textarea
                    value={q}
                    onChange={(e) => handleRoundQuestionChange(rIndex, qIndex, e.target.value)}
                    placeholder={`Question ${qIndex + 1}`}
                    rows="2"
                    className={`${inputClass} min-h-20`}
                  />
                  {round.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoundQuestion(rIndex, qIndex)}
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addRoundQuestion(rIndex)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                + Add Question
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Tips for Future Candidates</label>
        <textarea
          name="tips"
          value={formData.tips}
          onChange={handleChange}
          rows="3"
          placeholder="Any tips or advice for others..."
          className={`${inputClass} min-h-28`}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 md:p-5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Connect</h3>

        <div className="mt-4 space-y-2">
          <label className={labelClass}>LinkedIn Profile URL</label>
          <input
            type="url"
            name="linkedIn"
            value={formData.linkedIn}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
            className={inputClass}
          />
        </div>



        {/* Resume upload feature disabled */}
        {/* <div className="form-group">
          <label>Resume</label>
          <div className="resume-options">
            <label>
              <input
                type="radio"
                checked={!formData.isResumeFile}
                onChange={() => setFormData({ ...formData, isResumeFile: false })}
              /> Link
            </label>
            <label>
              <input
                type="radio"
                checked={formData.isResumeFile}
                onChange={() => setFormData({ ...formData, isResumeFile: true })}
              /> Upload (PDF/JPG)
            </label>
          </div>

          {formData.isResumeFile ? (
            <div className="file-upload-input">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {uploading && <p>Uploading...</p>}
              {formData.resumeLink && formData.resumeLink.includes('cloudinary') && (
                <p className="success-msg">✅ Resume uploaded</p>
              )}
            </div>
          ) : (
            <input
              type="url"
              name="resumeLink"
              value={formData.resumeLink}
              onChange={handleChange}
              placeholder="Google Drive, Dropbox, or any public link"
            />
          )}
        </div> */}
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-slate-900 py-3 text-white font-extrabold hover:-translate-y-0.5 transition dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      >
        Share Interview Experience
      </button>
    </form>
  );
};

export default InterviewForm;