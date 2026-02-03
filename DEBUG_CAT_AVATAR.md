# 🐱 Debug del Cat Avatar

## 🔍 Problema Identificado

El CatAvatar tiene dificultades con la detección porque:

1. **Modelo escalado:** El modelo GLB está escalado a `0.01` (muy pequeño)
2. **Posición offset:** Está posicionado en `[0, -1, 0]`
3. **Coordenadas complejas:** La combinación de escala + posición hace que las coordenadas locales sean difíciles de interpretar

## ✅ Solución Implementada

### **1. Usar el grupo raíz para conversión**

```typescript
// ❌ ANTES: Usaba el parent del objeto clickeado
if (clickedObject && clickedObject.parent) {
    localPoint = clickedObject.parent.worldToLocal(point.clone());
}

// ✅ AHORA: Usa el grupo raíz que contiene TODO el modelo
if (group.current) {
    localPoint = group.current.worldToLocal(point.clone());
}
```

**Ventaja:** El grupo raíz tiene toda la transformación (escala + posición) aplicada.

### **2. Compensar el offset de posición**

```typescript
// El modelo está en position={[0, -1, 0]}
const y = localPoint.y + 1; // Compensar el offset
```

### **3. Ajustar umbrales para el modelo pequeño**

```typescript
// Modelo normal (escala 1.0)
if (y > 0.4) return "head";

// Modelo GLB (escala 0.01) - umbrales ajustados
if (y > 0.6) return "head"; // Más alto
if (y < 0.1) return "paws"; // Más bajo
```

## 🎯 Zonas de Detección Ajustadas

### **Mapa de Coordenadas (después de compensación)**

```
                Y > 0.6
                  🐱 HEAD
                   |
         Z < -0.2  |  Z > 0
           BACK ←--+--→ CHEST
                   |
              Y: 0.1 - 0.6
                   |
         Z < -0.3  |  |X| < 0.15
           TAIL ←--+--→ BELLY
                   |
                Y < 0.1
                  🐾 PAWS
```

### **Coordenadas Específicas**

| Zona      | Condición Y | Condición Z | Condición X  | Prioridad |
| --------- | ----------- | ----------- | ------------ | --------- |
| **head**  | > 0.6       | cualquier   | cualquier    | Alta      |
| **tail**  | cualquier   | < -0.3      | cualquier    | Media     |
| **back**  | 0.2 - 0.6   | < -0.2      | cualquier    | Media     |
| **chest** | 0.2 - 0.6   | > 0         | cualquier    | Media     |
| **belly** | 0.1 - 0.4   | cualquier   | \|x\| < 0.15 | Media     |
| **paws**  | < 0.1       | cualquier   | cualquier    | Baja      |

## 🛠️ Cómo Debuggear

### **1. Ver coordenadas en consola**

La línea de debug está activa:

```typescript
console.log(
    `Click en: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}, nombre="${objectName}"`,
);
```

**Al hacer click verás en consola:**

```
Click en: x=0.12, y=0.65, z=0.05, nombre="Cat_Head_Mesh"
```

### **2. Observar indicadores visuales**

- **Hover:** Muestra "Tocar [zona]" cuando pasas el mouse
- **Click:** Muestra "Click detectado ✓" cuando haces click
- **Efecto:** Esfera amarilla en el punto exacto del click

### **3. Probar diferentes ángulos**

```bash
# Rota la cámara con OrbitControls y haz click en:
- Parte de arriba → Debe detectar "head"
- Parte de atrás → Debe detectar "back" o "tail"
- Parte de frente → Debe detectar "chest"
- Parte de abajo → Debe detectar "belly" o "paws"
```

## 📊 Casos de Prueba

### **Test 1: Detección por Altura**

```
Click Y > 0.6  → "head"  ✓
Click Y = 0.3  → "belly" o "chest" ✓
Click Y < 0.1  → "paws"  ✓
```

### **Test 2: Detección por Profundidad**

```
Click Z > 0    → "chest" ✓
Click Z < -0.2 → "back"  ✓
Click Z < -0.3 → "tail"  ✓
```

### **Test 3: Rotación de Cámara**

```
Vista frontal  → "chest" y "head" detectables ✓
Vista lateral  → "back" y "belly" detectables ✓
Vista trasera  → "tail" y "back" detectables ✓
Vista superior → "head" y "back" detectables ✓
```

## 🔧 Ajustes Finos

Si la detección aún no funciona bien, ajusta estos valores:

### **Opción 1: Cambiar umbrales de Y**

```typescript
// En detectZone()
if (y > 0.7) return "head"; // Más restrictivo
if (y < 0.05) return "paws"; // Más restrictivo
```

### **Opción 2: Cambiar umbrales de Z**

```typescript
if (z < -0.4) return "tail"; // Más hacia atrás
if (z > 0.1) return "chest"; // Más hacia adelante
```

### **Opción 3: Ajustar compensación Y**

```typescript
// Si el modelo parece estar más alto o bajo
const y = localPoint.y + 1.2; // Era 1.0, prueba con 1.2
```

### **Opción 4: Investigar nombres del modelo**

Abre la consola del navegador y haz varios clicks. Mira los nombres:

```
nombre="Cat_Head_001"  → Agregar a detección de head
nombre="Cat_Tail_Bone" → Agregar a detección de tail
```

Luego actualiza el código:

```typescript
if (
    name.includes("head") ||
    name.includes("skull") ||
    name.includes("_head_")
) {
    return "head";
}
```

## 🎨 Modelo GLB - Estructura

El archivo `Cat.glb` debería tener:

- **Meshes:** Geometrías visibles (cuerpo, cabeza, patas, etc.)
- **Bones:** Estructura de animación (opcional)
- **Animations:** Animaciones (opcional)

Para ver la estructura interna:

```bash
# Con gltf-transform (npm install -g @gltf-transform/cli)
gltf-transform inspect public/models/Cat.glb

# O abre en https://gltf.report/
```

## 🐛 Problemas Comunes

### **1. Siempre detecta "body"**

- ❌ Las coordenadas locales no se están calculando bien
- ✅ Verifica que `group.current` existe
- ✅ Revisa los valores en consola

### **2. Detección invertida**

- ❌ El modelo está rotado en el GLB
- ✅ Ajusta la rotación del primitive:

```typescript
<primitive object={scene} scale={0.01} position={[0, -1, 0]} rotation={[0, Math.PI, 0]} />
```

### **3. No detecta clicks**

- ❌ El modelo no tiene geometría clickeable
- ✅ Verifica que el GLB tenga meshes, no solo bones
- ✅ Agrega `onPointerMissed` para debuggear

### **4. Hover no funciona**

- ❌ El cursor no cambia
- ✅ Verifica que `e.stopPropagation()` esté presente
- ✅ Asegúrate que el Canvas tenga `style={{ background: 'transparent' }}`

## 📈 Mejoras Futuras

1. **Raycast manual:** Para detección más precisa
2. **Bounding boxes:** Definir zonas con cajas invisibles
3. **Texture maps:** Usar colores en una textura para definir zonas
4. **Mesh names:** Renombrar partes en Blender antes de exportar

## 🎯 Resultado Esperado

Después de estos cambios:

- ✅ Detección funciona desde cualquier ángulo
- ✅ Coordenadas locales correctas
- ✅ Umbrales ajustados al modelo pequeño
- ✅ Debug visual activo
- ✅ Console.log muestra valores reales

**Si aún hay problemas, revisa los valores en consola y ajusta los umbrales según tus pruebas.**
