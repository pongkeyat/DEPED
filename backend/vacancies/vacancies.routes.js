import express from 'express';
import { 
    postCompleteVacancy, 
    getAllVacancies, 
    getVacancyById, 
    updateVacancyStatus,
    updateVacancy,
    archiveVacancy,
    restoreVacancy
} from './vacancies.controller.js';

const router = express.Router();

router.post('/postVacancies', postCompleteVacancy);
router.get('/getVacancies', getAllVacancies);
router.get('/:id', getVacancyById);
router.put('/:id', updateVacancy);
router.patch('/:id/archive', archiveVacancy);
router.patch('/:id/status', updateVacancyStatus);
router.patch("/:id/restore", restoreVacancy);

export default router;