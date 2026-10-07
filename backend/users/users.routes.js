import express from 'express';
import { 
    registerUsers, 
    loginUsers, 
    getUserProfiles,
    logoutUsers, 
    updatePasswords, 
    getAllUsers,
    updateUser,
    archiveUser ,
    forgotPassword,
    resetPassword
    
} from './users.controllers.js';
import { protect } from './users.middleware.js';

const router = express.Router();

router.post('/registerUsers', registerUsers);
router.post('/loginUsers', loginUsers);
router.get('/getUsers', protect, getUserProfiles);
router.post('/logoutUsers', logoutUsers);
router.put('/updatePasswords', protect, updatePasswords);
router.get('/getAllUsers', protect, getAllUsers);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Added routes for updating and archiving users
router.put('/updateUsers/:id', protect, updateUser);
router.patch('/archiveUsers/:id', protect, archiveUser);

export default router;