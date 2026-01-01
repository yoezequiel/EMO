import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

// Avatar estilo "Tech" - diseño futurista y geométrico
function TechRobot({ 
  mood = 'neutral', 
  energy = 70,
  onTouchInteraction
}: { 
  mood?: string; 
  energy?: number;
  onTouchInteraction?: (zone: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const eyeGroupRef = useRef<THREE.Group>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isPulsing, setIsPulsing] = React.useState(false);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      
      if (isPulsing) {
        const scale = 1 + Math.sin(time * 15) * 0.15;
        groupRef.current.scale.set(scale, scale, scale);
      } else {
        groupRef.current.scale.set(1, 1, 1);
        groupRef.current.position.y = Math.sin(time * 0.6) * 0.08;
      }
    }

    // Animación de escaneo de ojos
    if (eyeGroupRef.current && isScanning) {
      const time = clock.getElapsedTime();
      eyeGroupRef.current.position.x = Math.sin(time * 5) * 0.2;
    } else if (eyeGroupRef.current) {
      eyeGroupRef.current.position.x = 0;
    }
  });

  const getMoodConfig = () => {
    switch (mood) {
      case 'happy':
        return { eyeColor: '#00FF00', glowIntensity: 1.5, bodyColor: '#00CED1' };
      case 'sad':
        return { eyeColor: '#0080FF', glowIntensity: 0.5, bodyColor: '#4682B4' };
      case 'curious':
        return { eyeColor: '#FF00FF', glowIntensity: 1.2, bodyColor: '#9370DB' };
      case 'excited':
        return { eyeColor: '#FFFF00', glowIntensity: 2.0, bodyColor: '#FFD700' };
      case 'tired':
        return { eyeColor: '#808080', glowIntensity: 0.3, bodyColor: '#696969' };
      default:
        return { eyeColor: '#00FFFF', glowIntensity: 1.0, bodyColor: '#20B2AA' };
    }
  };

  const config = getMoodConfig();

  const handleTouch = (zone: string) => {
    if (onTouchInteraction) {
      onTouchInteraction(zone);
    }

    switch (zone) {
      case 'head':
      case 'scanner':
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 1000);
        break;
      case 'core':
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 800);
        break;
      case 'thrusters':
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 600);
        break;
    }
  };

  return (
    <group ref={groupRef}>
      {/* Cuerpo principal - caja hexagonal */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('core');
        }}
        onPointerOver={(e: any) => {
          (e.object as any).material.emissive = new THREE.Color(0x444444);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e: any) => {
          (e.object as any).material.emissive = new THREE.Color(0x000000);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[0.8, 0.8, 1.2, 6]} />
        <meshStandardMaterial 
          color={config.bodyColor} 
          metalness={0.9} 
          roughness={0.1}
          emissive={config.bodyColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Líneas luminosas en el cuerpo */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <Box
            key={i}
            args={[0.05, 1.0, 0.05]}
            position={[Math.cos(rad) * 0.85, 0, Math.sin(rad) * 0.85]}
            rotation={[0, -rad, 0]}
          >
            <meshStandardMaterial 
              color={config.eyeColor}
              emissive={config.eyeColor}
              emissiveIntensity={config.glowIntensity}
            />
          </Box>
        );
      })}

      {/* Cabeza/Visor - interactiva */}
      <group 
        position={[0, 1.0, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('head');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <Box args={[1.2, 0.5, 0.8]}>
          <meshStandardMaterial 
            color={config.bodyColor}
            metalness={0.95}
            roughness={0.05}
          />
        </Box>
        
        {/* Visor/Pantalla */}
        <Box args={[1.0, 0.35, 0.02]} position={[0, 0, 0.42]}>
          <meshStandardMaterial 
            color="#000000"
            metalness={0.8}
            emissive={config.eyeColor}
            emissiveIntensity={config.glowIntensity * 0.3}
          />
        </Box>
      </group>

      {/* Ojos escaneadores */}
      <group ref={eyeGroupRef} position={[0, 1.0, 0.5]}>
        <Box args={[0.3, 0.08, 0.02]} position={[-0.3, 0, 0]}>
          <meshStandardMaterial 
            color={config.eyeColor}
            emissive={config.eyeColor}
            emissiveIntensity={config.glowIntensity}
          />
        </Box>
        <Box args={[0.3, 0.08, 0.02]} position={[0.3, 0, 0]}>
          <meshStandardMaterial 
            color={config.eyeColor}
            emissive={config.eyeColor}
            emissiveIntensity={config.glowIntensity}
          />
        </Box>
      </group>

      {/* Antena/Escáner superior - interactiva */}
      <Cylinder 
        args={[0.05, 0.05, 0.4]} 
        position={[0, 1.5, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('scanner');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial color="#ffffff" metalness={0.9} />
      </Cylinder>
      <Sphere 
        args={[0.12, 16, 16]} 
        position={[0, 1.75, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('scanner');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial 
          color={config.eyeColor}
          emissive={config.eyeColor} 
          emissiveIntensity={config.glowIntensity * 1.5}
        />
      </Sphere>

      {/* Brazos articulados */}
      <group position={[-1.0, 0.2, 0]}>
        <Cylinder args={[0.1, 0.1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color={config.bodyColor} metalness={0.8} />
        </Cylinder>
        <Sphere args={[0.15, 16, 16]} position={[-0.4, 0, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.9} />
        </Sphere>
      </group>
      <group position={[1.0, 0.2, 0]}>
        <Cylinder args={[0.1, 0.1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color={config.bodyColor} metalness={0.8} />
        </Cylinder>
        <Sphere args={[0.15, 16, 16]} position={[0.4, 0, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.9} />
        </Sphere>
      </group>

      {/* Propulsores/Base - interactivos */}
      <Cylinder 
        args={[0.25, 0.3, 0.4]} 
        position={[-0.4, -0.9, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('thrusters');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial 
          color="#333333" 
          metalness={0.9}
          emissive={config.eyeColor}
          emissiveIntensity={config.glowIntensity * 0.3}
        />
      </Cylinder>
      <Cylinder 
        args={[0.25, 0.3, 0.4]} 
        position={[0.4, -0.9, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          handleTouch('thrusters');
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <meshStandardMaterial 
          color="#333333" 
          metalness={0.9}
          emissive={config.eyeColor}
          emissiveIntensity={config.glowIntensity * 0.3}
        />
      </Cylinder>

      {/* Efectos de luz ambiental */}
      <pointLight 
        position={[0, 1.75, 0]} 
        color={config.eyeColor}
        intensity={config.glowIntensity * 2}
        distance={3}
      />
    </group>
  );
}

export default function TechAvatar() {
  const [mood, setMood] = React.useState('neutral');
  const [energy, setEnergy] = React.useState(70);
  const [affection, setAffection] = React.useState(50);
  const [lastInteraction, setLastInteraction] = React.useState<string>('');

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
    setLastInteraction(zone);
    
    // Actualizar afecto y energía según la zona
    if (['head', 'scanner'].includes(zone)) {
      setAffection(prev => Math.min(100, prev + 4));
      setEnergy(prev => Math.min(100, prev + 2));
    } else if (zone === 'core') {
      setEnergy(prev => Math.min(100, prev + 10));
      setAffection(prev => Math.min(100, prev + 5));
    } else if (zone === 'thrusters') {
      setEnergy(prev => Math.min(100, prev + 8));
    }
    
    const responses: { [key: string]: string[] } = {
      head: ["Sistemas operativos al 100%", "Escaneando entorno... Todo en orden", "Procesando datos"],
      scanner: ["¡Antena activada! Señal detectada", "Escáner en línea", "Recibiendo transmisión"],
      core: ["¡Núcleo energético activado!", "Energía al máximo", "Sistemas recargándose"],
      thrusters: ["¡Propulsores listos para despegar!", "Modo vuelo activado", "¡Iniciando secuencia de vuelo!"]
    };

    const zoneResponses = responses[zone] || ["Sistema operativo"];
    const response = zoneResponses[Math.floor(Math.random() * zoneResponses.length)];

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, 0, -10]} intensity={0.5} color="#00FFFF" />
      <TechRobot mood={mood} energy={energy} onTouchInteraction={handleInteraction} />
      
      {/* Panel de estadísticas */}
      <Html position={[-3, 2.5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0, 206, 209, 0.85)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '11px',
          minWidth: '130px',
          boxShadow: '0 4px 12px rgba(0,255,255,0.3)',
          fontFamily: 'monospace',
          border: '1px solid rgba(0,255,255,0.5)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px' }}>⚡ TECH Stats</div>
          <div>💙 Sistema: {affection}%</div>
          <div>🔋 Energía: {energy}%</div>
          <div>🤖 Modo: {mood}</div>
          {lastInteraction && <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.8 }}>
            Última: {lastInteraction === 'head' ? 'cabeza' : lastInteraction === 'scanner' ? 'escáner' : lastInteraction === 'core' ? 'núcleo' : 'propulsores'}
          </div>}
        </div>
      </Html>
      
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
