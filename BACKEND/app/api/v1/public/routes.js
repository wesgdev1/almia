import { Router } from "express";
import * as controller from "./controller.js";

// eslint-disable-next-line new-cap
export const router = Router();

/**
 * (PUBLICO - lo usa la invitacion del front con el uuid del link)
 * /api/v1/public/invitaciones/:id            GET  - datos de la invitacion (+1 vista)
 * /api/v1/public/invitaciones/:id/responder  POST - confirmar / rechazar
 */
router.param("id", controller.id);

router.route("/invitaciones/:id").get(controller.read);
router.route("/invitaciones/:id/responder").post(controller.responder);
