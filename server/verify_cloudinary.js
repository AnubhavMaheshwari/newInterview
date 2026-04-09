const fs = require('fs');
const http = require('http');
const path = require('path');

const FILE_SIZE_MB = 1;
const FILE_PATH = path.join(__dirname, 'test_cloudinary.pdf');

// 1. Create a dummy file (1MB)
console.log(`Creating ${FILE_SIZE_MB}MB dummy file...`);
const buffer = Buffer.alloc(FILE_SIZE_MB * 1024 * 1024, 'a');
fs.writeFileSync(FILE_PATH, buffer);

// 2. Upload File
console.log('Uploading file to Cloudinary via server...');

const boundary = '--------------------------' + Date.now().toString(16);

const postDataStart = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test_cloudinary.pdf"',
    'Content-Type: application/pdf',
    '',
    ''
].join('\r\n');

const postDataEnd = `\r\n--${boundary}--`;

const options = {
    hostname: '127.0.0.1',
    port: 3000, // Make sure this matches your server port
    path: '/api/upload',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postDataStart) + buffer.length + Buffer.byteLength(postDataEnd)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Upload Status: ${res.statusCode}`);
        console.log(`Upload Response: ${data}`);

        try {
            const jsonParams = JSON.parse(data);
            const filePath = jsonParams.filePath;
            console.log(`Returned File Path: ${filePath}`);

            if (filePath && filePath.startsWith('http')) {
                console.log('✅ Success! Returned path is a URL (Cloudinary).');

                // Cleanup
                try {
                    fs.unlinkSync(FILE_PATH);
                    console.log('Cleaned up test file.');
                } catch (e) { }
            } else {
                console.error('❌ Failed. Unexpected file path format.');
            }

        } catch (e) {
            console.error("Failed to parse response", e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with upload request: ${e.message}`);
});

req.write(postDataStart);
req.write(buffer);
req.write(postDataEnd);
req.end();
