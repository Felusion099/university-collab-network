import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    const username = process.argv[2];

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        studentProfile: true,
        privacySettings: true,
      },
    });

    console.log(JSON.stringify(user, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
