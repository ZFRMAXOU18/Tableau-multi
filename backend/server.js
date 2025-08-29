import express from "express";
import { Server } from "socket.io";
import http from "http";
import pg from "pg";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const pool = new pg.Pool({
  connectionString: process.env.NEON_URL, // fournie par Neon
});

io.on("connection", async (socket) => {
  console.log("Client connecté :", socket.id);

  // Charger les anciens traits et les envoyer
  const res = await pool.query("SELECT x, y, color, size FROM strokes ORDER BY id");
  socket.emit("init", res.rows);

  socket.on("draw", async (data) => {
    // Envoyer aux autres
    socket.broadcast.emit("draw", data);
    // Sauvegarder dans Neon
    await pool.query(
      "INSERT INTO strokes (x, y, color, size) VALUES ($1,$2,$3,$4)",
      [data.x, data.y, data.color, data.size]
    );
  });
});

server.listen(10000, () => console.log("Serveur OK sur port 10000"));
