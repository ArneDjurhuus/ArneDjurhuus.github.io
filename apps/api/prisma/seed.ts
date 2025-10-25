import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  });

  // Ensure Demo Space has id '1' to match the web mock space
  const existingDemo = await prisma.space.findUnique({ where: { slug: 'demo' } });
  if (existingDemo && existingDemo.id !== '1') {
    await prisma.membership.deleteMany({ where: { spaceId: existingDemo.id } });
    await prisma.note.deleteMany({ where: { spaceId: existingDemo.id } });
    await prisma.task.deleteMany({ where: { spaceId: existingDemo.id } });
    await prisma.space.delete({ where: { id: existingDemo.id } });
  }
  const demoSpace = await prisma.space.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: '1',
      name: 'Demo Space',
      slug: 'demo',
      plan: 'free',
    },
  });

  await prisma.membership.upsert({
    where: { userId_spaceId: { userId: demoUser.id, spaceId: demoSpace.id } },
    update: {},
    create: {
      userId: demoUser.id,
      spaceId: demoSpace.id,
      role: 'admin',
    },
  });

  const demoNote = await prisma.note.upsert({
    where: { ydocId: 'demo-note-ydoc-id' },
    update: {},
    create: {
      spaceId: demoSpace.id,
      title: 'Demo Note',
      ydocId: 'demo-note-ydoc-id',
    },
  });

  await prisma.task.upsert({
    where: { id: 'clxryk4d7000008l4c34aef4e' },
    update: {},
    create: {
      id: 'clxryk4d7000008l4c34aef4e',
      spaceId: demoSpace.id,
      title: 'Complete the demo task',
      status: 'todo',
      assigneeId: demoUser.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
