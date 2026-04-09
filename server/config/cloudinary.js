require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'interview-portal/resumes',
        resource_type: 'auto', // This allows PDFs and other file types
        format: (req, file) => {
            // Preserve the original file format
            const ext = file.originalname.split('.').pop();
            return ext;
        },
        public_id: (req, file) => {
            // remove extension for public_id, add random suffix for uniqueness
            const name = file.originalname.split('.')[0];
            return `${name}-${Date.now()}`;
        }
    },
});

module.exports = {
    cloudinary,
    storage
};
