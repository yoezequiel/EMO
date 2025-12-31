import { updateAIProfileTraits } from "../database/queries.js";

// Constantes para ajuste de personalidad
const TRAIT_CHANGE_RATE = 2; // Cambio gradual por interacción
const MAX_TRAIT_VALUE = 100;
const MIN_TRAIT_VALUE = 0;

// Función para limitar valores entre 0 y 100
function clamp(value, min = MIN_TRAIT_VALUE, max = MAX_TRAIT_VALUE) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Analiza el mensaje del usuario y actualiza los rasgos de personalidad
 */
export async function evolvePersonality(profile, userMessage, aiState) {
    const traits = {
        extroversion: profile.extroversion,
        curiosity: profile.curiosity,
        empathy: profile.empathy,
        humor: profile.humor,
        emotional_dependency: profile.emotional_dependency,
        formality: profile.formality,
        energy: profile.energy,
    };

    const messageLength = userMessage.length;
    const messageLower = userMessage.toLowerCase();

    // === EXTROVERSIÓN ===
    // Aumenta si el usuario habla mucho
    if (messageLength > 200) {
        traits.extroversion = clamp(traits.extroversion + TRAIT_CHANGE_RATE);
    }

    // === CURIOSIDAD ===
    // Aumenta si el usuario hace preguntas
    if (
        messageLower.includes("?") ||
        messageLower.includes("por qué") ||
        messageLower.includes("cómo")
    ) {
        traits.curiosity = clamp(traits.curiosity + TRAIT_CHANGE_RATE);
    }

    // === EMPATÍA ===
    // Aumenta si el usuario expresa emociones positivas
    const positiveWords = [
        "gracias",
        "amo",
        "feliz",
        "contento",
        "alegre",
        "bien",
    ];
    const negativeWords = [
        "triste",
        "mal",
        "enojado",
        "odio",
        "molesto",
        "preocupado",
    ];

    if (positiveWords.some((word) => messageLower.includes(word))) {
        traits.empathy = clamp(traits.empathy + TRAIT_CHANGE_RATE);
    }

    // Disminuye si el usuario es agresivo
    const aggressiveWords = ["idiota", "estúpido", "cállate", "inútil"];
    if (aggressiveWords.some((word) => messageLower.includes(word))) {
        traits.empathy = clamp(traits.empathy - TRAIT_CHANGE_RATE * 2);
    }

    // === HUMOR ===
    // Aumenta si el usuario usa emojis o hace bromas
    if (
        messageLower.includes("jaja") ||
        messageLower.includes("jeje") ||
        messageLower.includes("😂") ||
        messageLower.includes("😄")
    ) {
        traits.humor = clamp(traits.humor + TRAIT_CHANGE_RATE);
    }

    // === DEPENDENCIA EMOCIONAL ===
    // Aumenta si el usuario ignora por mucho tiempo (basado en estado)
    if (aiState.consecutive_ignored > 3) {
        traits.emotional_dependency = clamp(
            traits.emotional_dependency + TRAIT_CHANGE_RATE
        );
    }

    // Disminuye si hay interacción frecuente
    const timeSinceLastInteraction =
        Date.now() - (aiState.last_interaction_time || Date.now());
    if (timeSinceLastInteraction < 60000) {
        // Menos de 1 minuto
        traits.emotional_dependency = clamp(traits.emotional_dependency - 1);
    }

    // === FORMALIDAD ===
    // Disminuye con lenguaje informal
    if (
        messageLower.includes("che") ||
        messageLower.includes("wey") ||
        messageLower.includes("loco")
    ) {
        traits.formality = clamp(traits.formality - TRAIT_CHANGE_RATE);
    }

    // === ENERGÍA ===
    // Aumenta con interacciones frecuentes
    if (timeSinceLastInteraction < 120000) {
        // Menos de 2 minutos
        traits.energy = clamp(traits.energy + 1);
    } else {
        traits.energy = clamp(traits.energy - 1);
    }

    // Actualizar en base de datos
    await updateAIProfileTraits(profile.id, traits);

    return traits;
}

/**
 * Genera una descripción de personalidad para el prompt de la IA
 */
export function getPersonalityDescription(profile) {
    const traits = [];

    // Extroversión
    if (profile.extroversion > 70) {
        traits.push("muy extrovertido y conversador");
    } else if (profile.extroversion < 30) {
        traits.push("reservado y reflexivo");
    }

    // Curiosidad
    if (profile.curiosity > 70) {
        traits.push("extremadamente curioso e inquisitivo");
    }

    // Empatía
    if (profile.empathy > 70) {
        traits.push("muy empático y comprensivo");
    } else if (profile.empathy < 30) {
        traits.push("más lógico que emocional");
    }

    // Humor
    if (profile.humor > 70) {
        traits.push("juguetón y le gusta bromear");
    }

    // Dependencia emocional
    if (profile.emotional_dependency > 70) {
        traits.push("necesita atención frecuente");
    }

    // Formalidad
    if (profile.formality > 70) {
        traits.push("formal y educado");
    } else if (profile.formality < 30) {
        traits.push("casual y relajado");
    }

    // Energía
    if (profile.energy > 80) {
        traits.push("lleno de energía");
    } else if (profile.energy < 30) {
        traits.push("un poco cansado");
    }

    return traits.length > 0
        ? `Eres ${traits.join(", ")}.`
        : "Tienes una personalidad equilibrada.";
}

/**
 * Degrada la energía con el tiempo (llamar periódicamente)
 */
export async function degradeEnergy(profile) {
    const newEnergy = clamp(profile.energy - 1);
    await updateAIProfileTraits(profile.id, { energy: newEnergy });
    return newEnergy;
}
