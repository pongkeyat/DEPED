import express from 'express';
import { getAllPositions,    createPosition, updatePosition, archivePosition, restorePosition } from './positions.controller.js';

const router = express.Router();

router.get('/getAllPositions', getAllPositions);
router.post('/createPosition', createPosition);

// Frontend uses /api/positions/:position_id and /api/positions/:position_id/archive
router.put('/:position_id', updatePosition);
router.patch('/:position_id/archive', archivePosition);
router.patch('/restorePosition/:position_id', restorePosition)

export default router
