import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs are organized by date subdirectory: logs/YYYY-MM-DD/combined.log
// This keeps the logs/ root clean instead of having dozens of flat files.
const logsRoot = path.join(__dirname, '../../logs');

colors.setTheme({ error: 'red', warn: 'yellow', info: 'cyan', debug: 'green' });

// Logger initializes before the config module to avoid circular dependencies.
// Reading NODE_ENV directly here is intentional and safe.
const NODE_ENV = process.env.NODE_ENV || 'development';

// colors.setTheme() adds these methods at runtime; they aren't in the package types.
const paint = colors as unknown as Record<'error' | 'warn' | 'info' | 'debug', (s: string) => string>;

const consoleFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    const line = `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
    if (level === 'error') return paint.error(line);
    if (level === 'warn')  return paint.warn(line);
    if (level === 'info')  return paint.info(line);
    return paint.debug(line);
  }
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Creates a DailyRotateFile transport.
 * Files land in  logs/YYYY-MM-DD/<name>.log
 * so each day gets its own sub-folder — no flat clutter in logs/.
 */
const rotatingFile = (name: string, level?: string) =>
  new DailyRotateFile({
    filename: path.join(logsRoot, '%DATE%', `${name}.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    ...(level ? { level } : {}),
    format: fileFormat,
  });

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    rotatingFile('combined'),
    rotatingFile('error', 'error'),
  ],
});

// Console output only outside production
if (NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
      silent: NODE_ENV === 'test',
    })
  );
}
export const logError = (err: Error | string, meta: Record<string, unknown> = {}) => {
  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack, ...meta });
  } else {
    logger.error(err, meta);
  }
};

export const logWarning = (message: string, meta: Record<string, unknown> = {}) => {
  logger.warn(message, meta);
};

export default logger;
