import express from 'express';
import { getAllPositions } from './positions.controller.js';

const router = express.Router();

router.get('/getAllPositions', getAllPositions)

export default router
