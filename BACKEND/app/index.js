import path from "path";
import express from "express";
import cors from "cors";
import { router as api } from "./api/v1/index.js";
import { configuration } from "./config.js";

export const app = express();

// CORS
app.use(cors());

app.use(express.json());

app.use("/api", api);
app.use("/api/v1", api);

// Front estatico (opcional): FRONT_DIR en .env
const { dir: frontDir } = configuration.frontend;
if (frontDir) {
  const root = path.resolve(frontDir);
  app.get("/invitacion/:id", (req, res) =>
    res.sendFile(path.join(root, "invitacion.html")),
  );
  app.get("/admin", (req, res) => res.sendFile(path.join(root, "admin.html")));
  app.use(express.static(root));
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Invitaciones API OK" });
  });
}

// Not route error handler
app.use((req, res, next) => {
  next({ message: "Route Not found", status: 404 });
});

// Error handler
app.use((err, req, res, next) => {
  let { message, status = 500 } = err;

  // Errores conocidos de Prisma
  if (err.code === "P2025") {
    status = 404;
    message = "Registro no encontrado";
  } else if (err.code === "P2002") {
    status = 409;
    message = `Ya existe un registro con ese ${err.meta?.target}`;
  }

  if (status === 500) console.error(err);

  res.status(status);
  res.json({ error: { message, status } });
});
