export function generateEmailService(config) {
  const { language, emailMultiLang } = config;
  const isTs = language === 'ts';

  const localeImports = emailMultiLang
    ? `import { en } from '@/locales/email/en.js';
import { tr } from '@/locales/email/tr.js';`
    : '';

  const getLocale = emailMultiLang
    ? `/** Returns the locale object for the given language code. */
export const getEmailLocale = (lang${isTs ? ": 'en' | 'tr'" : ''}) => (lang === 'en' ? en : tr);`
    : `/** Single-language mode — always returns English strings. */
export const getEmailLocale = (_lang${isTs ? ': string' : ''}) => ({
  subjects: {
    welcome: (name${isTs ? ': string' : ''}) => \`Welcome, \${name}!\`,
    forgotPassword: () => 'Reset your password',
    passwordChanged: () => 'Your password has been changed',
  },
  common: {
    greeting: 'Hello,',
    teamSignature: 'Best regards,',
    teamName: 'The Team',
    copyright: 'All rights reserved.',
  },
});`;

  return `import { google } from 'googleapis';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { convert } from 'html-to-text';
import pLimit from 'p-limit';
import { config } from '@/config/config.js';
${config.includeLogger ? "import logger from '@/utils/logger.js';" : ''}
${localeImports}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── OAuth2 client ─────────────────────────────────────────────────────────────

const createOAuth2Client = () => {
  const client = new google.auth.OAuth2(
    config.email.clientId,
    config.email.clientSecret,
    config.email.redirectUri
  );
  client.setCredentials({ refresh_token: config.email.refreshToken });
  return client;
};

// ── Template cache ────────────────────────────────────────────────────────────

const templateCache = new Map${isTs ? '<string, HandlebarsTemplateDelegate>' : ''}();

const renderTemplate = async (
  templateName${isTs ? ': string' : ''},
  data${isTs ? ': Record<string, unknown>' : ''}
)${isTs ? ': Promise<string>' : ''} => {
  let tpl = templateCache.get(templateName);
  if (!tpl) {
    const filePath = path.join(__dirname, '../../templates/emails', \`\${templateName}.hbs\`);
    const src = await fs.readFile(filePath, 'utf-8');
    tpl = handlebars.compile(src);
    templateCache.set(templateName, tpl);
  }
  return tpl(data);
};

// ── Message builder ───────────────────────────────────────────────────────────

const encodeSubject = (subject${isTs ? ': string' : ''}) =>
  /^[\\x00-\\x7F]*$/.test(subject)
    ? subject
    : \`=?UTF-8?B?\${Buffer.from(subject).toString('base64')}?=\`;

const buildRawMessage = (
  to${isTs ? ': string' : ''},
  subject${isTs ? ': string' : ''},
  html${isTs ? ': string' : ''}
) => {
  const from = \`"\${config.email.senderName}" <\${config.email.userEmail}>\`;
  const text = convert(html, { wordwrap: 80 });
  const boundary = \`----=_Part_\${crypto.randomBytes(8).toString('hex')}\`;
  const parts = [
    \`From: \${from}\`,
    \`To: \${to}\`,
    \`Subject: \${encodeSubject(subject)}\`,
    'MIME-Version: 1.0',
    \`Content-Type: multipart/alternative; boundary="\${boundary}"\`,
    '',
    \`--\${boundary}\`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
    '',
    \`--\${boundary}\`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
    \`--\${boundary}--\`,
  ];
  return Buffer.from(parts.join('\\n')).toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a raw HTML email via Gmail API.
 */
export const sendEmail = async (
  to${isTs ? ': string' : ''},
  subject${isTs ? ': string' : ''},
  html${isTs ? ': string' : ''}
) => {
  const auth = createOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = buildRawMessage(to, subject, html);
  const result = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  ${config.includeLogger ? "logger.info('EMAIL_SENT', { to, subject, messageId: result.data.id });" : "console.log('[Email] sent to', to);"}
  return { messageId: result.data.id };
};

/**
 * Render a Handlebars template and send it.
 */
export const sendTemplateEmail = async (
  to${isTs ? ': string' : ''},
  subject${isTs ? ': string' : ''},
  templateName${isTs ? ': string' : ''},
  data${isTs ? ': Record<string, unknown>' : ''}
) => {
  const html = await renderTemplate(templateName, data);
  return sendEmail(to, subject, html);
};

/**
 * Send emails in parallel (max 5 concurrent — Gmail rate limit safety).
 */
export const sendBulkEmails = async (
  emails${isTs ? ': Array<{ to: string; subject: string; templateName: string; data: Record<string, unknown> }>' : ''}
) => {
  const limit = pLimit(5);
  const results = { success: [] ${isTs ? 'as any[]' : ''}, failed: [] ${isTs ? 'as any[]' : ''} };

  await Promise.all(
    emails.map((e) =>
      limit(async () => {
        try {
          const r = await sendTemplateEmail(e.to, e.subject, e.templateName, e.data);
          results.success.push({ ...e, result: r });
        } catch (err${isTs ? ': any' : ''}) {
          results.failed.push({ ...e, error: err.message });
        }
      })
    )
  );

  return results;
};

${getLocale}

export default { sendEmail, sendTemplateEmail, sendBulkEmails, getEmailLocale };
`;
}
