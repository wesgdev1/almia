import { hash, compare } from "bcrypt";

export const fields = ["id", "email", "name", "createdAt", "updatedAt"];

export const encryptPassword = (password) => {
  return hash(password, 10);
};

export const verifyPassword = (password, encryptPassword) => {
  return compare(password, encryptPassword);
};

// Quita el password antes de responder
export const sanitize = ({ password, ...user }) => user;
