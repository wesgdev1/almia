import { prisma } from "../../../database.js";
import { signToken, auth } from "../auth.js";
import { encryptPassword, verifyPassword, sanitize } from "./model.js";
import { createUser, findUserByEmail, countUsers } from "./services.js";

/**
 * Registro abierto SOLO si no existe ningún admin.
 * Luego, solo un admin logueado puede crear otro.
 */
export const canSignup = async (req, res, next) => {
  try {
    const total = await countUsers();
    if (total === 0) return next();
    return auth(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  const { body = {} } = req;
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return next({ message: "email, name y password son requeridos", status: 400 });
  }

  try {
    const hashed = await encryptPassword(password);
    const user = await createUser(body, hashed);

    res.status(201).json({
      data: sanitize(user),
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next({ message: "email y password son requeridos", status: 400 });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return next({ message: "Invalid credentials", status: 401 });
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return next({ message: "Invalid credentials", status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email });

    res.status(200).json({
      data: sanitize(user),
      meta: { token },
      message: "User logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.decoded.id },
    });
    if (!user) return next({ message: "User not found", status: 404 });
    res.json({ data: sanitize(user) });
  } catch (error) {
    next(error);
  }
};
