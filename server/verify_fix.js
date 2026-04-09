const fs = require('fs');
const http = require('http');
const path = require('path');

const API_URL = 'http://localhost:5000/api/upload';
const DOWNLOAD_BASE_URL = 'http://localhost:5000'; // download route is /api/upload/download/:filename
const FILE_SIZE_MB = 6;
const FILE_PATH = path.join(__dirname, 'test_large_resume.pdf');

// 1. Create a large dummy file (6MB)
console.log(`Creating ${FILE_SIZE_MB}MB dummy file...`);
const buffer = Buffer.alloc(FILE_SIZE_MB * 1024 * 1024, 'a');
fs.writeFileSync(FILE_PATH, buffer);

// 2. Upload File
console.log('Uploading file...');

const boundary = '--------------------------' + Date.now().toString(16);

const postDataStart = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test_large_resume.pdf"',
    'Content-Type: application/pdf',
    '',
    ''
].join('\r\n');

const postDataEnd = `\r\n--${boundary}--`;

const options = {
    hostname: 'localhost',
    port: 5000,
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

        if (res.statusCode === 200) {
            try {
                const jsonParams = JSON.parse(data);
                const filePath = jsonParams.filePath; // e.g., /uploads/resumes/filename.pdf

                // Construct download URL
                // The filePath returned is relative: /uploads/resumes/xxxx.pdf
                // The download route is: /api/upload/download/xxxx.pdf
                // We need to extract filename.

                const filename = path.basename(filePath);
                const downloadUrl = `/api/upload/download/${filename}`;

                console.log(`Download URL Path: ${downloadUrl}`);
                verifyDownload(downloadUrl);
            } catch (e) {
                console.error("Failed to parse response", e);
            }
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

function verifyDownload(urlPath) {
    console.log(`Attempting download from ${urlPath}...`);
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: urlPath,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Download Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Download successful!');
            console.log(`Content-Length: ${res.headers['content-length']}`);

            // Cleanup
            try {
                fs.unlinkSync(FILE_PATH);
                console.log('Cleaned up test file.');
            } catch (e) { }
        } else {
            console.error('❌ Download failed.');
        }
    });

    req.on('error', (e) => {
        console.error(`Problem with download request: ${e.message}`);
    });
    req.end();
}
