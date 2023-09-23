import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function seedTable(table: string) {
  try {
    const models = Object.keys(prisma).filter(
      (key) => key.startsWith('_') === false
    );

    // check model in models
    if (models.includes(table)) {
      const data = require(`./seed/${table}.json`);
      console.log(data)
      // clean db
      await prisma[table].deleteMany({});

      const res = await prisma.$transaction([
        ...data.map((item) => {
          // delete item.id;
          return prisma[table].create({ data: item });
        }),
      ]);
      //
    } else {
    }
  } catch (err) {}
}

async function main() {
  await seedTable('role');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
