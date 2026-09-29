import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  submitFullApplication, 
  getFullApplicants, 
  getApplicantById, 
  updateApplicationStatus,
    updateFullApplicant
} from './applications.controller.js';

const router = express.Router();

// 1. Configure local storage for uploaded documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Relative path resolves relative to where Node was launched (project root)
    const dir = 'uploads/';
    
    // Automatically create the folder if it does not exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Sanitize fieldname: replaces brackets '[' and ']' with underscores '_'
    const safeFieldname = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    cb(null, `${safeFieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// 2. Attach upload.any() to process files on submission
router.post('/submit', upload.any(), submitFullApplication);

// Fetch & Update Routes
router.get('/getFullApplicants', getFullApplicants);
router.put('/updateApplicationStatus/:id', updateApplicationStatus);
router.get('/getApplicantById/:id', getApplicantById);
router.put("/updateApplicant/:id",upload.any(), updateFullApplicant
);

export default router;