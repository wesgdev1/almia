import { prisma } from "../../../database.js";
import { METODOS } from "./model.js";

/**
 * Registra la respuesta de una invitacion (usado por el invitado y por el admin).
 * asistira=true  -> CONFIRMADO con cuposConfirmados (1..cupos, default = cupos)
 * asistira=false -> RECHAZADO con 0 cupos
 */
export const responderInvitacion = async (
  invitacion,
  body = {},
  metodoDefault = "WEB",
) => {
  const { asistira, mensaje } = body;
  const metodo = body.metodo || metodoDefault;

  if (typeof asistira !== "boolean") {
    throw { message: "asistira (true/false) es requerido", status: 400 };
  }
  if (!METODOS.includes(metodo)) {
    throw {
      message: `metodo debe ser uno de: ${METODOS.join(", ")}`,
      status: 400,
    };
  }

  let cuposConfirmados = 0;
  if (asistira) {
    cuposConfirmados =
      body.cuposConfirmados === undefined
        ? invitacion.cupos
        : Number(body.cuposConfirmados);

    if (
      !Number.isInteger(cuposConfirmados) ||
      cuposConfirmados < 1 ||
      cuposConfirmados > invitacion.cupos
    ) {
      throw {
        message: `cuposConfirmados debe estar entre 1 y ${invitacion.cupos}`,
        status: 400,
      };
    }
  }

  const data = {
    estado: asistira ? "CONFIRMADO" : "RECHAZADO",
    cuposConfirmados,
    metodoConfirmacion: metodo,
    fechaRespuesta: new Date(),
  };
  if (mensaje !== undefined) {
    data.mensaje = mensaje ? String(mensaje).trim() : null;
  }

  return prisma.invitacion.update({ where: { id: invitacion.id }, data });
};

export const getStats = async () => {
  const [porEstado, totales, enviadas, vistas] = await Promise.all([
    prisma.invitacion.groupBy({
      by: ["estado"],
      _count: { _all: true },
      _sum: { cupos: true, cuposConfirmados: true },
    }),
    prisma.invitacion.aggregate({
      _count: { _all: true },
      _sum: { cupos: true, cuposConfirmados: true },
    }),
    prisma.invitacion.count({ where: { enviada: true } }),
    prisma.invitacion.count({ where: { vistas: { gt: 0 } } }),
  ]);

  const estado = (e) => porEstado.find((x) => x.estado === e);
  const total = totales._count._all;

  return {
    invitaciones: {
      total,
      enviadas,
      sinEnviar: total - enviadas,
      vistas,
      pendientes: estado("PENDIENTE")?._count._all || 0,
      confirmadas: estado("CONFIRMADO")?._count._all || 0,
      rechazadas: estado("RECHAZADO")?._count._all || 0,
    },
    personas: {
      cuposTotales: totales._sum.cupos || 0,
      confirmadas: totales._sum.cuposConfirmados || 0,
      pendientes: estado("PENDIENTE")?._sum.cupos || 0,
      rechazadas: estado("RECHAZADO")?._sum.cupos || 0,
    },
  };
};
