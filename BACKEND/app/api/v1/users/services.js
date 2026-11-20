import { prisma } from "../../../database.js";

export const createUser = async ({ email, name }, password) => {
  return prisma.user.create({
    data: { email: email.toLowerCase().trim(), name, password },
  });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
};

export const countUsers = async () => prisma.user.count();
