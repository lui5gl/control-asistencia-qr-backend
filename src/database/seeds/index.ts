import prisma from '../../config/prisma';

async function main() {
  console.log('Seeding database...');

  await prisma.user.deleteMany();

  const users = await prisma.user.createMany({
    data: [
      { email: 'admin@example.com', name: 'Admin User' },
      { email: 'test@example.com', name: 'Test User' }
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
