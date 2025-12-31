import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../middleware/auth.js";
import {
    createUser,
    findUserByEmail,
    updateLastLogin,
    createAIProfile,
    createAIState,
} from "../database/queries.js";

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validación básica
        if (!email || !password || !username) {
            return res.status(400).json({
                error: "Email, contraseña y nombre de usuario son requeridos",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 6 caracteres",
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "El email ya está registrado" });
        }

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const userId = uuidv4();
        await createUser(userId, email, passwordHash, username);

        // Crear perfil de IA para el usuario
        const aiProfileId = uuidv4();
        await createAIProfile(aiProfileId, userId);

        // Crear estado inicial de la IA
        const aiStateId = uuidv4();
        await createAIState(aiStateId, aiProfileId);

        // Generar token
        const token = generateToken(userId);

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            token,
            user: {
                id: userId,
                email,
                username,
            },
        });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email y contraseña son requeridos",
            });
        }

        // Buscar usuario
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );
        if (!validPassword) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Actualizar último login
        await updateLastLogin(user.id);

        // Generar token
        const token = generateToken(user.id);

        res.json({
            message: "Login exitoso",
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

export default router;
