import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import createError from 'http-errors';
import path from 'path';
import { config } from '@/config/config.js';

// ── GCS client ────────────────────────────────────────────────────────────────
const storage = new Storage({
  projectId: config.gcs.projectId,
  keyFilename: config.gcs.keyFile,
});

let _bucket: ReturnType<Storage["bucket"]> | null = null;

const getBucket = () => {
  if (_bucket) return _bucket;
  _bucket = storage.bucket(config.gcs.bucketName);
  return _bucket;
};

// ── Multer (memory storage — buffer goes straight to GCS) ────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/gif': 'gif', 'image/webp': 'webp',
};

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'INVALID_FILE_TYPE') as any, false);
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
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const inFlight = new Map<string, Promise<string>>();

const cacheGet = (key: string) => {
  const entry = urlCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt - Date.now() <= SAFE_WINDOW_MS) { urlCache.delete(key); return null; }
  urlCache.delete(key); urlCache.set(key, entry); // LRU touch
  return entry.url;
};

const cacheSet = (key: string, url: string, expiresAt: number) => {
  if (urlCache.size >= MAX_CACHE) urlCache.delete(urlCache.keys().next().value as string);
  urlCache.set(key, { url, expiresAt });
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to GCS.
 * @returns GCS file path (store this in your DB, not the signed URL)
 */
export const uploadToGCS = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder: string = 'uploads'
): Promise<string> => {
  const ext = MIME_EXT[mimetype] || path.extname(originalName).replace('.', '') || 'bin';
  const fileName = `${folder}/${uuidv4()}.${ext}`;
  const blob = getBucket().file(fileName);

  await new Promise<void>((resolve, reject) => {
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
  fileName: string | null | undefined,
  expiresInMs: number = URL_TTL_MS
): Promise<string | null> => {
  if (!fileName) return null;

  const key = `${fileName}:${expiresInMs}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  if (inFlight.has(key)) return inFlight.get(key)!;

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
export const deleteFromGCS = async (filePath: string | null | undefined) => {
  if (!filePath) return;
  try {
    await getBucket().file(filePath).delete();
  } catch (err: any) {
    if (err?.code !== 404) throw createError(500, 'FILE_DELETE_ERROR');
  }
};
