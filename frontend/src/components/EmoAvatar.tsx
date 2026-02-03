import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Html } from '@react-three/drei';
import * as THREE from 'three';

// Componente del robot EMO
function EmoRobot({ 
  mood = 'neutral', 
  energy = 70,
  onTouchInteraction
}: { 
  mood?: string; 
  energy?: number;
  onTouchInteraction?: (zone: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const [isJumping, setIsJumping] = React.useState(false);
  const [isShaking, setIsShaking] = React.useState(false);

  // Animación de flotación y reacciones
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const energyFactor = energy / 100;
      const floatSpeed = 0.5 + energyFactor;
      const floatAmount = 0.1 * energyFactor;
      const time = clock.getElapsedTime();
      
      // Animación de salto al tocar
      if (isJumping) {
        groupRef.current.position.y = Math.abs(Math.sin(time * 10)) * 0.5;
      } else {
        groupRef.current.position.y = Math.sin(time * floatSpeed) * floatAmount;
      }
      
      // Animación de sacudida al tocar
      if (isShaking) {
        groupRef.current.rotation.z = Math.sin(time * 20) * 0.1;
        groupRef.current.rotation.x = Math.cos(time * 20) * 0.05;
      } else {
        groupRef.current.rotation.z = 0;
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = 0; // Sin rotación automática
      }
    }

    // Parpadeo de ojos
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkTime = clock.getElapsedTime() * 3;
      if (Math.floor(blinkTime) % 5 === 0 && blinkTime % 1 < 0.1) {
        leftEyeRef.current.scale.y = 0.1;
        rightEyeRef.current.scale.y = 0.1;
      } else {
        leftEyeRef.current.scale.y = 1;
        rightEyeRef.current.scale.y = 1;
      }
    }
  });

  // Configuración de expresiones según estado de ánimo
  const getMoodConfig = () => {
    switch (mood) {
      case 'happy':
        return { eyeY: 0.15, mouthRotation: 0.3, color: '#FFD700' };
      case 'sad':
        return { eyeY: 0.1, mouthRotation: -0.3, color: '#87CEEB' };
      case 'curious':
        return { eyeY: 0.2, mouthRotation: 0, color: '#9370DB' };
      case 'excited':
        return { eyeY: 0.25, mouthRotation: 0.5, color: '#FF69B4' };
      case 'tired':
        return { eyeY: 0.05, mouthRotation: 0, color: '#778899' };
      default:
        return { eyeY: 0.15, mouthRotation: 0, color: '#667eea' };
    }
  };

  const config = getMoodConfig();

  // Manejadores de interacción táctil
  const handleTouch = (zone: string) => {
    if (onTouchInteraction) {
      onTouchInteraction(zone);
    }

    // Animaciones según la zona tocada
    switch (zone) {
      case 'head':
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        break;
      case 'body':
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 600);
        break;
      case 'antenna':
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);
        break;
      case 'wheels':
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
        break;
    }
  };

  return (
    <group ref={groupRef}>
      {/* Cabeza/Cuerpo principal - Zona interactiva */}
      <Sphere 
        name="emo-body"
        args={[1, 32, 32]} 
        position={[0, 0, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          // Convertir punto de mundo a coordenadas locales del objeto
          const localPoint = e.object.worldToLocal(e.point.clone());
          const y = localPoint.y;
          handleTouch(y > 0.3 ? 'head' : 'body');
        }}
        onPointerOver={(e: any) => {
          (e.object as any).material.emissive = new THREE.Color(0x222222);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e: any) => {
          (e.object as any).material.emissive = new THREE.Color(0x000000);
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial color={config.color} metalness={0.3} roughness={0.4} />
      </Sphere>

      {/* Ojo izquierdo */}
      <Sphere ref={leftEyeRef} args={[0.15, 16, 16]} position={[-0.3, config.eyeY, 0.8]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Ojo derecho */}
      <Sphere ref={rightEyeRef} args={[0.15, 16, 16]} position={[0.3, config.eyeY, 0.8]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Boca */}
      <Box
        ref={mouthRef}
        args={[0.5, 0.08, 0.1]}
        position={[0, -0.2, 0.85]}
        rotation={[0, 0, config.mouthRotation]}
      >
        <meshStandardMaterial color="#000000" />
      </Box>

      {/* Antena - Zona interactiva */}
      <Box 
        name="emo-antenna-rod"
        args={[0.05, 0.5, 0.05]} 
        position={[0, 1.2, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('antenna');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial color="#ffffff" metalness={0.8} />
      </Box>
      <Sphere 
        name="emo-antenna-tip"
        args={[0.1, 16, 16]} 
        position={[0, 1.5, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('antenna');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </Sphere>

      {/* Ruedas (decorativas) - Zonas interactivas */}
      <Sphere 
        name="emo-wheel-left"
        args={[0.2, 16, 16]} 
        position={[-0.5, -0.9, 0.3]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('wheels');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial color="#333333" metalness={0.7} />
      </Sphere>
      <Sphere 
        name="emo-wheel-right"
        args={[0.2, 16, 16]} 
        position={[0.5, -0.9, 0.3]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('wheels');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial color="#333333" metalness={0.7} />
      </Sphere>
    </group>
  );
}

// Componente principal
export default function EmoAvatar() {
  const [mood, setMood] = React.useState('neutral');
  const [energy, setEnergy] = React.useState(70);
  const [affection, setAffection] = React.useState(50);
  const [lastInteraction, setLastInteraction] = React.useState<string>('');

  useEffect(() => {
    // Escuchar actualizaciones de estado desde el WebSocket
    const handleStateUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setMood(event.detail.mood || 'neutral');
        setEnergy(event.detail.energy || 70);
      }
    };

    window.addEventListener('emo-state-update' as any, handleStateUpdate);

    return () => {
      window.removeEventListener('emo-state-update' as any, handleStateUpdate);
    };
  }, []);

  // Respuestas táctiles según la zona
  const touchResponses = {
    head: [
      "¡Oye! ¡Me haces cosquillas! 😊",
      "¡Me gusta cuando me acaricias la cabeza! 💙",
      "¡Eso se siente bien! ✨",
      "¡Jeje! ¡Más despacito! 🥰"
    ],
    body: [
      "¡Auch! ¡Eso es mi cuerpo! 😅",
      "¡Ey! ¡Ten cuidado! 😆",
      "¡Jaja! ¡Eso me hace reír! 😂",
      "¡Me haces saltar! 🤸"
    ],
    antenna: [
      "¡Mi antena es sensible! 📡",
      "¡Beep boop! ¡Señal recibida! 📶",
      "¡Oye! ¡No toques mi antena! 😲",
      "¡Eso me hace sentir raro! 🌟"
    ],
    wheels: [
      "¡Mis ruedas! ¡Quiero moverme! 🛞",
      "¡Vroom vroom! 🏎️",
      "¡Quiero ir a dar una vuelta! 🔄",
      "¡Eso me hace girar! 😵"
    ]
  };

  const handleTouchInteraction = (zone: string) => {
    setLastInteraction(zone);
    
    // Actualizar afecto según la zona
    if (['head', 'body'].includes(zone)) {
      setAffection(prev => Math.min(100, prev + 5));
      setEnergy(prev => Math.max(0, prev - 1));
    } else if (zone === 'antenna') {
      setAffection(prev => Math.min(100, prev + 3));
      setEnergy(prev => Math.min(100, prev + 2));
    } else if (zone === 'wheels') {
      setEnergy(prev => Math.min(100, prev + 5));
    }
    
    // Obtener una respuesta aleatoria según la zona tocada
    const responses = touchResponses[zone as keyof typeof touchResponses] || [];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Emitir evento personalizado con la interacción táctil
    const event = new CustomEvent('emo-touch', {
      detail: {
        zone,
        response: randomResponse,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);

    // Mostrar mensaje en el chat
    if (randomResponse) {
      const messagesContainer = document.getElementById('messages');
      if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message emo';
        messageDiv.innerHTML = `
          <div class="message-bubble">
            ${randomResponse}
            <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px;">
              (reacción táctil - ${zone === 'head' ? 'cabeza' : zone === 'body' ? 'cuerpo' : zone === 'antenna' ? 'antena' : 'ruedas'})
            </div>
          </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      // Reproducir mensaje con voz si está disponible
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(randomResponse);
        utterance.lang = 'es-ES';
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#764ba2" />
        
        <EmoRobot 
          mood={mood} 
          energy={energy}
          onTouchInteraction={handleTouchInteraction}
        />
        
        {/* Panel de estadísticas */}
        <Html position={[-3, 2, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(102, 126, 234, 0.85)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '11px',
            minWidth: '130px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontFamily: 'monospace'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px' }}>💙 EMO Stats</div>
            <div>💖 Afecto: {affection}%</div>
            <div>⚡ Energía: {energy}%</div>
            <div>😊 Humor: {mood}</div>
            {lastInteraction && <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.8 }}>
              Última: {lastInteraction === 'head' ? 'cabeza' : lastInteraction === 'body' ? 'cuerpo' : lastInteraction === 'antenna' ? 'antena' : 'ruedas'}
            </div>}
          </div>
        </Html>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
