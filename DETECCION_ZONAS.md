# 🎯 Sistema de Detección de Zonas Interactivas

## 📝 Problema Original

Cuando giramos los avatares con OrbitControls, la detección de zonas fallaba porque:

```javascript
// ❌ PROBLEMA: Usa coordenadas del mundo (world space)
onClick={(e) => {
  const y = e.point.y; // Esto NO cambia con la rotación del objeto
  handleTouch(y > 0.3 ? 'head' : 'body');
}}
```

**¿Por qué falla?**

- `e.point` son coordenadas globales (mundo)
- Al rotar la cámara con OrbitControls, el avatar NO rota en el mundo
- Solo la perspectiva de visualización cambia
- Las coordenadas Y siempre apuntan "hacia arriba" en el mundo, no relativamente al objeto

## ✅ Solución Implementada

### 1. **Coordenadas Locales (Local Space)**

```javascript
// ✅ SOLUCIÓN: Convertir a coordenadas locales del objeto
onClick={(e) => {
  const localPoint = e.object.worldToLocal(e.point.clone());
  const y = localPoint.y; // Ahora es relativo AL OBJETO
  handleTouch(y > 0.3 ? 'head' : 'body');
}}
```

**Método:** `worldToLocal(vector)`

- Convierte un punto de coordenadas globales a coordenadas locales del objeto
- Ahora Y está relativo al sistema de coordenadas del objeto 3D
- Funciona independientemente de cómo veas el objeto

---

## 🤖 Detección por Avatar

### **EMO Avatar** (Robot Esférico)

**Estrategia:** Detección simple por altura Y local

```typescript
// Esfera principal dividida en 2 zonas
const localPoint = e.object.worldToLocal(e.point.clone());
const y = localPoint.y;

if (y > 0.3) → 'head'    // Parte superior de la esfera
else → 'body'             // Parte inferior de la esfera
```

**Zonas:**

- ✅ **head** (cabeza): Y > 0.3
- ✅ **body** (cuerpo): Y ≤ 0.3
- ✅ **antenna** (antena): Objetos específicos con nombre
- ✅ **wheels** (ruedas): Objetos específicos con nombre

**Nombres de objetos:**

```
emo-body          → Esfera principal
emo-antenna-rod   → Barra de antena
emo-antenna-tip   → Bolita roja de antena
emo-wheel-left    → Rueda izquierda
emo-wheel-right   → Rueda derecha
```

---

### **Cat Avatar** (Modelo 3D GLB)

**Estrategia:** Doble sistema - Nombre + Posición local

```typescript
const detectZone = (point, objectName, clickedObject) => {
    // 1. Convertir a coordenadas locales
    let localPoint = point.clone();
    if (clickedObject && clickedObject.parent) {
        localPoint = clickedObject.parent.worldToLocal(point.clone());
    }

    const y = localPoint.y;
    const x = localPoint.x;
    const z = localPoint.z;

    // 2. PRIORIDAD 1: Nombre del objeto (más confiable)
    const name = objectName.toLowerCase();
    if (name.includes("head")) return "head";
    if (name.includes("tail")) return "tail";
    // ... etc

    // 3. PRIORIDAD 2: Posición relativa (fallback)
    if (y > 0.4) return "head";
    if (z < -0.3 && y < 0.2) return "tail";
    // ... etc
};
```

**Zonas:** 7 zonas detectables

- 🐱 **head** (cabeza): Y > 0.4 o nombre incluye "head/ear/face"
- 👂 **ears** (orejas): Nombre incluye "ear"
- 🔙 **back** (espalda): Z < 0, Y > 0 o nombre "back/spine"
- 🌸 **belly** (barriga): Y < 0, |X| < 0.2 o nombre "belly/stomach"
- 🐾 **paws** (patas): Y < -0.3 o nombre "paw/leg/foot"
- 🎀 **tail** (cola): Z < -0.3, Y < 0.2 o nombre "tail"
- 💖 **chest** (pecho): Y > -0.1, Z > 0 o nombre "chest/torso"

**¿Por qué funciona mejor?**

1. **Modelo GLB:** Los objetos ya tienen nombres asignados en Blender
2. **Doble verificación:** Primero nombre, luego posición
3. **Coordenadas locales:** Se adaptan a la rotación del modelo

---

### **Tech Avatar** (Robot Hexagonal)

**Estrategia:** Objetos individuales con nombres

```typescript
// Cada parte es un objeto separado con onClick individual
<mesh name="tech-core" onClick={() => handleTouch('core')}>
<group name="tech-head-group" onClick={() => handleTouch('head')}>
<Cylinder name="tech-scanner-rod" onClick={() => handleTouch('scanner')}>
<Cylinder name="tech-thruster-left" onClick={() => handleTouch('thrusters')}>
```

**Zonas:** 4 zonas bien definidas

- 🎛️ **core** (núcleo): Cilindro hexagonal central
- 👁️ **head** (cabeza): Caja superior con visor
- 🔍 **scanner** (escáner): Cilindro + esfera superior
- 🚀 **thrusters** (propulsores): 2 cilindros inferiores

**Ventaja:** No necesita cálculo de posición, cada parte es clickeable independientemente

---

## 🔧 Implementación Técnica

### **worldToLocal() - Three.js**

```typescript
// Método de THREE.Object3D
object.worldToLocal(vector: Vector3): Vector3

// Ejemplo práctico:
const worldPoint = new THREE.Vector3(5, 10, 3); // Coordenadas globales
const localPoint = sphere.worldToLocal(worldPoint.clone());
// localPoint ahora tiene coordenadas relativas a 'sphere'
```

### **Flujo de Detección**

```
1. Usuario hace click en el avatar
   ↓
2. Three.js detecta intersección
   ↓
3. e.point = coordenadas del click (mundo)
4. e.object = mesh que fue clickeado
   ↓
5. localPoint = e.object.worldToLocal(e.point.clone())
   ↓
6. Analizar localPoint.x, localPoint.y, localPoint.z
   ↓
7. Determinar zona según valores
   ↓
8. handleTouch(zona)
```

---

## 📊 Comparativa de Métodos

| Método                | Ventajas                  | Desventajas                      | Usado en |
| --------------------- | ------------------------- | -------------------------------- | -------- |
| **Altura Y simple**   | Muy rápido, simple        | Solo funciona con formas simples | EMO      |
| **Nombre + Posición** | Preciso, flexible         | Requiere modelo bien nombrado    | Cat      |
| **Objetos separados** | Más preciso, sin cálculos | Más código, más objetos          | Tech     |

---

## 🎮 Cómo Mejorar la Detección

### **1. Para modelos GLB:**

```javascript
// En Blender, nombrar correctamente cada parte
Head_Mesh → detecta como 'head'
Tail_Bone → detecta como 'tail'
Paw_Left_Mesh → detecta como 'paws'
```

### **2. Para geometrías primitivas:**

```javascript
// Dividir en más objetos separados
<Sphere name="head-upper" />
<Sphere name="head-lower" />
// En vez de calcular con Y
```

### **3. Usar raycasting manual:**

```javascript
// Para detección super precisa
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children, true);
```

---

## 🐛 Debug Tips

### **Ver coordenadas en consola:**

```typescript
onClick={(e) => {
  console.log('World:', e.point);
  console.log('Local:', e.object.worldToLocal(e.point.clone()));
  console.log('Object name:', e.object.name);
}
```

### **Visualizar zonas:**

```typescript
// Agregar helpers visuales
const helper = new THREE.Box3Helper(boundingBox, 0xffff00);
scene.add(helper);
```

### **Probar diferentes ángulos:**

```typescript
// Rotar cámara programáticamente
camera.position.set(x, y, z);
camera.lookAt(0, 0, 0);
```

---

## ✨ Resultado Final

**Ahora la detección funciona:**

- ✅ Desde cualquier ángulo de cámara
- ✅ Con OrbitControls activo
- ✅ Independiente de la rotación de vista
- ✅ Precisa en modelos GLB complejos
- ✅ Rápida en geometrías primitivas

**La clave:** Usar coordenadas locales (`worldToLocal`) en vez de coordenadas globales (`e.point` directamente).
