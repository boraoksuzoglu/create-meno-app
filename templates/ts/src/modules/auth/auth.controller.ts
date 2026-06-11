import * as authService from './auth.service.js';
import { config } from '@/config/config.js';

// Plain async functions.
// The route loader automatically wraps all async handlers — no manual wrapping needed.

const saveSession = (session: any) =>
  new Promise<void>((resolve, reject) =>
    session.save((err: Error) => (err ? reject(err) : resolve()))
  );

// Regenerate the session ID to prevent session-fixation attacks.
// regenerate() replaces req.session with a fresh object, so callers must read
// req.session again afterwards (which is why this runs before the service call).
const regenerateSession = (session: any) =>
  new Promise<void>((resolve, reject) =>
    session.regenerate((err: Error) => (err ? reject(err) : resolve()))
  );

export const register = async (req: any, res: any) => {
  const { email, password } = req.body;
  await regenerateSession(req.session);
  const response = await authService.registerUser(email, password, req.session);
  await saveSession(req.session);
  res.status(201).json(response);
};

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  await regenerateSession(req.session);
  const response = await authService.loginUser(email, password, req.session);
  await saveSession(req.session);
  res.status(200).json(response);
};

export const me = async (req: any, res: any) => {
  const response = await authService.getUserById(req.userId);
  res.status(200).json(response);
};

export const updateProfile = async (req: any, res: any) => {
  const response = await authService.updateProfile(req.userId, req.body);
  res.status(200).json(response);
};

export const changePassword = async (req: any, res: any) => {
  const response = await authService.changePassword(req.userId, req.body);
  res.status(200).json(response);
};

export const logout = async (req: any, res: any) => {
  await new Promise<void>((resolve, reject) =>
    req.session.destroy((err: Error) => (err ? reject(err) : resolve()))
  );
  res.clearCookie(config.session.cookieName);
  res.status(200).json({ message: 'LOGGED_OUT' });
};

export const forgotPassword = async (req: any, res: any) => {
  const response = await authService.forgotPassword(req.body.email);
  res.status(200).json(response);
};

export const resetPassword = async (req: any, res: any) => {
  const { token, newPassword } = req.body;
  const response = await authService.resetPassword(token, newPassword);
  res.status(200).json(response);
};
