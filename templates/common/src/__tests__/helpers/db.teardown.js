import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  if (global.__MONGOD__) await global.__MONGOD__.stop();
  const tmpFile = path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp');
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}
