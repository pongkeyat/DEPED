import express from 'express';
import {
    getAllPlacesOfAssignment,
    createPlaceOfAssignment,
    updatePlaceOfAssignment,
    archivePlaceOfAssignment,
    restorePlaceOfAssignment
} from '../PlaceOfAssignments/place.of.assignments.controller.js';

const router = express.Router();

router.get('/', getAllPlacesOfAssignment);
router.post('/', createPlaceOfAssignment);
router.put('/:place_id', updatePlaceOfAssignment);
router.patch('/:place_id/archive', archivePlaceOfAssignment);
router.patch('/:place_id/restore', restorePlaceOfAssignment);

export default router;
