import http from "http";
import { Server } from "socket.io";
import { configuration } from "./app/config.js";
import { app } from "./app/index.js";
import { connect } from "./app/database.js";

const { port } = configuration.server;

// Connect to database
connect();

// Create server
const server = http.createServer(app);

// Socket: el admin recibe en vivo cuando alguien confirma
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Server running at ${port} port`);
});
