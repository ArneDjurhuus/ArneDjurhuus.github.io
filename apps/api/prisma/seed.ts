import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// Fallback typing when running outside ts-node with node types
declare const process: any;

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: ({
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: demoPasswordHash,
    } as any),
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
    create: ({
      id: 'clxryk4d7000008l4c34aef4e',
      spaceId: demoSpace.id,
      title: 'Complete the demo task',
      description: 'Try creating and moving tasks. This one is assigned to the demo user.',
      status: 'todo',
      assigneeId: demoUser.id,
    } as any),
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
