// Test different Gemini models to find which one works
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
];

async function testModels() {
    console.log('🧪 Testing Gemini API with different models...\n');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }

    console.log('✅ API key found');
    console.log(`   Key preview: ${process.env.GEMINI_API_KEY.substring(0, 10)}...\n`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of models) {
        console.log(`📡 Testing model: ${modelName}`);

        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello in one word');
            const response = await result.response;
            const text = response.text();

            console.log(`   ✅ SUCCESS! Model "${modelName}" works!`);
            console.log(`   Response: "${text}"\n`);

            // If we found a working model, update the recommendation
            console.log(`\n🎉 FOUND WORKING MODEL: ${modelName}`);
            console.log(`\nUpdate your chatbotService.js to use this model:`);
            console.log(`   this.model = genAI.getGenerativeModel({ model: '${modelName}' });\n`);

            process.exit(0);

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message || error.statusText || 'Unknown error'}`);
            console.log(`   Status: ${error.status || 'N/A'}\n`);
        }
    }

    console.log('\n❌ None of the models worked!');
    console.log('\n💡 This might mean:');
    console.log('   1. Your API key is invalid');
    console.log('   2. Your API key is from the wrong service');
    console.log('   3. Gemini API is not available in your region');
    console.log('\n📝 Try these steps:');
    console.log('   1. Go to: https://aistudio.google.com/app/apikey');
    console.log('   2. Delete the old API key');
    console.log('   3. Create a BRAND NEW API key');
    console.log('   4. Make sure you see "Generative Language API" in the console');
    console.log('   5. Copy the new key and update .env');
    console.log('   6. Run this test again\n');

    process.exit(1);
}

testModels();
