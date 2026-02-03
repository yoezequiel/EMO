import express from "express";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth.js";
import {
    getAIProfileByUserId,
    getAIState,
    getRecentInteractions,
    updateAIState,
    createInteraction,
    incrementInteractionCount,
} from "../database/queries.js";
import {
    generateResponse,
    updateEmotionalState,
    getVoiceParameters,
} from "../services/ai.js";
import { evolvePersonality } from "../services/personality.js";
import { extractMemories, selectRelevantMemories } from "../services/memory.js";

const router = express.Router();

// Obtener perfil de IA del usuario
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const avatarType = req.query.avatarType || "emo";
        const profile = await getAIProfileByUserId(req.user.userId);

        if (!profile) {
            return res
                .status(404)
                .json({ error: "Perfil de IA no encontrado" });
        }

        const state = await getAIState(profile.id, avatarType);

        res.json({
            profile,
            state,
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ error: "Error al obtener perfil de IA" });
    }
});

// Obtener historial de conversación
router.get("/history", authenticateToken, async (req, res) => {
    try {
        const avatarType = req.query.avatarType || "emo";
        const profile = await getAIProfileByUserId(req.user.userId);

        if (!profile) {
            return res
                .status(404)
                .json({ error: "Perfil de IA no encontrado" });
        }

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const history = await getRecentInteractions(
            profile.id,
            limit,
            avatarType,
        );

        res.json({ history });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

// Enviar mensaje a la IA
router.post("/chat", authenticateToken, async (req, res) => {
    const startTime = Date.now();

    try {
        const { message, avatarType = "emo" } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Mensaje inválido" });
        }

        // Obtener perfil y estado
        const profile = await getAIProfileByUserId(req.user.userId);
        if (!profile) {
            return res
                .status(404)
                .json({ error: "Perfil de IA no encontrado" });
        }

        let state = await getAIState(profile.id, avatarType);

        // Si no existe un estado para este avatar, crear uno
        if (!state) {
            const stateId = uuidv4();
            await createAIState(stateId, profile.id, avatarType);
            state = await getAIState(profile.id, avatarType);
        }

        const conversationHistory = await getRecentInteractions(
            profile.id,
            10,
            avatarType,
        );

        // Seleccionar memorias relevantes
        const memories = await selectRelevantMemories(profile.id, message, 5);

        // Estado antes de la interacción
        const stateBefore = { ...state };

        // Generar respuesta con Gemini
        const aiResult = await generateResponse(
            profile,
            state,
            memories,
            conversationHistory,
            message,
            avatarType,
        );

        // Actualizar estado emocional
        const newState = updateEmotionalState(state, message, aiResult.text);
        await updateAIState(profile.id, newState, avatarType);

        // Evolucionar personalidad
        await evolvePersonality(profile, message, newState);

        // Extraer y guardar nuevas memorias
        await extractMemories(message, profile.id);

        // Guardar interacción en historial
        const interactionId = uuidv4();
        await createInteraction(
            interactionId,
            profile.id,
            message,
            aiResult.text,
            {
                mood_before: stateBefore.mood,
                mood_after: newState.mood,
                energy_before: stateBefore.energy,
                energy_after: newState.energy,
                response_time_ms: Date.now() - startTime,
            },
            avatarType,
        );

        // Incrementar contador de interacciones
        await incrementInteractionCount(profile.id);

        // Obtener parámetros de voz
        const voiceParams = getVoiceParameters(newState, profile);

        res.json({
            response: aiResult.text,
            state: newState,
            voiceParams,
            success: aiResult.success,
        });
    } catch (error) {
        console.error("Error en chat:", error);
        res.status(500).json({
            error: "Error al procesar mensaje",
            response: "Lo siento, algo salió mal... 😔",
        });
    }
});

export default router;
