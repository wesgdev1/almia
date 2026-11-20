// Crea el admin inicial desde .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD)
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const { ADMIN_NAME = "Admin", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env");
  }

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const password = await hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: ADMIN_NAME, password },
    create: { email, name: ADMIN_NAME, password },
  });

  console.log(`Admin listo: ${user.email}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
