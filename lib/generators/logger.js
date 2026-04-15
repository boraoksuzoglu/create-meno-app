export function generateLoggerUtil(lang) {
  const isTs = lang === 'ts';

  return `import winston from 'winston';
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

const consoleFormat = winston.format.printf(
  ({ level, message, timestamp${isTs ? ': ts' : ''}, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    const line = \`\${timestamp} [\${level.toUpperCase()}]: \${message}\${metaStr}\`;
    if (level === 'error') return colors.error(line);
    if (level === 'warn')  return colors.warn(line);
    if (level === 'info')  return colors.info(line);
    return colors.debug(line);
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
const rotatingFile = (name${isTs ? ': string' : ''}, level${isTs ? '?: string' : ''}) =>
  new DailyRotateFile({
    filename: path.join(logsRoot, '%DATE%', \`\${name}.log\`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    ...(level ? { level } : {}),
    format: fileFormat,
  });

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    rotatingFile('combined'),
    rotatingFile('error', 'error'),
  ],
});

// Console output only outside production
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
      silent: process.env.NODE_ENV === 'test',
    })
  );
}

export const logError = (err${isTs ? ': Error | string' : ''}, meta${isTs ? ': Record<string, unknown>' : ''} = {}) => {
  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack, ...meta });
  } else {
    logger.error(err, meta);
  }
};

export const logWarning = (message${isTs ? ': string' : ''}, meta${isTs ? ': Record<string, unknown>' : ''} = {}) => {
  logger.warn(message, meta);
};

export default logger;
`;
}
