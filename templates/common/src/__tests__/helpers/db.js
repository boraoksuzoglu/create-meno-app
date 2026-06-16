import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  const tmpFile = path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp');
  fs.writeFileSync(tmpFile, uri);
  global.__MONGOD__ = mongod;

  // Test environment variables — config.js validates these at import time.
  // Workers are forked after globalSetup, so they inherit everything set here.
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = uri;
  process.env.SESSION_SECRET = 'test-session-secret-test-session-secret';
  // Dummy values so the central config loads even when optional features
  // (email / GCS upload) are enabled — they are never actually called in tests.
  process.env.GMAIL_CLIENT_ID ??= 'test-client-id';
  process.env.GMAIL_CLIENT_SECRET ??= 'test-client-secret';
  process.env.GMAIL_REDIRECT_URI ??= 'https://example.com/oauth';
  process.env.GMAIL_REFRESH_TOKEN ??= 'test-refresh-token';
  process.env.GMAIL_USER_EMAIL ??= 'test@example.com';
  process.env.GCS_BUCKET_NAME ??= 'test-bucket';
  process.env.GCS_PROJECT_ID ??= 'test-project';
  process.env.GCS_KEY_FILE ??= 'test-key.json';
  process.env.GOOGLE_CLIENT_IDS ??= 'test-google-client-id';
  process.env.APPLE_CLIENT_IDS ??= 'test-apple-client-id';
}
