const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

/* ================= Cloudinary Config ================= */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= Multer (PDF only) ================= */
const storage = multer.diskStorage({});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files allowed"), false);
        }
    },
});

/* ================= Upload Route ================= */
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Generate a clean filename and EXPLICITLY append .pdf for raw storage
        const fileName = req.file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '') + '-' + Date.now() + ".pdf";

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "interview-sharing-platform/resumes",
            resource_type: "raw", // 'raw' ensures the file is not processed/transformed
            public_id: fileName,
        });

        res.json({
            success: true,
            filePath: result.secure_url,
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
