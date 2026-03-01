import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env');
const secret = crypto.randomBytes(64).toString('hex');

if (!fs.existsSync(ENV_PATH)) {
  fs.writeFileSync(ENV_PATH, `JWT_SECRET=${secret}\n`);
  console.log(`✔ Created .env with JWT_SECRET`);
} else {
  let content = fs.readFileSync(ENV_PATH, 'utf-8');

  if (/^JWT_SECRET=.*/m.test(content)) {
    content = content.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${secret}`);
    console.log(`✔ Updated JWT_SECRET in .env`);
  } else {
    content += `\nJWT_SECRET=${secret}\n`;
    console.log(`✔ Added JWT_SECRET to .env`);
  }

  fs.writeFileSync(ENV_PATH, content);
}

console.log(`   Secret: ${secret}`);
