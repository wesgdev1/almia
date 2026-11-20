import { Router } from "express";

import { router as users } from "./users/routes.js";
import { router as invitaciones } from "./invitaciones/routes.js";
import { router as publicRoutes } from "./public/routes.js";

// eslint-disable-next-line new-cap
export const router = Router();

router.use("/users", users); // admin: login / registro
router.use("/invitaciones", invitaciones); // admin: CRUD, enviar, stats
router.use("/public", publicRoutes); // invitado: ver y responder por uuid
