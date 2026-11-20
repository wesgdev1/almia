# Invitaciones API

Node + Express + Prisma + PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env      # ajustar DATABASE_URL, TOKEN_SECRET, FRONTEND_URL
npx prisma generate
npx prisma db push
npm run seed              # crea admin con ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

## Modelo

`Invitacion` = 1 link personalizado (`FRONTEND_URL/invitacion/<uuid>`).
Ej: `destino: "Eduardo y Juliana"`, `cupos: 2`.

- `estado`: `PENDIENTE | CONFIRMADO | RECHAZADO`
- `metodoConfirmacion`: `WEB | WHATSAPP | LLAMADA | MANUAL`
- `cuposConfirmados`, `mensaje`, `enviada`, `fechaEnvio`, `fechaRespuesta`, `vistas`, `ultimaVista`

## Endpoints (`/api/v1`)

### Auth (admin)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users/signin` | `{ email, password }` → `meta.token` |
| POST | `/users/signup` | libre solo si no hay admins; luego requiere token |
| GET | `/users/me` | admin logueado |

### Invitaciones (admin, header `Authorization: Bearer <token>`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/invitaciones?estado=&enviada=&q=&grupo=` | listar (cada una trae `link`) |
| POST | `/invitaciones` | `{ destino, cupos, telefono?, email?, grupo?, notas? }` |
| POST | `/invitaciones/bulk` | arreglo de invitaciones |
| GET | `/invitaciones/stats` | totales invitaciones / personas |
| GET/PUT/PATCH/DELETE | `/invitaciones/:id` | CRUD |
| POST | `/invitaciones/:id/enviar` | marca enviada → `meta.link`, `meta.mensaje`, `meta.whatsappUrl` |
| GET | `/invitaciones/:id/link` | solo link (no marca enviada) |
| PATCH | `/invitaciones/:id/responder` | confirmar manual `{ asistira, cuposConfirmados?, metodo? }` |
| PATCH | `/invitaciones/:id/reset` | volver a PENDIENTE |

### Público (lo usa la invitación con el uuid)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/public/invitaciones/:id` | datos de la invitación (+1 vista) |
| POST | `/public/invitaciones/:id/responder` | `{ asistira: true/false, cuposConfirmados?, mensaje?, metodo?: "WEB"\|"WHATSAPP" }` |

### Socket.io
Evento `invitacion:respondida` cada vez que alguien confirma/rechaza → panel admin se actualiza en vivo.
