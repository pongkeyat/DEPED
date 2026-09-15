import express from 'express';
import { 
    postInterviewSession, 
    getInterviewSessions, 
    updateInterviewSession 
} from '../interviewSession/interviewSession.controller.js';

const router = express.Router();

// Route endpoints
router.post('/interview-sessions', postInterviewSession);
router.get('/interview-sessions', getInterviewSessions);
router.put('/interview-sessions/:id', updateInterviewSession);

export default router;