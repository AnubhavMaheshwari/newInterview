const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Interview = require('../models/Interview');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// POST /api/ai/company-insights - Generate AI prep guide for a company
router.post('/company-insights', async (req, res) => {
    try {
        const { company } = req.body;

        if (!company) {
            return res.status(400).json({ msg: 'Company name is required' });
        }

        // Fetch all interviews for this company
        const interviews = await Interview.find({
            company: { $regex: new RegExp(company, 'i') }
        }).populate('user', 'name');

        if (interviews.length === 0) {
            return res.status(404).json({
                msg: 'No interviews found for this company',
                company
            });
        }

        // Prepare interview data for AI
        const interviewData = interviews.map(interview => ({
            position: interview.position,
            difficulty: interview.difficulty,
            outcome: interview.outcome,
            experience: interview.experience,
            tips: interview.tips,
            rounds: interview.rounds?.map(r => ({
                name: r.roundName,
                outcome: r.outcome,
                questions: r.questions
            }))
        }));

        // Create AI prompt
        const prompt = `You are an interview preparation assistant. Analyze these ${interviews.length} real interview experiences for ${company} and provide comprehensive preparation guidance.

Interview Data:
${JSON.stringify(interviewData, null, 2)}

Based on these experiences, provide:
1. **Common Interview Patterns**: What types of rounds and questions appear most frequently?
2. **Difficulty Analysis**: Overall difficulty level and what makes it challenging
3. **Key Preparation Areas**: Specific topics and skills to focus on
4. **Success Strategies**: Tips and approaches that led to positive outcomes
5. **Common Questions**: List of frequently asked questions across rounds

Format your response in clear sections with bullet points. Be specific and actionable.`;

        // Call Groq AI
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert interview preparation coach. Provide clear, actionable advice based on real interview data.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2000
        });

        const insights = completion.choices[0]?.message?.content || 'Unable to generate insights';

        res.json({
            company,
            interviewCount: interviews.length,
            insights,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('AI Insights Error:', error);
        res.status(500).json({
            msg: 'Failed to generate AI insights',
            error: error.message
        });
    }
});

module.exports = router;
