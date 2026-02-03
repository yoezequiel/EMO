import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente para cargar y manejar el modelo GLB
function CatModel({ 
  url, 
  mood, 
  onTouchInteraction 
}: { 
  url: string; 
  mood: string;
  onTouchInteraction?: (zone: string, position: THREE.Vector3) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hoveredPart, setHoveredPart] = React.useState<string | null>(null);
  const [touchEffect, setTouchEffect] = React.useState<{ active: boolean, position: THREE.Vector3 | null }>({ 
    active: false, 
    position: null 
  });
  const [currentAnimation, setCurrentAnimation] = React.useState<string>('idle');
  
  // Carga el modelo.
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  // Manejo de animaciones basado en el estado de ánimo
  useEffect(() => {
    if (actions) {
      // Detener todas las animaciones actuales
      Object.values(actions).forEach(action => action?.fadeOut(0.5));

      // Buscar animación adecuada según currentAnimation o mood
      let actionToPlay = actions[currentAnimation] || actions[mood] || actions['Idle'] || actions['idle'] || actions['Walk'] || Object.values(actions)[0];
      
      // Mapeo de moods y animaciones a posibles nombres comunes
      if (mood === 'happy' && actions['Jump']) actionToPlay = actions['Jump'];
      if (mood === 'sad' && actions['Sit']) actionToPlay = actions['Sit'];
      if (mood === 'excited' && actions['Run']) actionToPlay = actions['Run'];
      if (mood === 'playful' && actions['Dance']) actionToPlay = actions['Dance'];
      
      // Animaciones según zona tocada
      if (currentAnimation === 'shake' && actions['Shake']) actionToPlay = actions['Shake'];
      if (currentAnimation === 'stretch' && actions['Stretch']) actionToPlay = actions['Stretch'];
      if (currentAnimation === 'scratch' && actions['Scratch']) actionToPlay = actions['Scratch'];
      if (currentAnimation === 'lick' && actions['Lick']) actionToPlay = actions['Lick'];
      if (currentAnimation === 'turn' && actions['Turn']) actionToPlay = actions['Turn'];

      if (actionToPlay) {
        actionToPlay.reset().fadeIn(0.5).play();
      }
    }
  }, [mood, actions, currentAnimation]);

  // Efecto visual de toque y animación
  useEffect(() => {
    if (touchEffect.active && group.current) {
      // Efecto de bounce
      const originalScale = group.current.scale.clone();
      group.current.scale.multiplyScalar(1.1);
      
      setTimeout(() => {
        if (group.current) {
          group.current.scale.copy(originalScale);
        }
      }, 150);
      
      setTimeout(() => {
        setTouchEffect({ active: false, position: null });
      }, 200);
    }
  }, [touchEffect.active]);
  
  // Función para activar animación según zona
  const playZoneAnimation = (zone: string) => {
    const animationMap: { [key: string]: string } = {
      head: 'scratch',     // Rascarse la cabeza
      ears: 'shake',       // Sacudirse
      back: 'stretch',     // Estirarse
      belly: 'lick',       // Lamerse (confía)
      paws: 'shake',       // Sacudirse
      tail: 'turn',        // Girar
      chest: 'idle',       // Reposo feliz
    };
    
    const animation = animationMap[zone] || 'idle';
    setCurrentAnimation(animation);
    
    // Volver a animación normal después de 2 segundos
    setTimeout(() => {
      setCurrentAnimation('idle');
    }, 2000);
  };

  // Detectar parte del modelo según posición (coordenadas locales)
  const detectZone = (point: THREE.Vector3, objectName: string) => {
    // Convertir punto de mundo a coordenadas locales del GRUPO completo
    let localPoint = point.clone();
    if (group.current) {
      localPoint = group.current.worldToLocal(point.clone());
    }
    
    // Ajustar por la escala (0.01) y posición ([0, -1, 0]) del modelo
    // El modelo está escalado a 0.01, así que las coordenadas son muy pequeñas
    // Compensar la posición Y
    const y = localPoint.y + 1; // Compensar el offset de -1
    const x = localPoint.x;
    const z = localPoint.z;
    
    // Debug: descomentar para ver valores
    console.log(`Click en: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}, nombre="${objectName}"`);
    
    // Detección mejorada por nombre de objeto y posición local
    const name = objectName.toLowerCase();
    
    // Prioridad 1: Nombre del objeto (más confiable para modelos GLB)
    if (name.includes('head') || name.includes('ear') || name.includes('face') || name.includes('skull')) {
      return 'head';
    } else if (name.includes('tail')) {
      return 'tail';
    } else if (name.includes('paw') || name.includes('leg') || name.includes('foot')) {
      return 'paws';
    } else if (name.includes('back') || name.includes('spine')) {
      return 'back';
    } else if (name.includes('belly') || name.includes('stomach')) {
      return 'belly';
    } else if (name.includes('chest') || name.includes('torso') || name.includes('breast')) {
      return 'chest';
    }
    
    // Prioridad 2: Posición relativa (ajustada para el modelo escalado)
    // El gato está orientado mirando hacia +Z
    if (y > 0.6) {
      return 'head';  // Parte alta
    } else if (z < -0.2 && y > 0.2 && y < 0.6) {
      return 'back';  // Parte trasera superior
    } else if (z < -0.3) {
      return 'tail';  // Muy atrás
    } else if (y < 0.1) {
      return 'paws';  // Parte baja
    } else if (y > 0.1 && y < 0.4 && Math.abs(x) < 0.15) {
      return 'belly'; // Centro bajo
    } else if (z > 0 && y > 0.2 && y < 0.6) {
      return 'chest'; // Parte frontal media
    }
    
    return 'body';
  };

  return (
    <group 
      ref={group} 
      dispose={null}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        const zone = detectZone(e.point, e.object.name);
        setHoveredPart(zone);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        setHoveredPart(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        const zone = detectZone(e.point, e.object.name);
        setTouchEffect({ active: true, position: e.point.clone() });
        playZoneAnimation(zone);
        
        if (onTouchInteraction) {
          onTouchInteraction(zone, e.point);
        }
      }}
    >
      <primitive object={scene} scale={0.01} position={[0, -1, 0]} />
      
      {/* Efecto visual de toque */}
      {touchEffect.active && touchEffect.position && (
        <mesh position={touchEffect.position}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Indicador de hover */}
      {hoveredPart && (
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            Tocar {hoveredPart}
          </div>
        </Html>
      )}
      
      {/* Debug: Mostrar coordenadas del último click */}
      {touchEffect.active && touchEffect.position && (
        <Html position={[0, 1.8, 0]} center>
          <div style={{
            background: 'rgba(255,100,0,0.9)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '8px',
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            Click detectado ✓
          </div>
        </Html>
      )}
    </group>
  );
}

export default function CatAvatar() {
  const [mood, setMood] = React.useState('happy');
  const [energy, setEnergy] = React.useState(70);
  const [affection, setAffection] = React.useState(50);
  const [lastInteraction, setLastInteraction] = React.useState<string>('');

  // Escuchar eventos de estado de EMO
  React.useEffect(() => {
    const handleStateUpdate = (event: any) => {
      if (event.detail) {
        if (event.detail.mood) setMood(event.detail.mood);
        if (event.detail.energy !== undefined) setEnergy(event.detail.energy);
      }
    };

    window.addEventListener('emo-state-update', handleStateUpdate);
    return () => window.removeEventListener('emo-state-update', handleStateUpdate);
  }, []);

  const handleInteraction = (zone: string, position: THREE.Vector3) => {
    console.log(`Interacción en zona: ${zone} en posición:`, position);
    setLastInteraction(zone);
    
    // Respuestas más ricas y variadas por zona
    const responses: { [key: string]: { text: string[], reactions: string[] } } = {
      head: {
        text: [
          "¡Miau! Me encanta que me acaricies la cabeza",
          "¡Ronroneo! ¡Qué rico!",
          "¡Así me gusta! Justo detrás de las orejas",
          "Mmmm, sigue así por favor",
          "¡Eres el mejor humano del mundo!"
        ],
        reactions: ['happy', 'relaxed', 'content']
      },
      ears: {
        text: [
          "¡Cuidado con las orejas!",
          "Puedo escuchar todo desde aquí",
          "¡Mis orejitas son sensibles!",
          "¿Escuchas lo que yo escucho?"
        ],
        reactions: ['curious', 'alert']
      },
      back: {
        text: [
          "¡Sí! Justo ahí en mi espalda",
          "¡Qué cosquillas!",
          "¿Puedes rascar un poco más arriba?",
          "Mi espalda estaba pidiendo caricias"
        ],
        reactions: ['happy', 'playful']
      },
      belly: {
        text: [
          "¡Mi pancita! ¡Ten cuidado!",
          "Esta es la zona de máxima confianza",
          "¡Cosquillas! ¡Jajaja!",
          "Solo dejo que mis mejores amigos toquen mi barriga",
          "¡Eso hace cosquillas pero me gusta!"
        ],
        reactions: ['trusting', 'playful', 'vulnerable']
      },
      paws: {
        text: [
          "¡Choca esas cinco!",
          "¡Mis patitas!",
          "¿Quieres que te dé la patita?",
          "¡Vamos! ¡Chócalas!",
          "Estas patitas me llevan a todas partes"
        ],
        reactions: ['playful', 'excited']
      },
      tail: {
        text: [
          "¡Cuidado con mi cola!",
          "Mi cola tiene vida propia",
          "¡No jales mi cola!",
          "¿Sabías que mi cola expresa mis emociones?",
          "¡Mi cola es mi timón!"
        ],
        reactions: ['annoyed', 'alert', 'playful']
      },
      chest: {
        text: [
          "Me gusta que me rasques el pecho",
          "¡Ronroneo! Esto es relajante",
          "Aquí es donde ronroneo más fuerte",
          "¡Más caricias por favor!"
        ],
        reactions: ['relaxed', 'happy']
      },
      body: {
        text: [
          "¡Hola amigo!",
          "¡Me gusta cuando me acaricias!",
          "¡Estoy listo para jugar!",
          "¿Quieres que hagamos algo divertido?",
          "¡Miau! ¿Qué tal tu día?"
        ],
        reactions: ['friendly', 'curious']
      }
    };

    const zoneData = responses[zone] || responses['body'];
    const response = zoneData.text[Math.floor(Math.random() * zoneData.text.length)];
    const reaction = zoneData.reactions[Math.floor(Math.random() * zoneData.reactions.length)];

    // Actualizar estado según la interacción
    if (['head', 'back', 'chest', 'belly'].includes(zone)) {
      setAffection(prev => Math.min(100, prev + 5));
      setEnergy(prev => Math.max(0, prev - 2));
    } else if (zone === 'paws') {
      setEnergy(prev => Math.min(100, prev + 5));
      setAffection(prev => Math.min(100, prev + 3));
    } else if (zone === 'tail') {
      setEnergy(prev => Math.min(100, prev + 3));
    }

    // Cambiar mood temporalmente
    setMood(reaction);
    setTimeout(() => {
      setMood('happy');
    }, 3000);

    // Síntesis de voz
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'es-ES';
      utterance.rate = 1.1;
      utterance.pitch = 1.2; // Más agudo para sonar como gato
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }

    // Emitir evento de interacción
    const event = new CustomEvent('cat-interaction', {
      detail: { zone, position, response, affection, energy, mood: reaction, timestamp: Date.now() }
    });
    window.dispatchEvent(event);

    // NO agregar mensaje aquí - se hace en el listener del chat para evitar duplicados
  };

  return (
    <Canvas
      camera={{ position: [0, 1, 4], fov: 45 }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
      shadows
    >
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Iluminación de entorno para realismo */}
      <Environment preset="city" />

      <React.Suspense fallback={<Html center>Cargando modelo...</Html>}>
        <CatModel 
          url="/models/Cat.glb" 
          mood={mood} 
          onTouchInteraction={handleInteraction}
        />
      </React.Suspense>

      {/* Indicadores de estado */}
      <Html position={[-2, 2, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          minWidth: '120px'
        }}>
          <div>💖 Afecto: {affection}%</div>
          <div>⚡ Energía: {energy}%</div>
          <div>😺 Humor: {mood}</div>
          {lastInteraction && <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.8 }}>
            Última: {lastInteraction}
          </div>}
        </div>
      </Html>

      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

// Pre-carga el modelo
useGLTF.preload('/models/Cat.glb');
