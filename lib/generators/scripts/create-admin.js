export function generateCreateAdminScript(config) {
  const { language } = config;
  const isTs = language === 'ts';

  return `/**
 * Create Admin Script
 * ───────────────────
 * Creates the first admin user in the database.
 *
 * Usage:
 *   node src/scripts/create-admin.js
 *
 * Set ADMIN_EMAIL / ADMIN_PASSWORD env vars or the script will prompt you.
 */
import 'dotenv/config';
import readline from 'readline';
import databaseConnection from '@/utils/database.js';
import User from '@/models/user.model.js';

const ask = (question${isTs ? ': string' : ''})${isTs ? ': Promise<string>' : ''} =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });

const run = async () => {
  await databaseConnection.connect();

  const email    = process.env.ADMIN_EMAIL    || await ask('Admin email: ');
  const password = process.env.ADMIN_PASSWORD || await ask('Admin password (min 6 chars): ');

  if (!email || !password || password.length < 6) {
    console.error('Invalid email or password.');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(\`Admin already exists: \${email}\`);
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log(\`Upgraded \${email} to admin.\`);
    }
    process.exit(0);
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({ email, passwordHash, role: 'admin' });

  console.log(\`✓ Admin created: \${email}\`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
`;
}
