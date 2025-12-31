# 🏗️ Arquitectura del Sistema EMO Web

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO / NAVEGADOR                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Login /    │  │  Interfaz    │  │   Avatar 3D (Three.js)   │ │
│  │   Registro   │  │  de Chat     │  │   + Animaciones          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │            Web Speech API (Voz / Reconocimiento)            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                    │
│                                                                     │
│  ┌─────────────────────┐           ┌──────────────────────────┐   │
│  │   API REST          │           │   WebSocket Server       │   │
│  │                     │           │                          │   │
│  │  • /auth/register   │           │  • Estado en tiempo real │   │
│  │  • /auth/login      │           │  • Ping/Pong             │   │
│  │  • /ai/profile      │◄─────────►│  • Autenticación JWT     │   │
│  │  • /ai/chat         │           │  • Notificaciones        │   │
│  │  • /ai/history      │           │                          │   │
│  └─────────────────────┘           └──────────────────────────┘   │
│            │                                  │                    │
│            ▼                                  ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   CAPA DE SERVICIOS                          │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │  │
│  │  │  Servicio de │  │  Servicio   │  │   Servicio de    │   │  │
│  │  │  Personalidad│  │  de Memoria │  │   IA (Gemini)    │   │  │
│  │  │              │  │             │  │                  │   │  │
│  │  │  • Rasgos    │  │  • Extracto │  │  • Prompt Gen.   │   │  │
│  │  │  • Evolución │  │  • Selección│  │  • API Call      │   │  │
│  │  │  • Decay     │  │  • Peso     │  │  • Estado Update │   │  │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘   │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  BASE DE DATOS (SQLite)                      │  │
│  │                                                              │  │
│  │  users  │  ai_profiles  │  ai_state  │  ai_memory  │       │  │
│  │         │               │            │              │ inter- │  │
│  │  • id   │  • traits     │  • mood    │  • content   │ actions│  │
│  │  • email│  • energy     │  • energy  │  • weight    │  • msg │  │
│  │  • pass │  • stats      │  • trust   │  • category  │  • res │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │   Google Gemini API   │
                    │   (LLM External)      │
                    └──────────────────────┘
```

## Flujo de Interacción

### 1. Registro/Login

```
Usuario → Frontend → POST /auth/register
                  → Backend crea: User + AI Profile + AI State
                  → Retorna JWT Token
                  → Frontend guarda en localStorage
                  → Redirige a /chat
```

### 2. Envío de Mensaje

```
Usuario escribe mensaje
    ↓
Frontend → POST /api/ai/chat (+ JWT)
    ↓
Backend valida JWT
    ↓
1. Obtiene Profile & State de DB
2. Selecciona Memorias relevantes
3. Construye Prompt con contexto
4. Llama a Gemini API
5. Actualiza Estado Emocional
6. Evoluciona Personalidad
7. Extrae nuevas Memorias
8. Guarda Interacción
    ↓
Retorna: { response, state, voiceParams }
    ↓
Frontend muestra mensaje + actualiza UI + habla con voz
```

### 3. Actualización en Tiempo Real

```
Backend (cada 30s) → WebSocket
                  → Envía state_update
                  → Frontend actualiza:
                       • Barras de progreso
                       • Estado de ánimo
                       • Color del avatar
                       • Animaciones
```

## Arquitectura de Datos

### Flujo de Personalidad

```
Mensaje del Usuario
    ↓
Análisis de Contenido
    ↓
┌─────────────────────┐
│ Triggers Detectados │
│                     │
│ • Longitud > 200    │ → +Extroversión
│ • Contiene "?"      │ → +Curiosidad
│ • Palabras positivas│ → +Empatía
│ • Emojis/risas      │ → +Humor
│ • Ignorado > 3      │ → +Dependencia
└─────────────────────┘
    ↓
Actualización gradual de rasgos (±2 puntos)
    ↓
Persiste en ai_profiles
    ↓
Influye en próximas respuestas
```

### Flujo de Memoria

```
Mensaje del Usuario
    ↓
Patrón Matching
    ↓
┌──────────────────────────┐
│ Patrones Detectados      │
│                          │
│ "me gusta X"             │ → Memoria: Preferencia
│ "estoy muy feliz/triste" │ → Memoria: Emoción
│ "mi cumpleaños"          │ → Memoria: Evento
│ Información factual      │ → Memoria: Hecho
└──────────────────────────┘
    ↓
Crea registro en ai_memory con peso emocional
    ↓
En próxima interacción:
    • Se seleccionan top 5 memorias
    • Por peso emocional + recencia
    • Se incluyen en prompt de Gemini
```

### Flujo de Estado Emocional

```
Interacción
    ↓
Análisis de tono
    ↓
┌─────────────────────────┐
│ Palabras positivas      │ → +Trust, -Stress, Mood=Happy
│ Palabras negativas      │ → -Trust, +Stress, Mood=Anxious
│ Preguntas              │ → Mood=Curious, -Energy
│ Tiempo sin interacción │ → -Energy, +Ignored
└─────────────────────────┘
    ↓
Actualiza ai_state
    ↓
WebSocket notifica cambios
    ↓
UI refleja estado actual
```

## Stack Tecnológico Detallado

### Backend

```
Node.js 18+
├── express (4.18.2)           → HTTP Server
├── ws (8.14.2)                → WebSocket
├── better-sqlite3 (9.2.2)     → Database
├── bcryptjs (2.4.3)           → Password hashing
├── jsonwebtoken (9.0.2)       → Auth tokens
├── @google/generative-ai      → Gemini integration
├── dotenv (16.3.1)            → Env variables
├── uuid (9.0.1)               → ID generation
└── cors (2.8.5)               → CORS handling
```

### Frontend

```
Astro 4.0
├── @astrojs/react (3.0.0)     → React integration
├── react (18.2.0)             → UI components
├── react-dom (18.2.0)         → DOM rendering
├── three (0.160.0)            → 3D rendering
├── @react-three/fiber (8.15)  → React + Three.js
└── @react-three/drei (9.92)   → Three.js helpers
```

## Patrones de Diseño Utilizados

### 1. **Repository Pattern** (database/queries.js)

Abstrae acceso a datos, queries reutilizables

### 2. **Service Layer** (services/\*)

Lógica de negocio separada de controladores

### 3. **Middleware Pattern** (middleware/auth.js)

Intercepta requests para autenticación

### 4. **Observer Pattern** (WebSocket)

Notificaciones en tiempo real de cambios de estado

### 5. **Strategy Pattern** (personality.js)

Diferentes estrategias de evolución según contexto

### 6. **Factory Pattern** (memory.js)

Creación de diferentes tipos de memorias

## Escalabilidad

### Actual (SQLite Local)

-   ✅ Perfecto para desarrollo
-   ✅ 1-100 usuarios
-   ✅ Sin configuración adicional

### Para Producción (1000+ usuarios)

-   🔄 Migrar a PostgreSQL/MySQL
-   🔄 Redis para caché de sesiones
-   🔄 Queue system (Bull/RabbitMQ) para procesamiento
-   🔄 Load balancer para múltiples instancias
-   🔄 CDN para assets estáticos

## Seguridad Implementada

```
✅ Passwords hasheados (bcrypt, 10 rounds)
✅ JWT con expiración (7 días)
✅ Validación de entrada
✅ SQL prepared statements (previene SQL injection)
✅ CORS configurado
✅ .env para secretos
⚠️  HTTPS (requerido en producción)
⚠️  Rate limiting (agregar en producción)
⚠️  Input sanitization más estricta
```

## Performance

### Optimizaciones Implementadas

-   ✅ Índices en tablas de BD
-   ✅ Prepared statements (pre-compiled)
-   ✅ Límite de memorias seleccionadas (5)
-   ✅ Límite de historial (10 últimas interacciones)
-   ✅ WebSocket para evitar polling
-   ✅ Lazy loading del avatar 3D

### Métricas Estimadas

-   **Tiempo de respuesta promedio**: 1-3s (depende de Gemini)
-   **Memoria RAM**: ~50MB por instancia
-   **Tamaño de BD**: ~1KB por usuario/día
-   **Ancho de banda**: Mínimo (WebSocket mantiene conexión)

---

**Arquitectura diseñada para**: Escalabilidad, mantenibilidad y extensibilidad
