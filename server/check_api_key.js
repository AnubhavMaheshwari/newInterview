// Simple diagnostic to check API key format
require('dotenv').config();

console.log('🔍 API Key Diagnostic\n');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.log('❌ GEMINI_API_KEY is not set in .env file');
    process.exit(1);
}

console.log('API Key Details:');
console.log(`  Length: ${apiKey.length} characters`);
console.log(`  First 10 chars: ${apiKey.substring(0, 10)}`);
console.log(`  Last 5 chars: ...${apiKey.substring(apiKey.length - 5)}`);
console.log(`  Starts with "AIza": ${apiKey.startsWith('AIza') ? '✅ Yes' : '❌ No'}`);
console.log(`  Contains spaces: ${apiKey.includes(' ') ? '❌ Yes (PROBLEM!)' : '✅ No'}`);
console.log(`  Contains quotes: ${apiKey.includes('"') || apiKey.includes("'") ? '❌ Yes (PROBLEM!)' : '✅ No'}`);

console.log('\n📝 Expected format:');
console.log('  - Should start with "AIza"');
console.log('  - Should be 39 characters long');
console.log('  - Should NOT have spaces or quotes');
console.log('  - Example: AIzaSyC36VCWtnbG7talNGxpRE-etm4iHGZ4g1A');

if (apiKey.length !== 39) {
    console.log(`\n⚠️  WARNING: Your key is ${apiKey.length} characters, expected 39`);
}

if (!apiKey.startsWith('AIza')) {
    console.log('\n❌ ERROR: Your API key doesn\'t start with "AIza"');
    console.log('   This is NOT a valid Gemini API key!');
    console.log('\n   Where to get the correct key:');
    console.log('   1. Visit: https://aistudio.google.com/app/apikey');
    console.log('   2. Click "Create API key"');
    console.log('   3. Copy the key that starts with "AIza"');
}

console.log('\n✅ If everything looks correct above, the API key format is valid.');
console.log('   The 404 error might be due to:');
console.log('   - API key not activated yet (wait a few minutes)');
console.log('   - Gemini API not available in your region');
console.log('   - Need to enable Generative Language API in Google Cloud');
