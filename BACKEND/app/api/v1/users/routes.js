import { Router } from "express";
import * as controller from "./controller.js";
import { auth } from "../auth.js";

// eslint-disable-next-line new-cap
export const router = Router();

/**
 * /api/v1/users/signup POST - registrar admin (libre solo si no hay admins)
 * /api/v1/users/signin POST - login -> meta.token
 * /api/v1/users/me     GET  - admin logueado
 */
router.route("/signup").post(controller.canSignup, controller.signup);
router.route("/signin").post(controller.signin);
router.route("/me").get(auth, controller.me);
