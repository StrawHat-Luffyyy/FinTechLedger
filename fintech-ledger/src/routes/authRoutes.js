import Router from 'express';
import {handleLogin , handleSignup} from '../controllers/authController.js';

const router = Router();

router.post('/signup', handleSignup);
router.post('/login', handleLogin);

export default router;