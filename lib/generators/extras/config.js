export function generateConfigModule(config) {
  const { language, includeEmail, includeUpload, uploadProvider } = config;
  const isTs = language === 'ts';

  const gcsBlock =
    includeUpload && uploadProvider === 'gcs'
      ? `
  gcs: {
    bucketName: requireEnv('GCS_BUCKET_NAME'),
    projectId:  requireEnv('GCS_PROJECT_ID'),
    keyFile:    requireEnv('GCS_KEY_FILE'),
  },`
      : '';

  const emailBlock = includeEmail
    ? `
  email: {
    clientId:     requireEnv('GMAIL_CLIENT_ID'),
    clientSecret: requireEnv('GMAIL_CLIENT_SECRET'),
    redirectUri:  requireEnv('GMAIL_REDIRECT_URI'),
    refreshToken: requireEnv('GMAIL_REFRESH_TOKEN'),
    userEmail:    requireEnv('GMAIL_USER_EMAIL'),
    senderName:   process.env.GMAIL_SENDER_NAME || appName,
  },`
    : '';

  return `/**
 * Central configuration module
 * ─────────────────────────────
 * All process.env reads happen here.
 * requireEnv() throws at startup if a required variable is missing —
 * so the app fails fast with a clear message instead of silently misbehaving.
 */

const requireEnv = (key${isTs ? ': string' : ''})${isTs ? ': string' : ''} => {
  const value = process.env[key];
  if (!value) throw new Error(\`Missing required environment variable: \${key}\`);
  return value;
};

const appName = process.env.APP_NAME || '${config.projectName}';

export const config = {
  app: {
    name:        appName,
    env:         process.env.NODE_ENV || 'development',
    port:        Number(process.env.PORT) || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    isProduction: process.env.NODE_ENV === 'production',
    isTest:       process.env.NODE_ENV === 'test',
  },

  db: {
    uri: requireEnv('MONGODB_URI'),
  },

  session: {
    secret: requireEnv('SESSION_SECRET'),
    ttlSeconds: 7 * 24 * 60 * 60,
  },

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map((o) => o.trim()),
  },
${gcsBlock}${emailBlock}
} as const;

export type Config = typeof config;
`.replace(
    /as const;\n\nexport type Config = typeof config;\n$/,
    isTs ? 'as const;\n\nexport type Config = typeof config;\n' : ';\n'
  );
}
