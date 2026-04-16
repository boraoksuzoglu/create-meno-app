export function generateEnvFiles(config) {
  const { includeUpload, uploadProvider, includeEmail } = config;

  let env = `# ── App ──────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
APP_NAME=${config.projectName}
FRONTEND_URL=http://localhost:3001

# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/${config.projectName}

# ── Session ───────────────────────────────────────────────────────────────────
SESSION_SECRET=change_this_to_a_random_32_char_string_in_production
SESSION_COOKIE_NAME=sid

# ── CORS (comma-separated origins) ───────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
`;

  if (includeUpload && uploadProvider === 'local') {
    env += `
# ── File Upload (local) ───────────────────────────────────────────────────────
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
`;
  }

  if (includeUpload && uploadProvider === 'gcs') {
    env += `
# ── Google Cloud Storage ─────────────────────────────────────────────────────
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id
GCS_KEY_FILE=path/to/service-account-key.json
`;
  }

  if (includeEmail) {
    env += `
# ── Gmail API ─────────────────────────────────────────────────────────────────
# Follow the setup guide in README.md to obtain these credentials.
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER_EMAIL=your@gmail.com
GMAIL_SENDER_NAME=${config.projectName}
`;
  }

  return env;
}
