import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { createServer } from "http";

// Importar rutas
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";

// Importar servicios
import { initDatabase } from "./database/init.js";
import { setupWebSocket } from "./websocket/handler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
await initDatabase();

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// Ruta de health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "EMO Web Backend is running" });
});

// Crear servidor HTTP
const server = createServer(app);

// Configurar WebSocket
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

server.listen(PORT, () => {
    console.log(`🤖 EMO Web Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
