import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { categories } from './schema';

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client);

  const initialCategories = [
    { name: '이미지 생성', sortOrder: 1 },
    { name: '영상 생성', sortOrder: 2 },
    { name: '음성/음악 AI', sortOrder: 3 },
    { name: '코딩 도구', sortOrder: 4 },
    { name: '챗봇/에이전트', sortOrder: 5 },
    { name: '생산성 도구', sortOrder: 6 },
    { name: '기타', sortOrder: 7 },
  ];

  console.log('Seeding categories...');
  for (const cat of initialCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
