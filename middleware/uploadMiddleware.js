const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, uploadDir); // use full path
},
filename: (req, file, cb) => {
const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
cb(null, uniqueSuffix + path.extname(file.originalname));
},
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
const allowedTypes = /jpeg|jpg|png|webp/;
const ext = path.extname(file.originalname).toLowerCase();
if (allowedTypes.test(ext)) cb(null, true);
else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };
