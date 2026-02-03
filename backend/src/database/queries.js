import { db } from "./init.js";

// ==================== USERS ====================

/**
 * Crea un nuevo usuario en la base de datos
 */
export async function createUser(id, email, passwordHash, username) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: "INSERT INTO users (id, email, password_hash, username, created_at) VALUES (?, ?, ?, ?, ?)",
            args: [id, email, passwordHash, username, timestamp],
        });
        return { id, email, username };
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw error;
    }
}

/**
 * Busca un usuario por email
 */
export async function findUserByEmail(email) {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email],
        });
        return result.rows[0] || null;
    } catch (error) {
        console.error("Error al buscar usuario:", error);
        throw error;
    }
}

/**
 * Busca un usuario por ID
 */
export async function findUserById(id) {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE id = ?",
            args: [id],
        });
        return result.rows[0] || null;
    } catch (error) {
        console.error("Error al buscar usuario por ID:", error);
        throw error;
    }
}

/**
 * Actualiza el último login del usuario
 */
export async function updateLastLogin(userId) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: "UPDATE users SET last_login = ? WHERE id = ?",
            args: [timestamp, userId],
        });
    } catch (error) {
        console.error("Error al actualizar último login:", error);
        throw error;
    }
}

// ==================== AI PROFILES ====================

/**
 * Crea un nuevo perfil de IA para un usuario
 */
export async function createAIProfile(id, userId) {
    try {
        const timestamp = Date.now();

        await db.execute({
            sql: `INSERT INTO ai_profiles 
                  (id, user_id, name, created_at, extroversion, curiosity, empathy, 
                   humor, emotional_dependency, formality, energy, total_interactions, last_modified) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                userId,
                "EMO",
                timestamp,
                50,
                50,
                50,
                50,
                30,
                40,
                70,
                0,
                timestamp,
            ],
        });

        return { id, userId };
    } catch (error) {
        console.error("Error al crear perfil de IA:", error);
        throw error;
    }
}

/**
 * Obtiene el perfil de IA de un usuario
 */
export async function getAIProfileByUserId(userId) {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM ai_profiles WHERE user_id = ?",
            args: [userId],
        });
        return result.rows[0] || null;
    } catch (error) {
        console.error("Error al obtener perfil de IA:", error);
        throw error;
    }
}

/**
 * Actualiza los rasgos de personalidad del perfil de IA
 */
export async function updatePersonalityTraits(profileId, traits) {
    try {
        const timestamp = Date.now();
        const {
            extroversion,
            curiosity,
            empathy,
            humor,
            emotional_dependency,
            formality,
            energy,
        } = traits;

        await db.execute({
            sql: `UPDATE ai_profiles 
                  SET extroversion = ?, curiosity = ?, empathy = ?, humor = ?, 
                      emotional_dependency = ?, formality = ?, energy = ?, last_modified = ?
                  WHERE id = ?`,
            args: [
                extroversion,
                curiosity,
                empathy,
                humor,
                emotional_dependency,
                formality,
                energy,
                timestamp,
                profileId,
            ],
        });
    } catch (error) {
        console.error("Error al actualizar rasgos de personalidad:", error);
        throw error;
    }
}

// Alias para compatibilidad
export const updateAIProfileTraits = updatePersonalityTraits;

// ==================== AI STATES ====================

/**
 * Crea un estado inicial para un perfil de IA
 */
export async function createAIState(id, aiProfileId) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: `INSERT INTO ai_state 
                  (id, ai_profile_id, mood, energy, stress, confidence, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, aiProfileId, 50, 50, 0, 50, timestamp],
        });
        return { id, aiProfileId };
    } catch (error) {
        console.error("Error al crear estado de IA:", error);
        throw error;
    }
}

/**
 * Obtiene el estado actual de una IA
 */
export async function getAIState(aiProfileId) {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM ai_state WHERE ai_profile_id = ?",
            args: [aiProfileId],
        });

        return result.rows[0] || null;
    } catch (error) {
        console.error("Error al obtener estado de IA:", error);
        throw error;
    }
}

/**
 * Actualiza el estado emocional de una IA
 */
export async function updateAIState(aiProfileId, state) {
    try {
        const timestamp = Date.now();
        const { mood, energy, stress, confidence } = state;

        await db.execute({
            sql: `UPDATE ai_state 
                  SET mood = ?, energy = ?, stress = ?, confidence = ?, 
                      last_interaction = ?, updated_at = ? 
                  WHERE ai_profile_id = ?`,
            args: [
                mood,
                energy,
                stress,
                confidence,
                timestamp,
                timestamp,
                aiProfileId,
            ],
        });
    } catch (error) {
        console.error("Error al actualizar estado de IA:", error);
        throw error;
    }
}

// ==================== MEMORIES (usando ai_memory) ====================

/**
 * Crea una nueva memoria para una IA
 */
export async function createMemory(
    id,
    aiProfileId,
    content,
    category = "conversation",
    emotionalWeight = 50,
) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: `INSERT INTO ai_memory 
                  (id, ai_profile_id, content, category, emotional_weight, created_at, access_count) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                aiProfileId,
                content,
                category,
                emotionalWeight,
                timestamp,
                0,
            ],
        });
        return { id, aiProfileId, content, category, emotionalWeight };
    } catch (error) {
        console.error("Error al crear memoria:", error);
        throw error;
    }
}

/**
 * Obtiene las memorias más relevantes de una IA
 */
export async function getRelevantMemories(aiProfileId, limit = 10) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM ai_memory 
                  WHERE ai_profile_id = ? 
                  ORDER BY emotional_weight DESC, created_at DESC 
                  LIMIT ?`,
            args: [aiProfileId, limit],
        });
        return result.rows;
    } catch (error) {
        console.error("Error al obtener memorias:", error);
        throw error;
    }
}

/**
 * Obtiene las memorias recientes de una IA
 */
export async function getRecentMemories(aiProfileId, limit = 5) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM ai_memory 
                  WHERE ai_profile_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT ?`,
            args: [aiProfileId, limit],
        });
        return result.rows;
    } catch (error) {
        console.error("Error al obtener memorias recientes:", error);
        throw error;
    }
}

/**
 * Obtiene las memorias importantes (por peso emocional mínimo)
 */
export async function getImportantMemories(
    aiProfileId,
    minEmotionalWeight = 70,
    limit = 10,
) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM ai_memory 
                  WHERE ai_profile_id = ? AND emotional_weight >= ?
                  ORDER BY emotional_weight DESC, created_at DESC 
                  LIMIT ?`,
            args: [aiProfileId, minEmotionalWeight, limit],
        });
        return result.rows;
    } catch (error) {
        console.error("Error al obtener memorias importantes:", error);
        throw error;
    }
}

/**
 * Obtiene memorias por categoría
 */
export async function getMemoriesByCategory(aiProfileId, category, limit = 10) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM ai_memory 
                  WHERE ai_profile_id = ? AND category = ?
                  ORDER BY created_at DESC 
                  LIMIT ?`,
            args: [aiProfileId, category, limit],
        });
        return result.rows;
    } catch (error) {
        console.error("Error al obtener memorias por categoría:", error);
        throw error;
    }
}

/**
 * Actualiza el acceso a una memoria
 */
export async function updateMemoryAccess(memoryId) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: `UPDATE ai_memory 
                  SET access_count = access_count + 1, last_accessed = ? 
                  WHERE id = ?`,
            args: [timestamp, memoryId],
        });
    } catch (error) {
        console.error("Error al actualizar acceso a memoria:", error);
        throw error;
    }
}

// ==================== INTERACTIONS ====================

/**
 * Crea una interacción (conversación con metadata)
 */
export async function createInteraction(
    id,
    aiProfileId,
    userMessage,
    aiResponse,
    metadata = {},
) {
    try {
        const timestamp = Date.now();
        const {
            mood_before,
            mood_after,
            energy_before,
            energy_after,
            response_time_ms,
        } = metadata;

        await db.execute({
            sql: `INSERT INTO interactions 
                  (id, ai_profile_id, user_message, ai_response, mood_before, mood_after, 
                   energy_before, energy_after, timestamp, response_time_ms) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                aiProfileId,
                userMessage,
                aiResponse,
                mood_before,
                mood_after,
                energy_before,
                energy_after,
                timestamp,
                response_time_ms,
            ],
        });

        return { id, aiProfileId, userMessage, aiResponse };
    } catch (error) {
        console.error("Error al crear interacción:", error);
        throw error;
    }
}

/**
 * Obtiene las interacciones recientes
 */
export async function getRecentInteractions(aiProfileId, limit = 10) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM interactions 
                  WHERE ai_profile_id = ? 
                  ORDER BY timestamp DESC 
                  LIMIT ?`,
            args: [aiProfileId, limit],
        });
        return result.rows.reverse(); // Orden cronológico
    } catch (error) {
        console.error("Error al obtener interacciones:", error);
        throw error;
    }
}

/**
 * Incrementa el contador de interacciones de un perfil de IA
 */
export async function incrementInteractionCount(aiProfileId) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: `UPDATE ai_profiles 
                  SET total_interactions = total_interactions + 1, last_modified = ? 
                  WHERE id = ?`,
            args: [timestamp, aiProfileId],
        });
    } catch (error) {
        console.error("Error al incrementar contador de interacciones:", error);
        throw error;
    }
}

// ==================== CONVERSATIONS ====================

/**
 * Guarda una conversación en la base de datos
 */
export async function saveConversation(
    id,
    aiProfileId,
    userMessage,
    aiResponse,
) {
    try {
        const timestamp = Date.now();
        await db.execute({
            sql: `INSERT INTO conversations 
                  (id, ai_profile_id, user_message, ai_response, created_at) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [id, aiProfileId, userMessage, aiResponse, timestamp],
        });
    } catch (error) {
        console.error("Error al guardar conversación:", error);
        throw error;
    }
}

/**
 * Obtiene el historial de conversaciones de una IA
 */
export async function getConversationHistory(aiProfileId, limit = 20) {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM conversations 
                  WHERE ai_profile_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT ?`,
            args: [aiProfileId, limit],
        });
        return result.rows.reverse(); // Orden cronológico
    } catch (error) {
        console.error("Error al obtener historial:", error);
        throw error;
    }
}
