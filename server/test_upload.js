const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Create a test PDF file
const testPdfPath = path.join(__dirname, 'test-resume.pdf');
const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n410\n%%EOF';

fs.writeFileSync(testPdfPath, pdfContent);
console.log('✅ Created test PDF:', testPdfPath);

// Test upload
const form = new FormData();
form.append('file', fs.createReadStream(testPdfPath));

console.log('\n📤 Testing upload to http://localhost:3000/api/upload...\n');

axios.post('http://localhost:3000/api/upload', form, {
    headers: form.getHeaders()
})
    .then(response => {
        console.log('✅ Upload successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Clean up
        fs.unlinkSync(testPdfPath);
        console.log('\n🧹 Cleaned up test file');
    })
    .catch(error => {
        console.error('❌ Upload failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }

        // Clean up
        if (fs.existsSync(testPdfPath)) {
            fs.unlinkSync(testPdfPath);
        }
    });
