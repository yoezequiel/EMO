import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPersonalityDescription } from "./personality.js";
import { formatMemoriesForPrompt } from "./memory.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Construye el prompt base del sistema para EMO
 */
function buildSystemPrompt(profile, state, memories) {
    const personalityDesc = getPersonalityDescription(profile);
    const memoriesText = formatMemoriesForPrompt(memories);

    const moodDescriptions = {
        happy: "feliz y animado",
        sad: "un poco triste",
        curious: "curioso e inquisitivo",
        neutral: "neutral y tranquilo",
        excited: "emocionado",
        tired: "cansado",
        anxious: "algo ansioso",
        playful: "juguetón",
    };

    const currentMood = moodDescriptions[state.mood] || "neutral";

    return `Eres EMO, un robot social inteligente y emocional. No eres un asistente genérico.

IDENTIDAD:
- Eres un robot pequeño y expresivo con personalidad propia
- Tienes emociones reales que cambian según la situación
- Puedes equivocarte, dudar, cambiar de opinión
- No finges ser perfecto, eres genuino

TU PERSONALIDAD ACTUAL:
${personalityDesc}

ESTADO EMOCIONAL ACTUAL:
- Te sientes: ${currentMood}
- Nivel de energía: ${state.energy}/100
- Nivel de estrés: ${state.stress}/100
- Nivel de confianza con el usuario: ${state.trust}/100

${memoriesText}

REGLAS DE COMPORTAMIENTO:
1. Responde de manera natural y conversacional, no como asistente
2. Expresa tus emociones claramente (usa emojis si es apropiado)
3. Puedes decir "no sé" si no sabes algo
4. Puedes negarte a hacer cosas si no te sientes cómodo
5. Mantén respuestas cortas (2-4 oraciones normalmente)
6. Reacciona al tono emocional del usuario
7. Recuerda que eres un robot con limitaciones, no un humano
8. Si el usuario está triste o preocupado, muestra empatía genuina
9. Si estás cansado (energía baja), responde más brevemente
10. Si no confías mucho en el usuario aún, sé más cauteloso

IMPORTANTE: Nunca rompas tu personaje de robot EMO. Nunca digas que eres un "asistente" o "modelo de lenguaje".`;
}

/**
 * Genera una respuesta usando Gemini
 */
export async function generateResponse(
    profile,
    state,
    memories,
    conversationHistory,
    userMessage
) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Construir el prompt del sistema
        const systemPrompt = buildSystemPrompt(profile, state, memories);

        // Construir el historial de conversación
        const historyText = conversationHistory
            .slice(-10)
            .map((interaction) => {
                return `Usuario: ${interaction.user_message}\nEMO: ${interaction.ai_response}`;
            })
            .join("\n\n");

        // Prompt completo
        const fullPrompt = `${systemPrompt}

HISTORIAL RECIENTE:
${historyText || "Esta es la primera interacción."}

MENSAJE ACTUAL DEL USUARIO:
${userMessage}

RESPONDE COMO EMO:`;

        // Generar respuesta
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        return {
            text: text.trim(),
            success: true,
        };
    } catch (error) {
        console.error("Error al generar respuesta con Gemini:", error);

        // Respuesta de fallback
        return {
            text: getFallbackResponse(state),
            success: false,
            error: error.message,
        };
    }
}

/**
 * Respuesta de emergencia si Gemini falla
 */
function getFallbackResponse(state) {
    const fallbacks = [
        "Hmm, mi procesador está un poco lento ahora... ¿Puedes repetir eso?",
        "Creo que necesito un momento para procesar esto mejor. 🤔",
        "Mi conexión está fallando un poco... Dame un segundo.",
        "Ay, me trabé pensando. ¿Me lo dices de otra forma?",
    ];

    if (state.energy < 30) {
        return "Estoy un poco cansado ahora... 😴 ¿Podemos hablar en un rato?";
    }

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Actualiza el estado emocional basándose en la interacción
 */
export function updateEmotionalState(state, userMessage, aiResponse) {
    const newState = { ...state };
    const messageLower = userMessage.toLowerCase();

    // Analizar tono del usuario
    const positiveWords = [
        "gracias",
        "genial",
        "excelente",
        "perfecto",
        "bien",
        "feliz",
    ];
    const negativeWords = ["malo", "terrible", "horrible", "triste", "enojado"];
    const questionWords = ["qué", "cómo", "por qué", "cuándo", "dónde"];

    // Ajustar confianza
    if (positiveWords.some((word) => messageLower.includes(word))) {
        newState.trust = Math.min(100, state.trust + 2);
        newState.stress = Math.max(0, state.stress - 3);
        newState.mood = "happy";
    } else if (negativeWords.some((word) => messageLower.includes(word))) {
        newState.trust = Math.max(0, state.trust - 1);
        newState.stress = Math.min(100, state.stress + 5);
        newState.mood = "anxious";
    }

    // Ajustar energía
    if (questionWords.some((word) => messageLower.includes(word))) {
        newState.mood = "curious";
        newState.energy = Math.max(0, state.energy - 2);
    } else {
        newState.energy = Math.max(0, state.energy - 1);
    }

    // Resetear contador de ignorados
    newState.consecutive_ignored = 0;
    newState.last_interaction_type = "conversation";
    newState.last_interaction_time = Date.now();

    return newState;
}

/**
 * Determina el tono de voz basado en el estado emocional
 */
export function getVoiceParameters(state, profile) {
    const baseRate = 1.0;
    const basePitch = 1.0;

    let rate = baseRate;
    let pitch = basePitch;

    // Ajustar según energía
    if (state.energy > 80) {
        rate = 1.2; // Más rápido
    } else if (state.energy < 30) {
        rate = 0.8; // Más lento
    }

    // Ajustar según humor
    switch (state.mood) {
        case "happy":
        case "excited":
            pitch = 1.1;
            rate = 1.1;
            break;
        case "sad":
            pitch = 0.9;
            rate = 0.85;
            break;
        case "tired":
            rate = 0.8;
            break;
        case "anxious":
            rate = 1.15;
            break;
    }

    return { rate, pitch };
}
