import express from 'express';
import { 
    postCompleteVacancy, 
    getAllVacancies, 
    getVacancyById, 
    downloadVacancyMemo,
    updateVacancyStatus,
    updateVacancy,
    archiveVacancy,
    restoreVacancy
} from './vacancies.controller.js';
import { protect } from "../users/users.middleware.js";
import { uploadMemoFile } from "./vacancyMemoUpload.js";

const router = express.Router();

router.post('/postVacancies', postCompleteVacancy);
router.get('/getVacancies', getAllVacancies);
router.get('/:id/memo', protect, downloadVacancyMemo);
router.get('/:id', getVacancyById);
router.put('/:id', updateVacancy);
router.patch('/:id/archive', archiveVacancy);
router.patch('/:id/status', protect, uploadMemoFile, updateVacancyStatus);
router.patch("/:id/restore", restoreVacancy);

export default router;