import { configuration } from "../../../config.js";

const { frontend, whatsapp } = configuration;

export const ESTADOS = ["PENDIENTE", "CONFIRMADO", "RECHAZADO"];
export const METODOS = ["WEB", "WHATSAPP", "LLAMADA", "MANUAL"];

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Campos que el admin puede crear / editar
export const fields = ["destino", "telefono", "email", "grupo", "cupos", "notas"];

// Campos que ve el invitado (sin notas internas ni telefono)
export const publicSelect = {
  id: true,
  destino: true,
  cupos: true,
  cuposConfirmados: true,
  estado: true,
  mensaje: true,
  fechaRespuesta: true,
};

/**
 * Limpia y valida el body. partial=true para updates.
 * Retorna { data } o { error }
 */
export const parseBody = (body = {}, partial = false) => {
  const data = {};

  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (!partial || data.destino !== undefined) {
    if (!data.destino || !String(data.destino).trim()) {
      return { error: "destino es requerido" };
    }
    data.destino = String(data.destino).trim();
  }

  if (data.cupos !== undefined) {
    const cupos = Number(data.cupos);
    if (!Number.isInteger(cupos) || cupos < 1) {
      return { error: "cupos debe ser un entero mayor a 0" };
    }
    data.cupos = cupos;
  }

  if (data.telefono !== undefined) {
    data.telefono = data.telefono
      ? String(data.telefono).replace(/\D/g, "")
      : null;
  }

  for (const key of ["email", "grupo", "notas"]) {
    if (data[key] !== undefined) {
      data[key] = data[key] ? String(data[key]).trim() : null;
    }
  }

  return { data };
};

export const buildLink = (id) => `${frontend.url}/invitacion/${id}`;

// Normaliza telefono para wa.me (ej: 3001234567 -> 573001234567)
const phoneForWhatsapp = (telefono) => {
  if (!telefono) return null;
  const digits = String(telefono).replace(/\D/g, "");
  if (digits.length === 10) return `${whatsapp.countryCode}${digits}`;
  return digits;
};

export const buildMensaje = (invitacion, link) => {
  const cupos = invitacion.cupos === 1 ? "1 cupo" : `${invitacion.cupos} cupos`;
  return (
    `¡Hola ${invitacion.destino}! 💍\n\n` +
    `Con mucha alegría queremos invitarte a nuestro matrimonio.\n` +
    `Esta invitación es para ${cupos}.\n\n` +
    `Abre tu invitación y confirma tu asistencia aquí:\n${link}`
  );
};

export const buildWhatsappUrl = (invitacion, mensaje) => {
  const phone = phoneForWhatsapp(invitacion.telefono);
  const text = encodeURIComponent(mensaje);
  return phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
};

// Agrega el link a cada invitacion que se devuelve al admin
export const withLink = (invitacion) => ({
  ...invitacion,
  link: buildLink(invitacion.id),
});

// Solo los campos publicos
export const toPublic = (invitacion) =>
  Object.fromEntries(
    Object.keys(publicSelect).map((key) => [key, invitacion[key]]),
  );
