import { defineConfig } from '@prisma/client/adapter';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
