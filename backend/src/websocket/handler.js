import jwt from "jsonwebtoken";
import {
    getAIProfileByUserId,
    getAIState,
    updateAIState,
} from "../database/queries.js";

const clients = new Map(); // userId -> WebSocket

/**
 * Configura el servidor WebSocket
 */
export function setupWebSocket(wss) {
    wss.on("connection", (ws, req) => {
        console.log("Nueva conexión WebSocket");

        let userId = null;

        ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString());

                // Autenticación
                if (message.type === "auth") {
                    try {
                        const decoded = jwt.verify(
                            message.token,
                            process.env.JWT_SECRET
                        );
                        userId = decoded.userId;
                        clients.set(userId, ws);

                        ws.send(
                            JSON.stringify({
                                type: "auth_success",
                                message: "Autenticado exitosamente",
                            })
                        );

                        console.log(
                            `Usuario ${userId} conectado via WebSocket`
                        );

                        // Enviar estado actual
                        await sendCurrentState(userId, ws);
                    } catch (error) {
                        ws.send(
                            JSON.stringify({
                                type: "auth_error",
                                error: "Token inválido",
                            })
                        );
                    }
                }

                // Ping para mantener conexión
                if (message.type === "ping") {
                    ws.send(JSON.stringify({ type: "pong" }));
                }

                // Actualización de estado (para animaciones en tiempo real)
                if (message.type === "request_state" && userId) {
                    await sendCurrentState(userId, ws);
                }
            } catch (error) {
                console.error("Error procesando mensaje WebSocket:", error);
            }
        });

        ws.on("close", () => {
            if (userId) {
                clients.delete(userId);
                console.log(`Usuario ${userId} desconectado`);
            }
        });

        ws.on("error", (error) => {
            console.error("Error en WebSocket:", error);
        });
    });

    // Enviar actualizaciones periódicas de estado
    setInterval(async () => {
        for (const [userId, ws] of clients.entries()) {
            if (ws.readyState === 1) {
                // OPEN
                await sendCurrentState(userId, ws);
            }
        }
    }, 30000); // Cada 30 segundos

    console.log("✅ WebSocket configurado");
}

/**
 * Envía el estado actual de la IA al cliente
 */
async function sendCurrentState(userId, ws) {
    try {
        const profile = await getAIProfileByUserId(userId);
        if (!profile) return;

        const state = await getAIState(profile.id);

        ws.send(
            JSON.stringify({
                type: "state_update",
                data: {
                    mood: state.mood,
                    energy: state.energy,
                    stress: state.stress,
                    trust: state.trust,
                },
            })
        );
    } catch (error) {
        console.error("Error enviando estado:", error);
    }
}

/**
 * Notifica a un usuario específico (útil para notificaciones push)
 */
export function notifyUser(userId, notification) {
    const ws = clients.get(userId);
    if (ws && ws.readyState === 1) {
        ws.send(
            JSON.stringify({
                type: "notification",
                data: notification,
            })
        );
    }
}
