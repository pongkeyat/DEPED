import express from 'express';
import { 
    postCompleteVacancy, 
    getAllVacancies, 
    getVacancyById, 
    updateVacancyStatus 
} from './vacancies.controller.js';

const router = express.Router();

router.post('/postVacancies', postCompleteVacancy);
router.get('/getVacancies', getAllVacancies);
router.get('/:id', getVacancyById);
router.patch('/:id/status', updateVacancyStatus);

export default router;