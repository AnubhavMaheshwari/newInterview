const Groq = require('groq-sdk');

// Validate API key exists
if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not set!');
    console.error('Please add your Groq API key to your .env file');
    console.error('Get your key at: https://console.groq.com/keys');
}

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key'
});

class ChatbotService {
    constructor() {
        if (process.env.GROQ_API_KEY) {
            console.log('✅ Groq AI initialized successfully');
        } else {
            console.error('❌ Groq API key not configured');
        }
    }

    /**
     * Generate interview summary from interview data
     */
    async generateInterviewSummary(interviewData) {
        try {
            const prompt = `You are an expert career advisor. Provide a brief, professional summary of the following interview experience in 3-4 sentences.

Interview Details:
- Company: ${interviewData.company}
- Position: ${interviewData.position}
- Experience Level: ${interviewData.experience}
- College: ${interviewData.college || 'Not specified'}
- Outcome: ${interviewData.outcome}
- Difficulty: ${interviewData.difficulty}
- Interview Date: ${interviewData.interviewDate ? new Date(interviewData.interviewDate).toLocaleDateString() : 'Not specified'}

Rounds:
${interviewData.rounds.map((round, idx) => `
Round ${idx + 1}: ${round.roundName}
- Difficulty: ${round.difficulty}
- Outcome: ${round.outcome}
- Questions: ${round.questions.join(', ') || 'Not specified'}
`).join('\n')}

Tips from the candidate: ${interviewData.tips || 'None provided'}

Please provide a concise summary highlighting the key aspects of this interview experience.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile', // Fast and high-quality model
                temperature: 0.7,
                max_tokens: 500
            });

            return chatCompletion.choices[0]?.message?.content || 'Unable to generate summary';
        } catch (error) {
            console.error('Error generating interview summary:', error);
            throw new Error('Failed to generate interview summary');
        }
    }

    /**
     * Generate personalized preparation strategy
     */
    async generatePreparationStrategy(userProfile, targetCompany = null, targetPosition = null) {
        try {
            const prompt = `You are an expert interview coach. Create a personalized interview preparation strategy for the following candidate.

Candidate Profile:
- Name: ${userProfile.name}
- Email: ${userProfile.email}
${targetCompany ? `- Target Company: ${targetCompany}` : ''}
${targetPosition ? `- Target Position: ${targetPosition}` : ''}

Based on this information, provide:
1. A structured preparation timeline (2-4 weeks)
2. Key areas to focus on (technical skills, behavioral questions, company research)
3. Specific resources or topics to study
4. Mock interview recommendations
5. Final tips for success

Keep the response concise but actionable (around 200-300 words).`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 600
            });

            return chatCompletion.choices[0]?.message?.content || 'Unable to generate strategy';
        } catch (error) {
            console.error('Error generating preparation strategy:', error);
            throw new Error('Failed to generate preparation strategy');
        }
    }

    /**
     * Handle general chat interactions with context awareness
     */
    async chat(message, context = {}) {
        try {
            let systemContext = `You are an AI assistant for an interview preparation platform. You help users with:
1. Understanding interview experiences shared by others
2. Preparing for upcoming interviews
3. Answering questions about interview processes
4. Providing career advice

Keep responses concise, helpful, and professional.`;

            // Add page context if available
            if (context.currentPage) {
                systemContext += `\n\nCurrent page: ${context.currentPage}`;
            }

            // Add detailed interview context if on interview detail page
            if (context.interviewData) {
                const interview = context.interviewData;
                systemContext += `\n\nIMPORTANT: The user is currently viewing a specific interview experience. Use this information to provide relevant, context-aware responses:

Interview Details:
- Company: ${interview.company}
- Position: ${interview.position}
- Experience Level: ${interview.experience}
- Difficulty: ${interview.difficulty}
- Final Outcome: ${interview.outcome}

Interview Rounds:
${interview.rounds.map((round, idx) => `
${idx + 1}. ${round.name}
   - Difficulty: ${round.difficulty}
   - Outcome: ${round.outcome}
   - Questions Asked: ${round.questions.length > 0 ? round.questions.join('; ') : 'Not specified'}
`).join('')}

${interview.tips ? `Candidate's Tips: ${interview.tips}` : ''}

When answering questions:
- Reference specific details from THIS interview
- Provide insights based on the actual rounds, questions, and outcomes shown
- If asked about preparation, tailor advice to this specific company and position
- If asked about difficulty, refer to the actual difficulty ratings
- Be specific and relevant to THIS interview experience`;
            }

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: message }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 600
            });

            return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        } catch (error) {
            console.error('Error in chat:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                status: error.status
            });

            // Provide more specific error messages
            if (error.message && error.message.includes('API key')) {
                throw new Error('Invalid API key. Please check your GROQ_API_KEY in .env file');
            } else if (error.message && error.message.includes('quota')) {
                throw new Error('API quota exceeded. Please try again later');
            } else if (error.message && error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again');
            } else {
                throw new Error(`Failed to process chat message: ${error.message || 'Unknown error'}`);
            }
        }
    }

    /**
     * Generate quick tips based on interview data
     */
    async generateQuickTips(interviewData) {
        try {
            const prompt = `Based on this interview experience at ${interviewData.company} for ${interviewData.position}, 
provide 3 quick, actionable tips for someone preparing for a similar interview.

Difficulty: ${interviewData.difficulty}
Rounds: ${interviewData.rounds.map(r => r.roundName).join(', ')}

Format as a numbered list. Keep each tip to one sentence.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 300
            });

            return chatCompletion.choices[0]?.message?.content || 'Unable to generate tips';
        } catch (error) {
            console.error('Error generating quick tips:', error);
            throw new Error('Failed to generate quick tips');
        }
    }

    /**
     * Generate overview of all interviews
     */
    async generateInterviewsOverview(interviews) {
        try {
            const summary = interviews.map(interview =>
                `${interview.company} - ${interview.position} (${interview.difficulty}, ${interview.outcome})`
            ).join('\n');

            const prompt = `You are an interview platform assistant. Based on these ${interviews.length} recent interview experiences, provide a helpful overview:\n\n${summary}\n\nProvide:\n1. Brief summary of companies represented\n2. Common difficulty levels\n3. Success rate insights\n4. Key interview trends\n\nKeep it concise (150-200 words) and helpful for job seekers.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 500
            });

            return chatCompletion.choices[0]?.message?.content || 'Unable to generate overview';
        } catch (error) {
            console.error('Error generating interviews overview:', error);
            throw new Error('Failed to generate interviews overview');
        }
    }

    /**
     * Generate prep strategy based on specific interview
     */
    async generateInterviewBasedStrategy(interview) {
        try {
            const prompt = `You are an interview coach. Based on this SPECIFIC interview experience, create a targeted preparation strategy:\n\nCompany: ${interview.company}\nPosition: ${interview.position}\nDifficulty: ${interview.difficulty}\nOutcome: ${interview.outcome}\n\nRounds:\n${interview.rounds.map((r, idx) => `${idx + 1}. ${r.roundName} - ${r.difficulty}\n   Questions: ${r.questions.join(', ')}`).join('\n')}\n\nTips from candidate: ${interview.tips}\n\nProvide a focused prep strategy (200-250 words) covering:\n1. How to tackle each round type\n2. Topics to focus on based on questions asked\n3. Difficulty-specific preparation tips\n4. Company-specific insights`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 600
            });

            return chatCompletion.choices[0]?.message?.content || 'Unable to generate strategy';
        } catch (error) {
            console.error('Error generating interview-based strategy:', error);
            throw new Error('Failed to generate strategy');
        }
    }
}

module.exports = new ChatbotService();
