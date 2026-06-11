import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { buildApp } from './helpers/app.js';

let app;

beforeAll(async () => {
  const uri = fs.readFileSync(path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp'), 'utf8');
  await mongoose.connect(uri);
  app = await buildApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth', () => {
  const email = 'test@example.com';
  const password = 'Password123!';

  it('POST /auth/register — creates user', async () => {
    const res = await request(app).post('/auth/register').send({ email, password, confirmPassword: password });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
  });

  it('POST /auth/register — duplicate email returns 409', async () => {
    const res = await request(app).post('/auth/register').send({ email, password, confirmPassword: password });
    expect(res.status).toBe(409);
  });

  it('POST /auth/register — weak password returns 422', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'other@example.com', password: 'weakpass', confirmPassword: 'weakpass' });
    expect(res.status).toBe(422);
  });

  it('POST /auth/login — valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.status).toBe(200);
  });

  it('POST /auth/login — wrong password returns 401', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'WrongPassword123!' });
    expect(res.status).toBe(401);
  });

  it('GET /auth/me — unauthenticated returns 401', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /auth/me — authenticated returns user', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email, password });
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('POST /auth/logout — destroys session', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email, password });
    const logout = await agent.post('/auth/logout');
    expect(logout.status).toBe(200);
    const me = await agent.get('/auth/me');
    expect(me.status).toBe(401);
  });

  it('POST /auth/forgot-password — always returns 200 (enumeration safe)', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: 'nonexistent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('RESET_EMAIL_SENT');
  });

  it('PUT /auth/profile — updates name', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email, password });
    const res = await agent.put('/auth/profile').send({ name: 'Test User' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Test User');
  });

  it('PUT /auth/password — changes password', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email, password });
    const newPassword = 'NewPassword456!';
    const res = await agent.put('/auth/password').send({
      currentPassword: password,
      newPassword,
      confirmNewPassword: newPassword,
    });
    expect(res.status).toBe(200);
    // Verify new password works
    const login = await request(app).post('/auth/login').send({ email, password: newPassword });
    expect(login.status).toBe(200);
  });

  it('GET /health — returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
