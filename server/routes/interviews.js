const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const User = require('../models/User');
const Notification = require('../models/Notification');
const admin = require('../middleware/admin');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const { connectDB } = require('../config/db');

// Force load env variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private
router.post('/', require('../middleware/auth'), async (req, res) => {
  try {
    await connectDB();

    // Check daily interview limit (3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInterviewCount = await Interview.countDocuments({
      user: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (todayInterviewCount >= 3) {
      return res.status(429).json({
        msg: 'Daily limit reached. You can share up to 3 interviews per day. Please try again tomorrow.',
        limit: 3,
        current: todayInterviewCount
      });
    }

    const {
      company,
      position,
      college,
      experience,
      rounds,
      questions,
      tips,
      difficulty,
      outcome,
      interviewDate,
      linkedIn,
      resumeLink,
      instagram,
      projectGithub,
      isAnonymous
    } = req.body;

    const newInterview = new Interview({
      user: req.user.id,
      company,
      position,
      college,
      experience,
      rounds,
      questions,
      tips,
      difficulty,
      outcome,
      interviewDate,
      linkedIn,
      resumeLink,
      instagram,
      projectGithub,
      isAnonymous
    });

    const interview = await newInterview.save();

    // Promote user to contributor if they are just a 'user'
    const user = await User.findById(req.user.id);
    if (user && user.role === 'user') {
      user.role = 'contributor';
      await user.save();
    }
    await interview.populate('user', 'name avatar');

    res.json(interview);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/interviews
// @desc    Get all interviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    try {
      await connectDB();
    } catch (dbErr) {
      return res.status(503).json({
        msg: 'Database unavailable',
        detail: dbErr?.message || String(dbErr)
      });
    }
    const { sort } = req.query;
    let query = Interview.find().populate('user', 'name avatar role');

    if (sort === 'rating') {
      // Sorting by upvotes length is best done via aggregation or post-process for simple arrays
      // But for small-medium datasets, retrieving all and sorting is fine.
      // Alternatively, using sort({ 'upvotes.length': -1 }) doesn't work in Mongo directly on array length easily without aggregation.
      const interviews = await Interview.find()
        .populate('user', 'name avatar role')
        .lean();

      interviews.sort((a, b) => (b.upvotes ? b.upvotes.length : 0) - (a.upvotes ? a.upvotes.length : 0));
      return res.json(interviews);
    }

    const interviews = await query.sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error('LIST_ALL_INTERVIEWS_ERROR:', error);
    res.status(500).json({ msg: 'Server error', detail: error.message, stage: 'listing' });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get interview by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    const interview = await Interview.findById(req.params.id)
      .populate('user', 'name avatar email');

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('GET_SINGLE_INTERVIEW_ERROR:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Interview not found' });
    }
    res.status(500).json({ msg: 'Server error', detail: error.message, stage: 'single_view' });
  }
});

// @route   GET /api/interviews/user/:userId
// @desc    Get interviews by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    await connectDB();
    const interviews = await Interview.find({ user: req.params.userId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/interviews/:id/upvote
// @desc    Upvote/Downvote an interview
// @access  Private
router.put('/:id/upvote', async (req, res) => {
  try {
    // Optional Auth: Decode token if present
    const token = req.header('x-auth-token');
    console.log('Upvote Request. Token Present:', !!token);

    if (token) {
      try {
        if (!process.env.JWT_SECRET) console.error('CRITICAL: JWT_SECRET IS MISSING IN ROUTE');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        console.log('Upvote Auth Success. User:', req.user.id);
      } catch (err) {
        console.error('Upvote Auth Failed:', err.message);
        // Continue as guest if token invalid
      }
    } else {
      console.log('Upvote: No token provided');
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    if (!interview.upvotes) {
      interview.upvotes = [];
    }

    // Check if the post has already been upvoted
    const voterId = (req.user ? req.user.id : req.body.guestId);

    if (!voterId) {
      return res.status(400).json({ msg: 'Voter ID required' });
    }

    // Toggle upvote strictly for the current voter
    if (interview.upvotes.includes(voterId)) {
      interview.upvotes = interview.upvotes.filter(id => id !== voterId);
    } else {
      interview.upvotes.push(voterId);
    }

    await interview.save();
    res.json(interview.upvotes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/interviews/:id/comment
// @desc    Add a comment
// @access  Public
router.post('/:id/comment', async (req, res) => {
  try {
    // Optional Auth Logic
    const token = req.header('x-auth-token');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
      } catch (err) { }
    }

    const { text, name, isAnonymous, guestId } = req.body;

    // Populate user to get email for notification
    const interview = await Interview.findById(req.params.id)
      .populate('user', 'name email');

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    const commenterName = isAnonymous ? 'Anonymous' : (name || (req.user ? 'User' : 'Guest'));

    const newComment = {
      text,
      name: commenterName,
      isAnonymous,
      guestId: guestId || null,
      user: req.user ? req.user.id : null
    };

    if (!interview.comments) {
      interview.comments = [];
    }

    interview.comments.push(newComment);
    await interview.save();

    // Send Email Notification
    if (interview.user && interview.user.email) {
      await sendEmail(
        interview.user.email,
        'New Comment on your Interview Experience',
        `<div style="font-family: Arial, sans-serif; padding: 20px;">
           <h3 style="color: #2b2d42;">New Comment Received</h3>
           <p><strong>${commenterName}</strong> commented on your interview experience for <strong>${interview.company}</strong>:</p>
           <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
             "${text}"
           </div>
           <p style="font-size: 0.9rem; color: #666;">View it on Interview Hub.</p>
         </div>`
      );
    }

    // Send In-App Notification (Don't notify if author comments on their own post)
    if (interview.user && req.user?.id !== interview.user._id.toString()) {
      const notification = new Notification({
        recipient: interview.user._id,
        actorName: commenterName,
        type: 'comment',
        interviewId: interview._id
      });
      await notification.save();
    }

    res.json(interview.comments);
  } catch (error) {
    console.error('Comment Error:', error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/interviews/:id/comment/:commentId
// @desc    Delete a comment
// @access  Public (Owner only)
router.delete('/:id/comment/:commentId', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
      } catch (e) { }
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ msg: 'Interview not found' });

    const comment = interview.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    // For DELETE request, getting body might be tricky in some clients/configurations.
    // But standard supports it.
    const guestId = req.body.guestId || req.query.guestId;

    // Strict Ownership Check: Only the commenter can delete their own comment.
    const isOwner = (req.user && comment.user && req.user.id === comment.user.toString()) ||
      (guestId && comment.guestId === guestId);

    if (!isOwner) {
      return res.status(401).json({ msg: 'You can only delete your own comments.' });
    }

    interview.comments.pull(req.params.commentId);
    await interview.save();
    res.json(interview.comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/interviews/:id
// @desc    Update an interview
// @access  Private (owner)
router.put('/:id', require('../middleware/auth'), async (req, res) => {
  try {
    let interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (!interview.user || interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const {
      company,
      position,
      college,
      experience,
      rounds,
      questions,
      tips,
      difficulty,
      outcome,
      interviewDate,
      linkedIn,
      resumeLink,
      instagram,
      projectGithub,
      isAnonymous
    } = req.body;

    const updatedFields = {
      company,
      position,
      college,
      experience,
      rounds,
      questions,
      tips,
      difficulty,
      outcome,
      interviewDate,
      linkedIn,
      resumeLink,
      instagram,
      projectGithub,
      isAnonymous
    };

    interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(interview);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete interview
// @access  Private (owner)
router.delete('/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (!interview.user || interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await interview.deleteOne();

    res.json({ msg: 'Interview removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/interviews/admin/unverified
// @desc    Get all unverified interviews (Admin only)
// @access  Private/Admin
router.get('/admin/unverified', admin, async (req, res) => {
  try {
    const interviews = await Interview.find({ isVerified: false })
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/interviews/:id/verify
// @desc    Verify an interview
// @access  Private/Admin
router.put('/:id/verify', admin, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ msg: 'Interview not found' });

    interview.isVerified = true;
    await interview.save();
    res.json({ msg: 'Interview verified' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;