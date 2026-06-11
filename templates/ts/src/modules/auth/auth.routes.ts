import express from 'express';
import * as ctrl from './auth.controller.js';
import {
  registerSchema, loginSchema, updateProfileSchema,
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema,
} from './auth.validation.js';
import { validateBody } from '@/middlewares/validation.middleware.js';
import { isAuthenticated } from '@/middlewares/auth.middleware.js';

const router = express.Router();

// @doc Register a new user | 201
router.post('/register',       validateBody(registerSchema),       ctrl.register);
// @doc Login
router.post('/login',          validateBody(loginSchema),          ctrl.login);
// @doc Logout
router.post('/logout',         isAuthenticated,                    ctrl.logout);
// @doc Get current user
router.get( '/me',             isAuthenticated,                    ctrl.me);
// @doc Update profile
router.put( '/profile',        isAuthenticated, validateBody(updateProfileSchema),  ctrl.updateProfile);
// @doc Change password
router.put( '/password',       isAuthenticated, validateBody(changePasswordSchema), ctrl.changePassword);
// @doc Request password reset email
router.post('/forgot-password',                 validateBody(forgotPasswordSchema), ctrl.forgotPassword);
// @doc Reset password with token
router.post('/reset-password',                  validateBody(resetPasswordSchema),  ctrl.resetPassword);

export default router;
