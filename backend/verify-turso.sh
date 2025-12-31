#!/bin/bash

echo "🔍 Verificando configuración de Turso..."
echo ""

# Verificar si turso CLI está instalado
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  curl -sSfL https://get.tur.so/install.sh | bash"
    echo ""
    exit 1
fi

echo "✅ Turso CLI instalado"

# Verificar login
if ! turso auth status &> /dev/null; then
    echo "❌ No has iniciado sesión en Turso"
    echo ""
    echo "Inicia sesión con:"
    echo "  turso auth login"
    echo ""
    exit 1
fi

echo "✅ Sesión activa en Turso"
echo ""

# Listar bases de datos
echo "📋 Tus bases de datos:"
turso db list

echo ""
echo "🎯 Para crear la base de datos EMO:"
echo ""
echo "  turso db create emo-web"
echo ""
echo "Luego actualiza el .env con:"
echo "  turso db show emo-web --url"
echo "  turso db tokens create emo-web"
echo ""
