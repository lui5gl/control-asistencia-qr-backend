import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const testPassword = await bcrypt.hash('test123', 10);

  const users = await prisma.user.createMany({
    data: [
      { 
        username: 'admin', 
        email: 'admin@example.com', 
        name: 'Admin User',
        password: adminPassword
      },
      { 
        username: 'test', 
        email: 'test@example.com', 
        name: 'Test User',
        password: testPassword
      }
    ]
  });

  console.log(`Created ${users.count} users`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
