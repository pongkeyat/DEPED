import express from 'express';
import { registerUsers, loginUsers, getUserProfiles, logoutUsers, updatePasswords, getAllUsers} from './users.controllers.js';
import {protect} from './users.middleware.js';

const router = express.Router();

router.post('/registerUsers', registerUsers);
router.post('/loginUsers', loginUsers);
router.get('/getUsers', protect, getUserProfiles);
router.post('/logoutUsers', logoutUsers);
router.put('/updatePasswords', protect, updatePasswords);
router.get('/getAllUsers', protect, getAllUsers);

export default router;