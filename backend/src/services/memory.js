import { v4 as uuidv4 } from "uuid";
import {
    createMemory,
    getRecentMemories,
    getImportantMemories,
    getMemoriesByCategory,
    updateMemoryAccess,
} from "../database/queries.js";

/**
 * Extrae información relevante del mensaje del usuario para almacenar como memoria
 */
export async function extractMemories(userMessage, aiProfileId) {
    const memories = [];
    const messageLower = userMessage.toLowerCase();

    // Detectar preferencias
    const likePatterns = [
        /me gusta (el|la|los|las) ([a-záéíóúñ\s]+)/i,
        /amo (el|la|los|las) ([a-záéíóúñ\s]+)/i,
        /adoro ([a-záéíóúñ\s]+)/i,
    ];

    const dislikePatterns = [
        /no me gusta (el|la|los|las) ([a-záéíóúñ\s]+)/i,
        /odio (el|la|los|las) ([a-záéíóúñ\s]+)/i,
        /detesto ([a-záéíóúñ\s]+)/i,
    ];

    for (const pattern of likePatterns) {
        const match = userMessage.match(pattern);
        if (match) {
            memories.push({
                id: uuidv4(),
                ai_profile_id: aiProfileId,
                content: `Le gusta: ${match[2] || match[1]}`,
                category: "preference",
                emotional_weight: 60,
            });
        }
    }

    for (const pattern of dislikePatterns) {
        const match = userMessage.match(pattern);
        if (match) {
            memories.push({
                id: uuidv4(),
                ai_profile_id: aiProfileId,
                content: `No le gusta: ${match[2] || match[1]}`,
                category: "preference",
                emotional_weight: 60,
            });
        }
    }

    // Detectar emociones fuertes
    const strongEmotions = [
        {
            words: ["muy feliz", "súper feliz", "eufórico"],
            emotion: "felicidad extrema",
            weight: 80,
        },
        {
            words: ["muy triste", "deprimido", "devastado"],
            emotion: "tristeza profunda",
            weight: 85,
        },
        {
            words: ["furioso", "enojado", "molesto"],
            emotion: "enojo",
            weight: 75,
        },
        {
            words: ["ansioso", "nervioso", "preocupado"],
            emotion: "ansiedad",
            weight: 70,
        },
    ];

    for (const { words, emotion, weight } of strongEmotions) {
        if (words.some((word) => messageLower.includes(word))) {
            memories.push({
                id: uuidv4(),
                ai_profile_id: aiProfileId,
                content: `Usuario expresó ${emotion}`,
                category: "emotion",
                emotional_weight: weight,
            });
        }
    }

    // Detectar eventos importantes
    const eventPatterns = [
        /mi cumpleaños/i,
        /me gradué/i,
        /conseguí (un|el) trabajo/i,
        /me casé/i,
        /murió/i,
    ];

    for (const pattern of eventPatterns) {
        if (pattern.test(userMessage)) {
            memories.push({
                id: uuidv4(),
                ai_profile_id: aiProfileId,
                content: `Evento importante: ${userMessage.substring(0, 100)}`,
                category: "event",
                emotional_weight: 90,
            });
        }
    }

    // Guardar memorias en base de datos
    for (const memory of memories) {
        await createMemory(
            memory.id,
            memory.ai_profile_id,
            memory.content,
            memory.category,
            memory.emotional_weight
        );
    }

    return memories;
}

/**
 * Selecciona memorias relevantes para incluir en el contexto de la IA
 */
export async function selectRelevantMemories(
    aiProfileId,
    userMessage,
    limit = 5
) {
    // Obtener memorias importantes
    const importantMemories = await getImportantMemories(aiProfileId, 70, 3);

    // Obtener memorias recientes
    const recentMemories = await getRecentMemories(aiProfileId, 5);

    // Combinar y eliminar duplicados
    const allMemories = [...importantMemories];

    for (const recent of recentMemories) {
        if (!allMemories.find((m) => m.id === recent.id)) {
            allMemories.push(recent);
        }
    }

    // Limitar cantidad
    const selectedMemories = allMemories.slice(0, limit);

    // Actualizar contador de acceso
    for (const memory of selectedMemories) {
        await updateMemoryAccess(memory.id);
    }

    return selectedMemories;
}

/**
 * Genera texto de contexto de memorias para el prompt
 */
export function formatMemoriesForPrompt(memories) {
    if (memories.length === 0) {
        return "No tienes memorias significativas sobre este usuario todavía.";
    }

    const memoryTexts = memories.map((m) => `- ${m.content}`);
    return `Lo que recuerdas sobre este usuario:\n${memoryTexts.join("\n")}`;
}

/**
 * Limpia memorias antiguas de bajo peso emocional (mantenimiento periódico)
 */
export function cleanOldMemories(aiProfileId) {
    // Esta función podría implementarse para eliminar memorias
    // muy antiguas con bajo peso emocional
    // Por ahora la dejamos como placeholder
}
