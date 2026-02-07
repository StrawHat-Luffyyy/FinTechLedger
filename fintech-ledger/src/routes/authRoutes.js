import Router from 'express';
import { handleLogin, handleSignup } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { signupSchema, loginSchema } from '../schemas/zodSchemas.js';

const router = Router();

router.post('/signup', validate(signupSchema), handleSignup);
router.post('/login', validate(loginSchema), handleLogin);
export default router;
