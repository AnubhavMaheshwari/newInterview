// Test Groq API connection
require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroqAPI() {
    console.log('🧪 Testing Groq API...\n');

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY not found in .env file');
        console.error('\n📝 Steps to fix:');
        console.error('   1. Go to: https://console.groq.com/keys');
        console.error('   2. Sign up or log in');
        console.error('   3. Click "Create API Key"');
        console.error('   4. Copy the key');
        console.error('   5. Add to .env: GROQ_API_KEY=your_key_here');
        process.exit(1);
    }

    if (process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
        console.error('❌ GROQ_API_KEY is still using placeholder value');
        console.error('Please replace it with your actual API key from:');
        console.error('https://console.groq.com/keys');
        process.exit(1);
    }

    console.log('✅ API key found in .env');
    console.log(`   Key preview: ${process.env.GROQ_API_KEY.substring(0, 15)}...`);

    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        console.log('\n📡 Sending test request to Groq API...');
        console.log('   Using model: llama-3.3-70b-versatile');

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Say "Hello! Groq API is working perfectly!" in a friendly way.'
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 100
        });

        const response = chatCompletion.choices[0]?.message?.content;

        console.log('\n✅ SUCCESS! Groq API is working correctly!');
        console.log('\n🤖 Response from Groq:');
        console.log(`   "${response}"`);
        console.log('\n✨ Your chatbot is ready to use!');
        console.log('\n📊 Response stats:');
        console.log(`   Model: ${chatCompletion.model}`);
        console.log(`   Tokens used: ${chatCompletion.usage?.total_tokens || 'N/A'}`);
        console.log(`   Response time: Fast! ⚡`);

    } catch (error) {
        console.error('\n❌ ERROR: Failed to connect to Groq API');
        console.error('\nError details:');
        console.error(`   Message: ${error.message}`);

        if (error.message && error.message.includes('API key')) {
            console.error('\n💡 Solution:');
            console.error('   Your API key appears to be invalid.');
            console.error('   1. Go to: https://console.groq.com/keys');
            console.error('   2. Create a new API key');
            console.error('   3. Update GROQ_API_KEY in your .env file');
            console.error('   4. Run this test again');
        } else if (error.message && error.message.includes('rate limit')) {
            console.error('\n💡 Solution:');
            console.error('   You have exceeded the rate limit.');
            console.error('   Wait a few seconds and try again.');
        } else {
            console.error('\n💡 Full error:');
            console.error(error);
        }

        process.exit(1);
    }
}

testGroqAPI();
