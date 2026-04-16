/**
 * Generates all files for the auth module.
 * Returns a map of { filename -> content }
 */
export function generateAuthModule(config) {
  const { language } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  return {
    // model is written to src/models/ — keyed with __models__ prefix
    [`__models__/user.model.${ext}`]: generateUserModel(isTs),
    [`auth.validation.${ext}`]: generateAuthValidation(isTs, config),
    [`auth.service.${ext}`]: generateAuthService(isTs, config),
    [`auth.controller.${ext}`]: generateAuthController(isTs, config),
    [`auth.routes.${ext}`]: generateAuthRoutes(isTs, config),
  };
}

// ── User Model ────────────────────────────────────────────────────────────────

function generateUserModel(isTs) {
  if (isTs) {
    return `import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  name: string | null;
  passwordHash: string;
  role: 'user' | 'admin';
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  preferences: { language: 'en' | 'tr' };
  isValidPassword(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:          { type: String, trim: true, maxlength: 100, default: null },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken:   { type: String, default: null },
    resetPasswordExpires: { type: Date,   default: null },
    preferences: {
      language: { type: String, enum: ['en', 'tr'], default: 'en' },
    },
  },
  { timestamps: true }
);

userSchema.methods.isValidPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  return bcrypt.hash(password, 10);
};

export default mongoose.model<IUser, IUserModel>('User', userSchema);
`;
  }

  return `import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:          { type: String, trim: true, maxlength: 100, default: null },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken:   { type: String, default: null },
    resetPasswordExpires: { type: Date,   default: null },
    preferences: {
      language: { type: String, enum: ['en', 'tr'], default: 'en' },
    },
  },
  { timestamps: true }
);

userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model('User', userSchema);
`;
}

// ── Validation ────────────────────────────────────────────────────────────────

function generateAuthValidation(isTs, config) {
  return `import Joi from 'joi';

// Password must be at least 8 chars and contain uppercase, lowercase, and a digit (NIST SP 800-63B+)
const passwordRule = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/)
  .required()
  .messages({
    'any.required': 'MISSING_REQUIRED_FIELD',
    'string.min': 'PASSWORD_TOO_SHORT',
    'string.pattern.base': 'PASSWORD_TOO_WEAK',
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'MISSING_REQUIRED_FIELD',
    'string.email': 'INVALID_EMAIL',
  }),
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'PASSWORD_MISMATCH',
    'any.required': 'MISSING_REQUIRED_FIELD',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().max(100).allow(null, '').optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: passwordRule,
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'PASSWORDS_DO_NOT_MATCH',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordRule,
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'PASSWORDS_DO_NOT_MATCH',
  }),
});
`;
}

// ── Service ───────────────────────────────────────────────────────────────────

function generateAuthService(isTs, config) {
  const { includeEmail } = config;

  const emailImport = includeEmail
    ? `import { sendTemplateEmail, getEmailLocale } from '@/services/email/email.service.js';
import { config } from '@/config/config.js';`
    : '';

  const welcomeEmailBlock = includeEmail
    ? `
  // Send welcome email (non-blocking — failure must not break registration)
  try {
    const locale = getEmailLocale(user.preferences?.language || 'en');
    await sendTemplateEmail(
      user.email,
      locale.subjects.welcome(user.name || user.email),
      'welcome',
      {
        appName: config.app.name,
        ctaUrl: config.app.frontendUrl,
        userEmail: user.email,
        currentYear: new Date().getFullYear(),
        t: { ...locale.common, ...locale.welcome },
      }
    );
  } catch { /* non-critical */ }`
    : '';

  const forgotPasswordBlock = includeEmail
    ? `
/**
 * Initiate forgot-password flow — generates a token and sends a reset email.
 */
export const forgotPassword = async (email${isTs ? ': string' : ''}) => {
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration
  if (!user) return { message: 'RESET_EMAIL_SENT' };

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = \`\${config.app.frontendUrl}/reset-password?token=\${token}\`;

  try {
    const locale = getEmailLocale(user.preferences?.language || 'en');
    await sendTemplateEmail(
      user.email,
      locale.subjects.forgotPassword(),
      'forgot-password',
      {
        appName: config.app.name,
        ctaUrl: resetUrl,
        userEmail: user.email,
        currentYear: new Date().getFullYear(),
        t: { ...locale.common, ...locale.forgotPassword },
      }
    );
  } catch { /* non-critical */ }

  return { message: 'RESET_EMAIL_SENT' };
};`
    : `
/**
 * Initiate forgot-password flow — generates a reset token.
 * Wire up your own email delivery here.
 */
export const forgotPassword = async (email${isTs ? ': string' : ''}) => {
  const user = await User.findOne({ email });
  if (!user) return { message: 'RESET_EMAIL_SENT' }; // prevent enumeration

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // TODO: send reset email with token
  // resetUrl = \`\${process.env.FRONTEND_URL}/reset-password?token=\${token}\`

  return { message: 'RESET_EMAIL_SENT' };
};`;

  const passwordChangedEmailBlock = includeEmail
    ? `
  // Notify user of password change
  try {
    const locale = getEmailLocale(user.preferences?.language || 'en');
    await sendTemplateEmail(
      user.email,
      locale.subjects.passwordChanged(),
      'password-changed',
      {
        appName: config.app.name,
        ctaUrl: config.app.frontendUrl,
        userEmail: user.email,
        currentYear: new Date().getFullYear(),
        t: { ...locale.common, ...locale.passwordChanged },
      }
    );
  } catch { /* non-critical */ }`
    : '';

  return `import createError from 'http-errors';
import crypto from 'crypto';
import User from '@/models/user.model.js';
${emailImport}

${
  isTs
    ? `import type { Session, SessionData } from 'express-session';

/** Typed session shape used across auth service. */
type AppSession = Session & Partial<SessionData> & {
  userId?: string;
  user?: { _id: string; email: string; role: string };
};`
    : ''
}

/** Register a new user and create a session. */
export const registerUser = async (
  email${isTs ? ': string' : ''},
  password${isTs ? ': string' : ''},
  session${isTs ? ': AppSession' : ''}
) => {
  const existing = await User.findOne({ email });
  if (existing) throw createError(409, 'EMAIL_ALREADY_EXISTS');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash });

  // Regenerate session ID to prevent session fixation attacks
  await new Promise${isTs ? '<void>' : ''}((resolve, reject) =>
    session.regenerate((err${isTs ? ': Error' : ''}) => (err ? reject(err) : resolve()))
  );
  session.userId = user._id.toString();
  session.user = { _id: user._id.toString(), email: user.email, role: user.role };
${welcomeEmailBlock}
  return { user: { _id: user._id, email: user.email, role: user.role } };
};

/** Authenticate user and create a session. */
export const loginUser = async (
  email${isTs ? ': string' : ''},
  password${isTs ? ': string' : ''},
  session${isTs ? ': AppSession' : ''}
) => {
  const user = await User.findOne({ email });
  if (!user) throw createError(401, 'INVALID_CREDENTIALS');

  const valid = await user.isValidPassword(password);
  if (!valid) throw createError(401, 'INVALID_CREDENTIALS');

  // Regenerate session ID to prevent session fixation attacks
  await new Promise${isTs ? '<void>' : ''}((resolve, reject) =>
    session.regenerate((err${isTs ? ': Error' : ''}) => (err ? reject(err) : resolve()))
  );
  session.userId = user._id.toString();
  session.user = { _id: user._id.toString(), email: user.email, role: user.role };

  return { user: { _id: user._id, email: user.email, role: user.role } };
};

/** Get user by ID (for /me endpoint). */
export const getUserById = async (userId${isTs ? ': string' : ''}) => {
  const user = await User.findById(userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
  if (!user) throw createError(404, 'USER_NOT_FOUND');
  return { user };
};

/** Update user profile fields. */
export const updateProfile = async (
  userId${isTs ? ': string' : ''},
  data${isTs ? ': { name?: string }' : ''}
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name: data.name } },
    { new: true, runValidators: true }
  ).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
  if (!user) throw createError(404, 'USER_NOT_FOUND');
  return { user };
};

/** Change password (requires current password). */
export const changePassword = async (
  userId${isTs ? ': string' : ''},
  data${isTs ? ': { currentPassword: string; newPassword: string }' : ''}
) => {
  const user = await User.findById(userId);
  if (!user) throw createError(404, 'USER_NOT_FOUND');

  const valid = await user.isValidPassword(data.currentPassword);
  if (!valid) throw createError(401, 'INVALID_CURRENT_PASSWORD');

  user.passwordHash = await User.hashPassword(data.newPassword);
  await user.save();
${passwordChangedEmailBlock}
  return { message: 'PASSWORD_CHANGED' };
};
${forgotPasswordBlock}

/** Reset password using a valid token. */
export const resetPassword = async (
  token${isTs ? ': string' : ''},
  newPassword${isTs ? ': string' : ''}
) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw createError(400, 'INVALID_OR_EXPIRED_TOKEN');

  user.passwordHash = await User.hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'PASSWORD_RESET_SUCCESS' };
};
`;
}

// ── Controller ────────────────────────────────────────────────────────────────

function generateAuthController(isTs) {
  // Plain async functions — the route loader wraps them automatically.
  const req = isTs ? 'req: any, res: any' : 'req, res';

  return `import * as authService from './auth.service.js';
import { config } from '@/config/config.js';

// Plain async functions.
// The route loader automatically wraps all async handlers — no manual wrapping needed.

const saveSession = (session${isTs ? ': any' : ''}) =>
  new Promise${isTs ? '<void>' : ''}((resolve, reject) =>
    session.save((err${isTs ? ': Error' : ''}) => (err ? reject(err) : resolve()))
  );

export const register = async (${req}) => {
  const { email, password } = req.body;
  const response = await authService.registerUser(email, password, req.session);
  await saveSession(req.session);
  res.status(201).json(response);
};

export const login = async (${req}) => {
  const { email, password } = req.body;
  const response = await authService.loginUser(email, password, req.session);
  await saveSession(req.session);
  res.status(200).json(response);
};

export const me = async (${req}) => {
  const response = await authService.getUserById(req.userId);
  res.status(200).json(response);
};

export const updateProfile = async (${req}) => {
  const response = await authService.updateProfile(req.userId, req.body);
  res.status(200).json(response);
};

export const changePassword = async (${req}) => {
  const response = await authService.changePassword(req.userId, req.body);
  res.status(200).json(response);
};

export const logout = async (${req}) => {
  await new Promise${isTs ? '<void>' : ''}((resolve, reject) =>
    req.session.destroy((err${isTs ? ': Error' : ''}) => (err ? reject(err) : resolve()))
  );
  res.clearCookie(config.session.cookieName);
  res.status(200).json({ message: 'LOGGED_OUT' });
};

export const forgotPassword = async (${req}) => {
  const response = await authService.forgotPassword(req.body.email);
  res.status(200).json(response);
};

export const resetPassword = async (${req}) => {
  const { token, newPassword } = req.body;
  const response = await authService.resetPassword(token, newPassword);
  res.status(200).json(response);
};
`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

function generateAuthRoutes(isTs, config) {
  return `import express from 'express';
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
`;
}
