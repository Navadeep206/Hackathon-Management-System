import multer from 'multer';
import path from 'path';
import fs from 'fs';

const screenshotDir = 'uploads/screenshots/';
const presentationDir = 'uploads/presentations/';

// Create target directories if they do not exist
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}
if (!fs.existsSync(presentationDir)) {
  fs.mkdirSync(presentationDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'presentationPDF') {
      cb(null, presentationDir);
    } else if (file.fieldname === 'screenshots') {
      cb(null, screenshotDir);
    } else {
      cb(new Error('Invalid field name in upload request'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File validation filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'presentationPDF') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: presentationPDF must be a PDF file.'), false);
    }
  } else if (file.fieldname === 'screenshots') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: screenshots must be image files.'), false);
    }
  } else {
    cb(new Error('Unexpected file field'), false);
  }
};

// Export Multer upload instances
export const uploadSubmission = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Export field upload middleware
export const uploadFields = uploadSubmission.fields([
  { name: 'screenshots', maxCount: 5 },
  { name: 'presentationPDF', maxCount: 1 },
]);
