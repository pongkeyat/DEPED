import express from 'express';
import {
    getAllOfficeUnits,
    createOfficeUnit,
    updateOfficeUnit,
    archiveOfficeUnit,
    restoreOfficeUnit
} from '../officeUnits/office.units.controller.js';

const router = express.Router();

router.get('/', getAllOfficeUnits);
router.post('/', createOfficeUnit);
router.put('/:office_unit_id', updateOfficeUnit);
router.patch('/:office_unit_id/archive', archiveOfficeUnit);
router.patch('/:office_unit_id/restore', restoreOfficeUnit);

export default router;
