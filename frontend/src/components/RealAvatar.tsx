import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente para cargar y manejar el modelo GLB
function RealModel({ 
  url, 
  mood, 
  onTouchInteraction 
}: { 
  url: string; 
  mood: string;
  onTouchInteraction?: (zone: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  // Carga el modelo.
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  // Manejo de animaciones basado en el estado de ánimo
  useEffect(() => {
    if (actions) {
      // Detener todas las animaciones actuales
      Object.values(actions).forEach(action => action?.fadeOut(0.5));

      // Buscar animación adecuada
      // Intenta buscar por nombre exacto del mood, o palabras clave comunes
      let actionToPlay = actions[mood] || actions['Idle'] || actions['idle'] || actions['Walk'] || Object.values(actions)[0];
      
      // Mapeo de moods a posibles nombres de animación comunes
      if (mood === 'happy' && actions['Jump']) actionToPlay = actions['Jump'];
      if (mood === 'sad' && actions['Sit']) actionToPlay = actions['Sit'];
      if (mood === 'excited' && actions['Run']) actionToPlay = actions['Run'];

      if (actionToPlay) {
        actionToPlay.reset().fadeIn(0.5).play();
      }
    }
  }, [mood, actions]);

  return (
    <group 
      ref={group} 
      dispose={null}
      onClick={(e) => {
        e.stopPropagation();
        // Detección simple de zona basada en la altura del click
        const y = e.point.y;
        let zone = 'body';
        if (y > 0.5) zone = 'head';
        else if (y < 0.1) zone = 'paws';
        
        if (onTouchInteraction) onTouchInteraction(zone);
      }}
    >
      <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
    </group>
  );
}

export default function RealAvatar() {
  const [mood, setMood] = React.useState('happy');
  const [energy, setEnergy] = React.useState(70);

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

  const handleInteraction = (zone: string) => {
    console.log(`Interacción en zona: ${zone}`);
    
    const responses: { [key: string]: string[] } = {
      head: ["¡Me gusta que me acaricien!", "¡Eso se siente bien!"],
      body: ["¡Hola amigo!", "¡Estoy listo para jugar!"],
      paws: ["¡Choca esos cinco!", "¡Vamos!"],
      tail: ["¡Cuidado!", "¿Qué tal?"]
    };

    const zoneResponses = responses[zone] || ["¡Hola!"];
    const response = zoneResponses[Math.floor(Math.random() * zoneResponses.length)];

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'es-ES';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
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
        <RealModel 
          url="/models/Dog.glb" 
          mood={mood} 
          onTouchInteraction={handleInteraction}
        />
      </React.Suspense>

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
useGLTF.preload('/models/Dog.glb');
