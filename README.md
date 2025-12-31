# EMO Web - Robot Social Inteligente 🤖

Una aplicación web interactiva que simula un robot social inteligente con personalidad evolutiva, memoria artificial y conexión emocional real con cada usuario.

## 🌟 Características Principales

-   **Personalidad Evolutiva**: Cada IA se adapta y evoluciona según las interacciones con su usuario
-   **Memoria Artificial**: Recuerda eventos, preferencias y conversaciones importantes
-   **Estado Emocional Dinámico**: Humor, energía, estrés y confianza que cambian en tiempo real
-   **Integración con Gemini AI**: Respuestas inteligentes y contextuales
-   **Voz Sintética**: Síntesis y reconocimiento de voz integrados
-   **Avatar 3D Animado**: Representación visual con Three.js que refleja el estado emocional
-   **WebSocket en Tiempo Real**: Actualizaciones instantáneas del estado

## 🏗️ Arquitectura

### Backend

-   **Node.js + Express**: API REST y WebSocket
-   **SQLite (better-sqlite3)**: Base de datos local
-   **Gemini API**: Modelo de lenguaje para respuestas inteligentes
-   **JWT**: Autenticación segura

### Frontend

-   **Astro**: Framework web moderno
-   **React**: Componentes interactivos
-   **Three.js**: Renderizado 3D del avatar
-   **Web Speech API**: Reconocimiento y síntesis de voz

## 📦 Instalación

### Requisitos Previos

-   Node.js 18+
-   npm o yarn
-   API Key de Google Gemini

### Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY

# Iniciar servidor
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar aplicación
npm run dev
```

El frontend estará disponible en `http://localhost:4321`

## 🚀 Uso

1. **Registro**: Crea una cuenta en la página principal
2. **Login**: Inicia sesión con tus credenciales
3. **Interactúa**: Comienza a chatear con tu EMO personal
4. **Observa**: Ve cómo evoluciona su personalidad con el tiempo

## 🗂️ Estructura del Proyecto

```
EMO/
├── backend/
│   ├── src/
│   │   ├── database/        # Configuración de BD y queries
│   │   ├── middleware/      # Autenticación JWT
│   │   ├── routes/          # Rutas de API (auth, ai)
│   │   ├── services/        # Lógica de negocio (AI, personalidad, memoria)
│   │   ├── websocket/       # Manejo de WebSocket
│   │   └── index.js         # Punto de entrada
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React (Avatar)
│   │   ├── layouts/         # Layouts de Astro
│   │   └── pages/           # Páginas (index, chat)
│   └── package.json
│
└── Documento De Diseño — Emo Web.md
```

## 🧠 Sistema de Personalidad

EMO utiliza vectores de rasgos que evolucionan:

-   **Extroversión**: Se adapta a la cantidad de conversación
-   **Curiosidad**: Aumenta con preguntas del usuario
-   **Empatía**: Responde a las emociones del usuario
-   **Humor**: Se desarrolla con bromas y risas
-   **Dependencia Emocional**: Cambia con la frecuencia de interacción
-   **Formalidad**: Se ajusta al tono del usuario
-   **Energía**: Se degrada con el tiempo y se recupera con interacciones

## 💾 Sistema de Memoria

Tres tipos de memoria:

1. **Hechos**: Información objetiva sobre el usuario
2. **Emociones**: Eventos emocionales significativos
3. **Preferencias**: Gustos y disgustos
4. **Eventos**: Momentos importantes

Las memorias tienen peso emocional (0-100) que determina su importancia y frecuencia de recuerdo.

## 🔐 Seguridad

-   Autenticación JWT con tokens de 7 días
-   Contraseñas hasheadas con bcryptjs
-   Validación de entrada en todas las rutas
-   CORS configurado para desarrollo

## 🎨 Personalización

### Modificar Rasgos Iniciales

Edita `/backend/src/database/init.js` en la tabla `ai_profiles` para cambiar los valores por defecto de personalidad.

### Cambiar Apariencia del Avatar

Modifica `/frontend/src/components/EmoAvatar.tsx` para personalizar colores, formas y animaciones.

### Ajustar Prompts de IA

Edita `/backend/src/services/ai.js` en la función `buildSystemPrompt` para cambiar el comportamiento base de EMO.

## 🐛 Solución de Problemas

### El backend no inicia

-   Verifica que `.env` esté configurado correctamente
-   Asegúrate de tener la API Key de Gemini válida
-   Revisa que el puerto 3000 esté disponible

### El frontend no conecta con el backend

-   Verifica que ambos servidores estén corriendo
-   Revisa la URL en `.env` del frontend
-   Comprueba la consola del navegador para errores CORS

### La voz no funciona

-   El reconocimiento de voz solo funciona en navegadores compatibles (Chrome, Edge)
-   Necesitas dar permisos de micrófono al navegador
-   La síntesis de voz requiere conexión a internet

## 📝 API Endpoints

### Autenticación

-   `POST /api/auth/register` - Registro de usuario
-   `POST /api/auth/login` - Inicio de sesión

### IA

-   `GET /api/ai/profile` - Obtener perfil y estado de IA
-   `GET /api/ai/history` - Obtener historial de conversación
-   `POST /api/ai/chat` - Enviar mensaje a la IA

### WebSocket

-   Conexión: `ws://localhost:3000`
-   Eventos: `auth`, `state_update`, `ping/pong`

## 🔮 Características Futuras

-   [ ] Múltiples personalidades/avatares para elegir
-   [ ] Sistema de logros y progresión
-   [ ] Modo oscuro
-   [ ] Compartir conversaciones
-   [ ] Exportar memorias
-   [ ] Versión móvil nativa
-   [ ] Integración con sensores IoT (temperatura, luz, etc.)
-   [ ] Mini-juegos interactivos con EMO

## 📄 Licencia

MIT License - Siéntete libre de usar y modificar este proyecto.

## 👤 Autor

Proyecto creado siguiendo el diseño funcional de EMO Web.

## 🙏 Agradecimientos

-   Inspirado por el robot EMO de Living.AI
-   Powered by Google Gemini
-   Built with Astro, React y Three.js

---

**Nota**: Este es un proyecto educativo/experimental. No está afiliado con Living.AI ni con el robot EMO oficial.
