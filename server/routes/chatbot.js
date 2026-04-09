const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const Interview = require('../models/Interview');

/**
 * @route   POST /api/chatbot/chat
 * @desc    Handle general chat messages
 * @access  Public
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Add user info to context if user is authenticated
        const enrichedContext = {
            ...context
        };

        // Only add user info if available (for authenticated users)
        if (req.user) {
            enrichedContext.user = {
                name: req.user.name,
                email: req.user.email
            };
        }

        // If user is on interview detail page, fetch the interview data for better context
        if (context.interviewId) {
            try {
                const interview = await Interview.findById(context.interviewId)
                    .populate('user', 'name');

                if (interview) {
                    enrichedContext.interviewData = {
                        company: interview.company,
                        position: interview.position,
                        experience: interview.experience,
                        difficulty: interview.difficulty,
                        outcome: interview.outcome,
                        rounds: interview.rounds.map(r => ({
                            name: r.roundName,
                            difficulty: r.difficulty,
                            outcome: r.outcome,
                            questions: r.questions
                        })),
                        tips: interview.tips,
                        candidateName: interview.user?.name
                    };
                }
            } catch (err) {
                console.error('Error fetching interview for context:', err);
                // Continue without interview data if fetch fails
            }
        }

        const response = await chatbotService.chat(message, enrichedContext);

        res.json({
            success: true,
            response,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process chat message',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * @route   POST /api/chatbot/overview
 * @desc    Generate overview of all interviews
 * @access  Public
 */
router.post('/overview', async (req, res) => {
    try {
        const interviews = await Interview.find()
            .populate('user', 'name')
            .limit(50)
            .sort({ createdAt: -1 });

        if (interviews.length === 0) {
            return res.json({
                success: true,
                overview: 'No interviews have been shared yet. Be the first to share your experience!'
            });
        }

        const overview = await chatbotService.generateInterviewsOverview(interviews);

        res.json({
            success: true,
            overview
        });
    } catch (error) {
        console.error('Overview error:', error);
        res.status(500).json({ error: 'Failed to generate overview' });
    }
});

/**
 * @route   POST /api/chatbot/summarize/:interviewId
 * @desc    Generate summary for a specific interview
 * @access  Public
 */
router.post('/summarize/:interviewId', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.interviewId)
            .populate('user', 'name email');

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const summary = await chatbotService.generateInterviewSummary(interview);

        res.json({
            success: true,
            summary,
            interviewId: interview._id
        });
    } catch (error) {
        console.error('Summarize error:', error);
        res.status(500).json({ error: 'Failed to generate interview summary' });
    }
});

/**
 * @route   POST /api/chatbot/interview-strategy/:interviewId
 * @desc    Generate preparation strategy based on specific interview
 * @access  Public
 */
router.post('/interview-strategy/:interviewId', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const strategy = await chatbotService.generateInterviewBasedStrategy(interview);

        res.json({
            success: true,
            strategy
        });
    } catch (error) {
        console.error('Strategy generation error:', error);
        res.status(500).json({ error: 'Failed to generate preparation strategy' });
    }
});

/**
 * @route   POST /api/chatbot/strategy
 * @desc    Generate personalized preparation strategy
 * @access  Public
 */
router.post('/strategy', async (req, res) => {
    try {
        const { targetCompany, targetPosition } = req.body;

        // Make user profile optional
        const userProfile = req.user ? {
            name: req.user.name,
            email: req.user.email
        } : {
            name: 'User',
            email: null
        };

        const strategy = await chatbotService.generatePreparationStrategy(
            userProfile,
            targetCompany,
            targetPosition
        );

        res.json({
            success: true,
            strategy
        });
    } catch (error) {
        console.error('Strategy generation error:', error);
        res.status(500).json({ error: 'Failed to generate preparation strategy' });
    }
});

/**
 * @route   POST /api/chatbot/quick-tips/:interviewId
 * @desc    Generate quick tips for an interview
 * @access  Public
 */
router.post('/quick-tips/:interviewId', async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const tips = await chatbotService.generateQuickTips(interview);

        res.json({
            success: true,
            tips
        });
    } catch (error) {
        console.error('Quick tips error:', error);
        res.status(500).json({ error: 'Failed to generate quick tips' });
    }
});

module.exports = router;
