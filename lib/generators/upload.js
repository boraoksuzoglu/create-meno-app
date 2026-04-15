export function generateUploadUtil(config) {
  const { language, uploadProvider } = config;
  const isTs = language === 'ts';
  const isGcs = uploadProvider === 'gcs';

  if (isGcs) {
    return generateGcsUpload(isTs);
  }
  return generateLocalUpload(isTs);
}

function generateLocalUpload(isTs) {
  return `import multer from 'multer';
import path from 'path';
import fs from 'fs';
import createError from 'http-errors';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 10);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, \`\${Date.now()}-\${Math.random().toString(36).slice(2)}\${ext}\`);
  },
});

const fileFilter = (
  _req${isTs ? ': any' : ''},
  file${isTs ? ': Express.Multer.File' : ''},
  cb${isTs ? ': multer.FileFilterCallback' : ''}
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'INVALID_FILE_TYPE')${isTs ? ' as any' : ''}, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

/** Delete a local file (non-throwing) */
export const deleteFile = (filePath${isTs ? ': string' : ''}) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // non-critical
  }
};
`;
}

function generateGcsUpload(isTs) {
  return `import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import createError from 'http-errors';
import path from 'path';

// ── GCS client ────────────────────────────────────────────────────────────────
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
});

let _bucket${isTs ? ': ReturnType<Storage["bucket"]> | null' : ''} = null;

const getBucket = () => {
  if (_bucket) return _bucket;
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) throw createError(500, 'GCS_BUCKET_NOT_CONFIGURED');
  _bucket = storage.bucket(name);
  return _bucket;
};

// ── Multer (memory storage — buffer goes straight to GCS) ────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MIME_EXT${isTs ? ': Record<string, string>' : ''} = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/gif': 'gif', 'image/webp': 'webp',
};

const fileFilter = (
  _req${isTs ? ': any' : ''},
  file${isTs ? ': Express.Multer.File' : ''},
  cb${isTs ? ': multer.FileFilterCallback' : ''}
) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'INVALID_FILE_TYPE')${isTs ? ' as any' : ''}, false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ── Signed URL cache (LRU, max 2000 entries) ─────────────────────────────────
const URL_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const SAFE_WINDOW_MS = 30_000;
const MAX_CACHE = 2000;
const urlCache = new Map${isTs ? '<string, { url: string; expiresAt: number }>' : ''}();
const inFlight = new Map${isTs ? '<string, Promise<string>>' : ''}();

const cacheGet = (key${isTs ? ': string' : ''}) => {
  const entry = urlCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt - Date.now() <= SAFE_WINDOW_MS) { urlCache.delete(key); return null; }
  urlCache.delete(key); urlCache.set(key, entry); // LRU touch
  return entry.url;
};

const cacheSet = (key${isTs ? ': string' : ''}, url${isTs ? ': string' : ''}, expiresAt${isTs ? ': number' : ''}) => {
  if (urlCache.size >= MAX_CACHE) urlCache.delete(urlCache.keys().next().value${isTs ? ' as string' : ''});
  urlCache.set(key, { url, expiresAt });
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to GCS.
 * @returns GCS file path (store this in your DB, not the signed URL)
 */
export const uploadToGCS = async (
  buffer${isTs ? ': Buffer' : ''},
  originalName${isTs ? ': string' : ''},
  mimetype${isTs ? ': string' : ''},
  folder${isTs ? ': string' : ''} = 'uploads'
)${isTs ? ': Promise<string>' : ''} => {
  const ext = MIME_EXT[mimetype] || path.extname(originalName).replace('.', '') || 'bin';
  const fileName = \`\${folder}/\${uuidv4()}.\${ext}\`;
  const blob = getBucket().file(fileName);

  await new Promise${isTs ? '<void>' : ''}((resolve, reject) => {
    const stream = blob.createWriteStream({ resumable: false, metadata: { contentType: mimetype } });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(buffer);
  });

  return fileName;
};

/**
 * Get a cached signed URL for a GCS file path.
 */
export const getSignedUrl = async (
  fileName${isTs ? ': string | null | undefined' : ''},
  expiresInMs${isTs ? ': number' : ''} = URL_TTL_MS
)${isTs ? ': Promise<string | null>' : ''} => {
  if (!fileName) return null;

  const key = \`\${fileName}:\${expiresInMs}\`;
  const cached = cacheGet(key);
  if (cached) return cached;

  if (inFlight.has(key)) return inFlight.get(key)${isTs ? '!' : ''};

  const promise = (async () => {
    const expiresAt = new Date(Date.now() + expiresInMs);
    const [url] = await getBucket().file(fileName).getSignedUrl({ action: 'read', expires: expiresAt });
    cacheSet(key, url, expiresAt.getTime());
    return url;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
};

/**
 * Delete a file from GCS (non-throwing — logs 404 as warning).
 */
export const deleteFromGCS = async (filePath${isTs ? ': string | null | undefined' : ''}) => {
  if (!filePath) return;
  try {
    await getBucket().file(filePath).delete();
  } catch (err${isTs ? ': any' : ''}) {
    if (err?.code !== 404) throw createError(500, 'FILE_DELETE_ERROR');
  }
};
`;
}
