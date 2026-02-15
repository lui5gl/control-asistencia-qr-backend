import prisma from '../../config/prisma';

async function main() {
  console.log('Seeding database...');

  await prisma.user.deleteMany();

  const users = await prisma.user.createMany({
    data: [
      { 
        username: 'admin', 
        email: 'admin@example.com', 
        name: 'Admin User',
        password: 'hashed_password_admin'
      },
      { 
        username: 'test', 
        email: 'test@example.com', 
        name: 'Test User',
        password: 'hashed_password_test'
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
