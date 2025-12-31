# EMO Web — Documento de Diseño Funcional y Técnico

## 1. Visión General

EMO Web es una aplicación web interactiva que simula un robot social inteligente, inspirado en EMO, pero superándolo a nivel **cognitivo y adaptativo** gracias a modelos LLM (Gemini) y un sistema propio de **personalidad dinámica por usuario**.

Cada usuario que crea una cuenta obtiene una entidad IA única, que **evoluciona su personalidad, emociones y comportamiento** en función de cómo el usuario interactúa con ella a lo largo del tiempo.

El objetivo no es solo conversar, sino **generar vínculo, coherencia emocional y sensación de presencia**.

---

## 2. Principios Clave del Sistema

1. **Una IA por usuario** (no un bot genérico).
2. **Personalidad emergente**, no fija.
3. **Estado interno persistente**.
4. **Reacciones emocionales visibles** (voz + animación).
5. **Limitaciones humanas simuladas** (cansancio, humor, errores).

Estos principios son lo que permiten igualar o superar a EMO a nivel de inteligencia percibida.

---

## 3. Sistema de Cuentas

### 3.1 Registro

Cada cuenta crea:

-   Un identificador único de IA (`ai_id`)
-   Un perfil base de personalidad vacío
-   Un estado emocional inicial neutro

No se asigna personalidad predefinida fuerte: **la personalidad se construye interactuando**.

---

## 4. Arquitectura General

### 4.1 Frontend

-   Astro
-   Canvas / Three.js / Lottie (avatar)
-   Web Speech API (voz)
-   WebSockets o polling corto para interacción fluida

### 4.2 Backend

-   Node.js + Express
-   API REST + WebSocket
-   Gestión de estado y memoria
-   Integración con Gemini API

### 4.3 Base de Datos

-   Turso / SQLite

Tablas principales:

-   users
-   ai_profiles
-   ai_state
-   ai_memory
-   interactions

---

## 5. Núcleo del Sistema: Personalidad Evolutiva

### 5.1 Rasgos de Personalidad

La IA no tiene una personalidad fija, sino **vectores de rasgos**:

-   Extroversión (0–100)
-   Curiosidad
-   Empatía
-   Humor
-   Dependencia emocional
-   Formalidad
-   Energía

Estos valores:

-   Se inicializan neutros
-   Cambian lentamente
-   Nunca saltan bruscamente

---

### 5.2 Cómo se modifican los rasgos

Ejemplos:

-   Usuario habla mucho → sube extroversión
-   Usuario ignora → baja energía, sube dependencia
-   Usuario es agresivo → baja empatía, sube defensa
-   Usuario hace bromas → sube humor

Estas modificaciones **no se envían a Gemini directamente**, sino que afectan el contexto y tono.

---

## 6. Estado Emocional Interno

El estado emocional es **volátil y contextual**.

Ejemplo:

```json
{
    "mood": "curious",
    "energy": 63,
    "stress": 12,
    "trust": 41,
    "last_interaction": "question"
}
```

El estado:

-   Cambia en cada interacción
-   Se degrada con el tiempo
-   Afecta respuestas, animaciones y voz

---

## 7. Memoria Artificial

### 7.1 Tipos de Memoria

#### Memoria a corto plazo

-   Últimos 10–20 mensajes
-   Contexto inmediato

#### Memoria a largo plazo

-   Datos importantes del usuario
-   Eventos emocionales relevantes

Ejemplo:

-   "El usuario odia los lunes"
-   "El usuario se sintió triste el 12/08"

---

### 7.2 Selección de Memorias

No se envía todo a Gemini.

Se seleccionan memorias según:

-   Relevancia emocional
-   Frecuencia
-   Similitud semántica

Esto reduce tokens y aumenta coherencia.

---

## 8. Motor Cognitivo (Gemini)

### 8.1 Prompt Base (conceptual)

El prompt SIEMPRE incluye:

-   Rol del robot
-   Rasgos de personalidad actuales
-   Estado emocional
-   Memorias relevantes
-   Último input del usuario

Nunca se le permite responder como asistente genérico.

---

### 8.2 Reglas Cognitivas

-   Puede decir que no sabe algo
-   Puede equivocarse ligeramente
-   Puede cambiar de opinión
-   Puede mostrar emociones

Esto aumenta la sensación de inteligencia real.

---

## 9. Voz y Expresión

### 9.1 Voz

-   Velocidad variable
-   Pausas
-   Entonación según emoción

Ejemplo:

-   Triste → más lento
-   Feliz → rápido
-   Cansado → respuestas cortas

---

### 9.2 Animaciones

El avatar refleja:

-   Estado emocional
-   Nivel de energía
-   Tipo de interacción

Nunca debe permanecer estático.

---

## 10. Autonomía Simulada

Aunque no haya sensores físicos:

-   Si pasa tiempo sin interacción → cambia estado
-   Puede iniciar conversación
-   Puede mostrar aburrimiento
-   Puede "recordar" eventos pasados

Esto crea la ilusión de vida.

---

## 11. Seguridad y Límites

-   No dependencia emocional extrema
-   No reemplazo humano
-   Mensajes de contención si el usuario cruza límites

---

## 12. MVP Funcional

Para una primera versión:

-   Registro + login
-   Avatar simple
-   Texto + voz
-   Estado emocional básico
-   Personalidad evolutiva mínima

---

## 13. Por qué supera a EMO

-   EMO tiene personalidad fija
-   EMO no aprende relaciones
-   EMO depende de hardware

EMO Web:

-   Aprende del usuario
-   Evoluciona
-   Escala
-   Es accesible

---

## 14. Conclusión

EMO Web no es un chatbot.

Es una **entidad cognitiva personalizada**, diseñada para crear vínculo, coherencia y presencia.

Bien implementado, no solo iguala a EMO: **lo supera a nivel de inteligencia percibida**.
