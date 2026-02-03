import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Cliente de base de datos
export let db;

/**
 * Inicializa la conexión a la base de datos Turso
 */
export async function initDatabase() {
    try {
        // Crear cliente de Turso
        db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        console.log("📊 Conectando a la base de datos...");

        // Crear tablas si no existen
        await createTables();

        console.log("✅ Base de datos inicializada correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar base de datos:", error);
        throw error;
    }
}

/**
 * Crea las tablas necesarias en la base de datos
 * Nota: Las tablas ya existen en Turso, esta función solo valida la conexión
 */
async function createTables() {
    // Tabla de usuarios
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            last_login INTEGER
        )
    `);

    // Tabla de perfiles de IA
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ai_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT DEFAULT 'EMO',
            created_at INTEGER NOT NULL,
            extroversion INTEGER DEFAULT 50,
            curiosity INTEGER DEFAULT 50,
            empathy INTEGER DEFAULT 50,
            humor INTEGER DEFAULT 50,
            emotional_dependency INTEGER DEFAULT 30,
            formality INTEGER DEFAULT 40,
            energy INTEGER DEFAULT 70,
            total_interactions INTEGER DEFAULT 0,
            last_modified INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Tabla de estados de IA
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ai_state (
            id TEXT PRIMARY KEY,
            ai_profile_id TEXT NOT NULL,
            mood INTEGER DEFAULT 50,
            energy INTEGER DEFAULT 50,
            stress INTEGER DEFAULT 0,
            confidence INTEGER DEFAULT 50,
            last_interaction INTEGER,
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (ai_profile_id) REFERENCES ai_profiles(id)
        )
    `);

    // Tabla de memorias (ai_memory)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ai_memory (
            id TEXT PRIMARY KEY,
            ai_profile_id TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            emotional_weight INTEGER DEFAULT 50,
            created_at INTEGER NOT NULL,
            access_count INTEGER DEFAULT 0,
            last_accessed INTEGER,
            FOREIGN KEY (ai_profile_id) REFERENCES ai_profiles(id)
        )
    `);

    // Índices para ai_memory
    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_memory_emotional_weight 
        ON ai_memory(emotional_weight)
    `);

    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_memory_profile_category 
        ON ai_memory(ai_profile_id, category)
    `);

    // Tabla de interacciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS interactions (
            id TEXT PRIMARY KEY,
            ai_profile_id TEXT NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            mood_before TEXT,
            mood_after TEXT,
            energy_before INTEGER,
            energy_after INTEGER,
            timestamp INTEGER NOT NULL,
            response_time_ms INTEGER,
            FOREIGN KEY (ai_profile_id) REFERENCES ai_profiles(id)
        )
    `);

    // Índice para interactions
    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_interactions_profile_time 
        ON interactions(ai_profile_id, timestamp)
    `);

    // Tabla de conversaciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            ai_profile_id TEXT NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (ai_profile_id) REFERENCES ai_profiles(id)
        )
    `);

    console.log("✅ Tablas verificadas/creadas correctamente");
}

/**
 * Cierra la conexión a la base de datos
 */
export async function closeDatabase() {
    if (db) {
        await db.close();
        console.log("📊 Conexión a base de datos cerrada");
    }
}
