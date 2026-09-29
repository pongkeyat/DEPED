import express from 'express';
import { getAllPositions,    createPosition, updatePosition, archivePosition } from './positions.controller.js';

const router = express.Router();

router.get('/getAllPositions', getAllPositions);
router.post('/createPosition', createPosition);

// Frontend uses /api/positions/:position_id and /api/positions/:position_id/archive
router.put('/:position_id', updatePosition);
router.patch('/:position_id/archive', archivePosition);

// Backward-compatible aliases for older clients
router.put('/updatePosition/:position_id', updatePosition);
router.patch('/archivePosition/:position_id', archivePosition);
router.delete('/archivePosition/:position_id', archivePosition);

export default router
