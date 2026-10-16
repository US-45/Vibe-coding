import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Eye, 
  Sun, 
  Moon, 
  RotateCcw, 
  Maximize2, 
  Camera, 
  Siren, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Direction, SignalPhase, SignalState, Vehicle, VehicleType } from '../types/simulation';
import { SimulationEngine } from '../simulation/engine';
import { useTheme } from '../context/ThemeContext';

interface Simulation3DViewProps {
  engine: SimulationEngine | null;
  currentPhase: SignalPhase;
  signals: Record<Direction, SignalState>;
  elapsedTime: number;
  activeVehiclesCount: number;
  freeLeftTurnEnabled: boolean;
  onSwitchTo2D?: () => void;
}

type CameraPreset = 'isometric' | 'driver' | 'topDown' | 'gantry';
type LightingMode = 'day' | 'night' | 'dusk';

export const Simulation3DView: React.FC<Simulation3DViewProps> = ({
  engine,
  currentPhase,
  signals,
  elapsedTime,
  activeVehiclesCount,
  freeLeftTurnEnabled,
  onSwitchTo2D,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { currentTheme } = useTheme();

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [lightingMode, setLightingMode] = useState<LightingMode>('dusk');

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vehicleMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const signalLampsRef = useRef<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh }>>({} as any);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    dirLight: THREE.DirectionalLight;
    streetLights: THREE.PointLight[];
    emergencyLightRed?: THREE.PointLight;
    emergencyLightBlue?: THREE.PointLight;
  } | null>(null);

  const isEmergency = currentPhase === 'EMERGENCY_ACTIVE' || currentPhase === 'EMERGENCY_CLEARANCE';

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert 2D canvas coordinates (0-700) to 3D world units centered at (0, 0, 0)
  const toWorldX = (x: number) => (x - 350) * 0.1;
  const toWorldZ = (y: number) => (y - 350) * 0.1;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d10);
    scene.fog = new THREE.FogExp2(0x0b0d10, 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    camera.position.set(28, 32, 38);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
    controls.minDistance = 10;
    controls.maxDistance = 90;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xd4d8e0, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight.position.set(35, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Street Corner Accent Lights
    const streetLights: THREE.PointLight[] = [];
    const cornerPositions = [
      [-16, 6, -16],
      [16, 6, -16],
      [-16, 6, 16],
      [16, 6, 16],
    ];
    cornerPositions.forEach(([x, y, z]) => {
      const pLight = new THREE.PointLight(0xffdfa8, 1.2, 35, 1.2);
      pLight.position.set(x, y, z);
      scene.add(pLight);
      streetLights.push(pLight);

      // 3D Lamp Post Model
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.2, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x22262d, roughness: 0.7, metalness: 0.6 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 3.1, z);
      pole.castShadow = true;
      scene.add(pole);

      const lampHeadGeo = new THREE.BoxGeometry(0.6, 0.25, 0.6);
      const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xffe8ba, emissive: 0xffdfa8, emissiveIntensity: 0.8 });
      const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      lampHead.position.set(x, 6.1, z);
      scene.add(lampHead);
    });

    lightsRef.current = {
      ambient: ambientLight,
      dirLight,
      streetLights,
    };

    // 6. Build 3D Road Network, Medians, and Markings
    build3DJunctionEnvironment(scene);

    // 7. Build Signal Gantries
    buildSignalGantries(scene, signalLampsRef);

    // Handle Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      controls.update();

      // Synchronize vehicle meshes with engine state
      if (engine) {
        syncVehiclesWithEngine(engine.getVehicles(), scene, vehicleMeshesRef);
      }

      // Update signal lights
      updateSignalLamps(signals, signalLampsRef);

      // Strobe emergency lights if active
      if (isEmergency && lightsRef.current?.emergencyLightRed && lightsRef.current?.emergencyLightBlue) {
        const time = performance.now() * 0.008;
        const blink = Math.sin(time) > 0;
        lightsRef.current.emergencyLightRed.intensity = blink ? 3.5 : 0.2;
        lightsRef.current.emergencyLightBlue.intensity = blink ? 0.2 : 3.5;
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update lighting mode (Day / Dusk / Night)
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { ambient, dirLight, streetLights } = lightsRef.current;
    const scene = sceneRef.current;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color(0x1a212d);
      scene.fog = new THREE.FogExp2(0x1a212d, 0.008);
      ambient.intensity = 1.0;
      ambient.color.setHex(0xffffff);
      dirLight.intensity = 2.2;
      dirLight.color.setHex(0xffffff);
      streetLights.forEach((l) => (l.intensity = 0.1));
    } else if (lightingMode === 'dusk') {
      scene.background = new THREE.Color(0x0b0d10);
      scene.fog = new THREE.FogExp2(0x0b0d10, 0.012);
      ambient.intensity = 0.55;
      ambient.color.setHex(0x94a3b8);
      dirLight.intensity = 1.3;
      dirLight.color.setHex(0xffb86c);
      streetLights.forEach((l) => (l.intensity = 1.4));
    } else {
      // Night
      scene.background = new THREE.Color(0x050608);
      scene.fog = new THREE.FogExp2(0x050608, 0.016);
      ambient.intensity = 0.25;
      ambient.color.setHex(0x475569);
      dirLight.intensity = 0.4;
      dirLight.color.setHex(0x64748b);
      streetLights.forEach((l) => (l.intensity = 2.5));
    }
  }, [lightingMode]);

  // Handle Camera Presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (preset === 'isometric') {
      camera.position.set(28, 30, 36);
      controls.target.set(0, 0, 0);
    } else if (preset === 'driver') {
      // Ground perspective looking North into junction
      camera.position.set(1.8, 2.2, 28);
      controls.target.set(0, 1.5, -5);
    } else if (preset === 'topDown') {
      camera.position.set(0, 52, 0.1);
      controls.target.set(0, 0, 0);
    } else if (preset === 'gantry') {
      // Close-up on the South gantry & waiting queue
      camera.position.set(7, 7, 16);
      controls.target.set(2, 2, 6);
    }
    controls.update();
  };

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col items-center relative overflow-hidden">
      {/* Top Header Bar with 2D/3D Mode Switcher and Presets */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          {/* Switch back to 2D Plan View */}
          {onSwitchTo2D && (
            <div className="flex items-center space-x-1 bg-[#0B0D10] p-0.5 rounded-lg border border-[#2A323B]">
              <button
                onClick={onSwitchTo2D}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#929DA9] hover:text-[#F3F5F7] transition-colors flex items-center space-x-1"
                title="Switch to Top-Down 2D Canvas"
              >
                <Layers className="w-3 h-3" />
                <span>2D Plan</span>
              </button>
              <button
                className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm transition-colors flex items-center space-x-1"
                style={{
                  backgroundColor: currentTheme.color,
                  color: currentTheme.textColor,
                }}
              >
                <Sparkles className="w-3 h-3 fill-current" />
                <span>3D Model</span>
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center space-x-1.5 font-mono text-[10px] text-[#929DA9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#36D98A] shadow-[0_0_6px_#36D98A]" />
            <span>WebGL 3D Engine • Three.js</span>
          </div>
        </div>

        {/* Camera Views & Lighting Controls */}
        <div className="flex items-center space-x-1.5 text-xs">
          {/* Camera Preset Selector */}
          <div className="flex items-center space-x-1 bg-[#0B0D10] p-0.5 rounded-lg border border-[#2A323B] font-mono text-[10px]">
            <button
              onClick={() => applyCameraPreset('isometric')}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === 'isometric'
                  ? 'bg-[#191F26] text-[#F3F5F7] font-bold border border-[#2A323B]'
                  : 'text-[#929DA9] hover:text-[#F3F5F7]'
              }`}
            >
              Orbit 45°
            </button>
            <button
              onClick={() => applyCameraPreset('driver')}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === 'driver'
                  ? 'bg-[#191F26] text-[#F3F5F7] font-bold border border-[#2A323B]'
                  : 'text-[#929DA9] hover:text-[#F3F5F7]'
              }`}
            >
              Street Eye
            </button>
            <button
              onClick={() => applyCameraPreset('topDown')}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === 'topDown'
                  ? 'bg-[#191F26] text-[#F3F5F7] font-bold border border-[#2A323B]'
                  : 'text-[#929DA9] hover:text-[#F3F5F7]'
              }`}
            >
              Top 90°
            </button>
            <button
              onClick={() => applyCameraPreset('gantry')}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === 'gantry'
                  ? 'bg-[#191F26] text-[#F3F5F7] font-bold border border-[#2A323B]'
                  : 'text-[#929DA9] hover:text-[#F3F5F7]'
              }`}
            >
              Gantry
            </button>
          </div>

          {/* Time of Day Lighting Toggle */}
          <div className="flex items-center space-x-0.5 bg-[#0B0D10] p-0.5 rounded-lg border border-[#2A323B]">
            <button
              onClick={() => setLightingMode('day')}
              className={`p-1 rounded ${lightingMode === 'day' ? 'bg-[#191F26] text-[#FFBD59]' : 'text-[#929DA9]'}`}
              title="Daylight mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('dusk')}
              className={`p-1 rounded ${lightingMode === 'dusk' ? 'bg-[#191F26] text-[#C6F36B]' : 'text-[#929DA9]'}`}
              title="Dusk / Sunset mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('night')}
              className={`p-1 rounded ${lightingMode === 'night' ? 'bg-[#191F26] text-[#75B8FF]' : 'text-[#929DA9]'}`}
              title="Night mode (headlights & streetlights)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Corridor Alert Banner */}
      {isEmergency && (
        <div className="w-full mb-3 bg-[#FF6268]/20 border border-[#FF6268] text-[#FF6268] px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 font-bold text-xs uppercase tracking-wide animate-pulse">
          <Siren className="w-4 h-4" />
          <span>3D CORRIDOR CLEARANCE ACTIVE — 108 AMBULANCE STROBES ENGAGED</span>
        </div>
      )}

      {/* 3D WebGL Canvas Container */}
      <div className="relative rounded-lg overflow-hidden border border-[#2A323B] bg-[#0B0D10] shadow-inner flex items-center justify-center w-full">
        <div
          ref={containerRef}
          className="w-full max-w-[620px] aspect-square object-contain block select-none cursor-grab active:cursor-grabbing"
          title="Drag to orbit 3D camera, scroll to zoom"
        />

        {/* Orbit Helper Watermark */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 font-mono text-[9px] text-[#929DA9] bg-[#12161B]/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#2A323B] pointer-events-none">
          <Camera className="w-3 h-3 text-[#75B8FF]" />
          <span>DRAG TO ORBIT • SCROLL TO ZOOM</span>
        </div>

        {/* Vehicles Active Badge */}
        <div className="absolute bottom-3 right-3 font-mono text-[10px] bg-[#12161B]/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#2A323B] text-[#929DA9] pointer-events-none">
          ACTIVE 3D MESHES: <strong style={{ color: currentTheme.color }}>{activeVehiclesCount}</strong>
        </div>
      </div>

      {/* Bottom 3D Status Legend */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-[#1E252D] text-xs text-[#929DA9]">
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#36D98A]" />
            <span>N/S Signal</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6268]" />
            <span>E/W Signal</span>
          </span>
          <span className="text-[#929DA9]">
            {freeLeftTurnEnabled ? '✓ 3D Free Left Slip Lane Active' : 'No Free Left'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-sm bg-[#059669]" />
            <span>Auto</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2 rounded-sm bg-[#DC2626]" />
            <span>Bus</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-sm bg-[#2563EB]" />
            <span>Car</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-sm bg-[#F1F5F9] border border-[#FF6268]" />
            <span>108 Amb</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3D ENVIRONMENT BUILDERS & MESH PROCEDURES
// ==========================================

function build3DJunctionEnvironment(scene: THREE.Scene) {
  // 1. Ground Terrain Plane (City footprint)
  const terrainGeo = new THREE.PlaneGeometry(160, 160);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e12,
    roughness: 0.9,
    metalness: 0.1,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.05;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // 2. Asphalt Road Cross (14m road width = 14 world units)
  const ROAD_W = 14;
  const ROAD_L = 70;

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x161a20,
    roughness: 0.85,
    metalness: 0.2,
  });

  // North-South Road
  const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_L), roadMat);
  nsRoad.rotation.x = -Math.PI / 2;
  nsRoad.position.y = 0.01;
  nsRoad.receiveShadow = true;
  scene.add(nsRoad);

  // East-West Road
  const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_L, ROAD_W), roadMat);
  ewRoad.rotation.x = -Math.PI / 2;
  ewRoad.position.y = 0.01;
  ewRoad.receiveShadow = true;
  scene.add(ewRoad);

  // 3. Central Yellow-Box Junction (Criss-Cross diagonal hatch markings)
  const boxBorderGeo = new THREE.BufferGeometry();
  const boxSize = ROAD_W / 2; // 7 units
  const boxMat = new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 });
  const points: THREE.Vector3[] = [
    new THREE.Vector3(-boxSize, 0.03, -boxSize),
    new THREE.Vector3(boxSize, 0.03, -boxSize),
    new THREE.Vector3(boxSize, 0.03, boxSize),
    new THREE.Vector3(-boxSize, 0.03, boxSize),
    new THREE.Vector3(-boxSize, 0.03, -boxSize),
    // Diagonal cross lines
    new THREE.Vector3(boxSize, 0.03, boxSize),
    new THREE.Vector3(boxSize, 0.03, -boxSize),
    new THREE.Vector3(-boxSize, 0.03, boxSize),
  ];
  boxBorderGeo.setFromPoints(points);
  const yellowBox = new THREE.Line(boxBorderGeo, boxMat);
  scene.add(yellowBox);

  // 4. Zebra Pedestrian Crossings (4 approaches)
  buildZebraCrossing(scene, 0, 7.5, 'horizontal');
  buildZebraCrossing(scene, 0, -7.5, 'horizontal');
  buildZebraCrossing(scene, 7.5, 0, 'vertical');
  buildZebraCrossing(scene, -7.5, 0, 'vertical');

  // 5. White Stop Lines
  const stopLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hStopGeo = new THREE.PlaneGeometry(ROAD_W / 2, 0.4);
  const vStopGeo = new THREE.PlaneGeometry(0.4, ROAD_W / 2);

  // South Stop Line (Drivers heading North on East half x > 0)
  const southStop = new THREE.Mesh(hStopGeo, stopLineMat);
  southStop.rotation.x = -Math.PI / 2;
  southStop.position.set(ROAD_W / 4, 0.03, 7.0);
  scene.add(southStop);

  // North Stop Line (Drivers heading South on West half x < 0)
  const northStop = new THREE.Mesh(hStopGeo, stopLineMat);
  northStop.rotation.x = -Math.PI / 2;
  northStop.position.set(-ROAD_W / 4, 0.03, -7.0);
  scene.add(northStop);

  // East Stop Line (Drivers heading West on South half z > 0)
  const eastStop = new THREE.Mesh(vStopGeo, stopLineMat);
  eastStop.rotation.x = -Math.PI / 2;
  eastStop.position.set(7.0, 0.03, ROAD_W / 4);
  scene.add(eastStop);

  // West Stop Line (Drivers heading East on North half z < 0)
  const westStop = new THREE.Mesh(vStopGeo, stopLineMat);
  westStop.rotation.x = -Math.PI / 2;
  westStop.position.set(-7.0, 0.03, -ROAD_W / 4);
  scene.add(westStop);

  // 6. IRC Raised Concrete Medians (Alternating Yellow & Black stripes)
  buildIRCMedian(scene, 0, 22, 28, 'vertical');
  buildIRCMedian(scene, 0, -22, 28, 'vertical');
  buildIRCMedian(scene, 22, 0, 28, 'horizontal');
  buildIRCMedian(scene, -22, 0, 28, 'horizontal');

  // 7. Corner Sidewalk Kerbs & Free Left Slip Islands
  buildCornerSidewalks(scene, ROAD_W / 2);
}

function buildZebraCrossing(scene: THREE.Scene, cx: number, cz: number, orient: 'horizontal' | 'vertical') {
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const numStripes = 8;
  const stripeW = 0.5;
  const stripeL = 1.8;

  for (let i = 0; i < numStripes; i++) {
    const offset = (i - numStripes / 2 + 0.5) * 0.85;
    const geo = orient === 'horizontal' ? new THREE.PlaneGeometry(stripeW, stripeL) : new THREE.PlaneGeometry(stripeL, stripeW);
    const stripe = new THREE.Mesh(geo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(
      orient === 'horizontal' ? cx + offset : cx,
      0.025,
      orient === 'horizontal' ? cz : cz + offset
    );
    scene.add(stripe);
  }
}

function buildIRCMedian(scene: THREE.Scene, cx: number, cz: number, length: number, orient: 'vertical' | 'horizontal') {
  const MEDIAN_W = 0.8;
  const MEDIAN_H = 0.35;
  const segments = Math.floor(length / 1.5);
  const segLength = length / segments;

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.7 });

  const group = new THREE.Group();

  for (let i = 0; i < segments; i++) {
    const isYellow = i % 2 === 0;
    const geo = orient === 'vertical'
      ? new THREE.BoxGeometry(MEDIAN_W, MEDIAN_H, segLength)
      : new THREE.BoxGeometry(segLength, MEDIAN_H, MEDIAN_W);

    const mesh = new THREE.Mesh(geo, isYellow ? yellowMat : blackMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const segOffset = (i - segments / 2 + 0.5) * segLength;
    if (orient === 'vertical') {
      mesh.position.set(0, MEDIAN_H / 2, segOffset);
    } else {
      mesh.position.set(segOffset, MEDIAN_H / 2, 0);
    }
    group.add(mesh);
  }

  group.position.set(cx, 0, cz);
  scene.add(group);
}

function buildCornerSidewalks(scene: THREE.Scene, halfRoad: number) {
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x272e38, roughness: 0.8 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.9 });
  const SW_SIZE = 26;

  const corners = [
    { x: halfRoad + SW_SIZE / 2, z: halfRoad + SW_SIZE / 2 },
    { x: -halfRoad - SW_SIZE / 2, z: halfRoad + SW_SIZE / 2 },
    { x: halfRoad + SW_SIZE / 2, z: -halfRoad - SW_SIZE / 2 },
    { x: -halfRoad - SW_SIZE / 2, z: -halfRoad - SW_SIZE / 2 },
  ];

  corners.forEach(({ x, z }) => {
    const swMesh = new THREE.Mesh(new THREE.BoxGeometry(SW_SIZE, 0.3, SW_SIZE), sidewalkMat);
    swMesh.position.set(x, 0.15, z);
    swMesh.receiveShadow = true;
    scene.add(swMesh);
  });
}

// Build 4 overhead / roadside cantilever traffic signal gantries
function buildSignalGantries(
  scene: THREE.Scene,
  signalLampsRef: React.MutableRefObject<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh }>>
) {
  const directions: Direction[] = ['north', 'south', 'east', 'west'];

  const gantryConfigs: Record<Direction, { polePos: [number, number, number]; headPos: [number, number, number]; rotY: number }> = {
    south: { polePos: [7.5, 0, 8.5], headPos: [3.5, 5.2, 8.5], rotY: 0 },
    north: { polePos: [-7.5, 0, -8.5], headPos: [-3.5, 5.2, -8.5], rotY: Math.PI },
    east: { polePos: [8.5, 0, 7.5], headPos: [8.5, 5.2, 3.5], rotY: -Math.PI / 2 },
    west: { polePos: [-8.5, 0, -7.5], headPos: [-8.5, 5.2, -3.5], rotY: Math.PI / 2 },
  };

  directions.forEach((dir) => {
    const cfg = gantryConfigs[dir];
    const group = new THREE.Group();

    // 1. Vertical Steel Cantilever Pole
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.8, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(cfg.polePos[0], 2.9, cfg.polePos[2]);
    pole.castShadow = true;
    group.add(pole);

    // 2. Horizontal Cantilever Arm extending over the road
    const armGeo = new THREE.CylinderGeometry(0.12, 0.14, 4.5, 8);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = cfg.rotY;
    arm.position.set((cfg.polePos[0] + cfg.headPos[0]) / 2, 5.5, (cfg.polePos[2] + cfg.headPos[2]) / 2);
    arm.castShadow = true;
    group.add(arm);

    // 3. 3-Lamp Traffic Signal Housing (Red, Amber, Green)
    const boxGeo = new THREE.BoxGeometry(0.8, 2.2, 0.5);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const headBox = new THREE.Mesh(boxGeo, boxMat);
    headBox.position.set(cfg.headPos[0], cfg.headPos[1], cfg.headPos[2]);
    headBox.rotation.y = cfg.rotY;
    headBox.castShadow = true;
    group.add(headBox);

    // 3 Lamp Spheres
    const lampGeo = new THREE.SphereGeometry(0.24, 16, 16);

    const redMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0x000000, roughness: 0.3 })
    );
    redMesh.position.set(0, 0.65, 0.26);
    headBox.add(redMesh);

    const amberMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({ color: 0x451a03, emissive: 0x000000, roughness: 0.3 })
    );
    amberMesh.position.set(0, 0, 0.26);
    headBox.add(amberMesh);

    const greenMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({ color: 0x022c22, emissive: 0x000000, roughness: 0.3 })
    );
    greenMesh.position.set(0, -0.65, 0.26);
    headBox.add(greenMesh);

    signalLampsRef.current[dir] = {
      red: redMesh,
      amber: amberMesh,
      green: greenMesh,
    };

    scene.add(group);
  });
}

function updateSignalLamps(
  signals: Record<Direction, SignalState>,
  signalLampsRef: React.MutableRefObject<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh }>>
) {
  if (!signalLampsRef.current) return;

  const dirs: Direction[] = ['north', 'south', 'east', 'west'];
  dirs.forEach((dir) => {
    const lamps = signalLampsRef.current[dir];
    const sig = signals[dir];
    if (!lamps || !sig) return;

    const isRed = sig.color === 'red';
    const isAmber = sig.color === 'amber';
    const isGreen = sig.color === 'green';

    // Red Lamp
    const redMat = lamps.red.material as THREE.MeshStandardMaterial;
    if (isRed) {
      redMat.color.setHex(0xff3b30);
      redMat.emissive.setHex(0xff2222);
      redMat.emissiveIntensity = 2.4;
    } else {
      redMat.color.setHex(0x3a0808);
      redMat.emissive.setHex(0x000000);
      redMat.emissiveIntensity = 0;
    }

    // Amber Lamp
    const amberMat = lamps.amber.material as THREE.MeshStandardMaterial;
    if (isAmber) {
      amberMat.color.setHex(0xfbbf24);
      amberMat.emissive.setHex(0xf59e0b);
      amberMat.emissiveIntensity = 2.4;
    } else {
      amberMat.color.setHex(0x381804);
      amberMat.emissive.setHex(0x000000);
      amberMat.emissiveIntensity = 0;
    }

    // Green Lamp
    const greenMat = lamps.green.material as THREE.MeshStandardMaterial;
    if (isGreen) {
      greenMat.color.setHex(0x34d399);
      greenMat.emissive.setHex(0x10b981);
      greenMat.emissiveIntensity = 2.4;
    } else {
      greenMat.color.setHex(0x042817);
      greenMat.emissive.setHex(0x000000);
      greenMat.emissiveIntensity = 0;
    }
  });
}

// Synchronize all vehicle 3D models with the simulation engine
function syncVehiclesWithEngine(
  vehicles: Vehicle[],
  scene: THREE.Scene,
  vehicleMeshesRef: React.MutableRefObject<Map<string, THREE.Group>>
) {
  const currentIds = new Set(vehicles.map((v) => v.id));

  // 1. Remove exited vehicles
  vehicleMeshesRef.current.forEach((group, id) => {
    if (!currentIds.has(id)) {
      scene.remove(group);
      vehicleMeshesRef.current.delete(id);
    }
  });

  // 2. Update or create meshes for in-flight vehicles
  vehicles.forEach((v) => {
    let meshGroup = vehicleMeshesRef.current.get(v.id);

    if (!meshGroup) {
      meshGroup = create3DVehicleMesh(v);
      scene.add(meshGroup);
      vehicleMeshesRef.current.set(v.id, meshGroup);
    }

    // Update 3D position (2D canvas 0-700 mapped to Three.js -35 to +35)
    meshGroup.position.x = (v.x - 350) * 0.1;
    meshGroup.position.z = (v.y - 350) * 0.1;
    meshGroup.position.y = 0;

    // Heading rotation around Y axis
    // In 2D: angle 0 = East (+X), PI/2 = South (+Y)
    meshGroup.rotation.y = Math.atan2(Math.cos(v.angle), Math.sin(v.angle));
  });
}

// Create detailed procedural 3D vehicle models
function create3DVehicleMesh(v: Vehicle): THREE.Group {
  const group = new THREE.Group();

  if (v.type === 'auto') {
    // ----------------------------------------
    // INDIAN AUTO-RICKSHAW (3-WHEELER)
    // ----------------------------------------
    // Green CNG Lower Body
    const lowerBodyGeo = new THREE.BoxGeometry(1.4, 0.75, 2.1);
    const lowerMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
    const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerMat);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Yellow Canvas Canopy / Hood
    const roofGeo = new THREE.BoxGeometry(1.35, 0.65, 1.9);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.15;
    roof.position.z = -0.1;
    roof.castShadow = true;
    group.add(roof);

    // Front Windshield
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55), glassMat);
    glass.position.set(0, 1.05, 0.86);
    glass.rotation.x = -0.18;
    group.add(glass);

    // 3 Black Wheels (1 front centered, 2 rear)
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    // Front single wheel
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.24, 0.95);
    group.add(frontWheel);

    // Rear left & right wheels
    const rearL = new THREE.Mesh(wheelGeo, wheelMat);
    rearL.rotation.z = Math.PI / 2;
    rearL.position.set(-0.72, 0.24, -0.65);
    group.add(rearL);

    const rearR = new THREE.Mesh(wheelGeo, wheelMat);
    rearR.rotation.z = Math.PI / 2;
    rearR.position.set(0.72, 0.24, -0.65);
    group.add(rearR);

    // Front single headlight
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe082, emissiveIntensity: 1.5 })
    );
    headlight.position.set(0, 0.65, 1.06);
    group.add(headlight);
  } else if (v.type === 'bus') {
    // ----------------------------------------
    // INDIAN CITY TRANSIT BUS
    // ----------------------------------------
    const BUS_W = 1.9;
    const BUS_H = 1.8;
    const BUS_L = 5.6;

    // Maroon / Crimson Bus Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(BUS_W, BUS_H, BUS_L), bodyMat);
    body.position.y = BUS_H / 2 + 0.35;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // White Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(BUS_W * 0.96, 0.18, BUS_L * 0.98),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
    );
    roof.position.y = BUS_H + 0.42;
    roof.castShadow = true;
    group.add(roof);

    // Tinted Window Band
    const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const sideWinL = new THREE.Mesh(new THREE.PlaneGeometry(BUS_L * 0.9, 0.55), winMat);
    sideWinL.rotation.y = -Math.PI / 2;
    sideWinL.position.set(-BUS_W / 2 - 0.01, 1.4, 0);
    group.add(sideWinL);

    const sideWinR = new THREE.Mesh(new THREE.PlaneGeometry(BUS_L * 0.9, 0.55), winMat);
    sideWinR.rotation.y = Math.PI / 2;
    sideWinR.position.set(BUS_W / 2 + 0.01, 1.4, 0);
    group.add(sideWinR);

    // Front Windshield & Destination LED
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(BUS_W * 0.85, 0.65), winMat);
    frontWindshield.position.set(0, 1.45, BUS_L / 2 + 0.01);
    group.add(frontWindshield);

    // 6 Large Wheels (2 front, 4 rear duals)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    [-1, 1].forEach((side) => {
      // Front wheel
      const fw = new THREE.Mesh(wheelGeo, wheelMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (BUS_W / 2), 0.38, 1.8);
      group.add(fw);

      // Rear wheels
      const rw = new THREE.Mesh(wheelGeo, wheelMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (BUS_W / 2), 0.38, -1.8);
      group.add(rw);
    });
  } else if (v.type === 'bike') {
    // ----------------------------------------
    // TWO-WHEELER (MOTORBIKE + RIDER FIGURINE)
    // ----------------------------------------
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 1.4), bikeMat);
    frame.position.y = 0.5;
    group.add(frame);

    // 2 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const fw = new THREE.Mesh(wheelGeo, wheelMat);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(0, 0.3, 0.6);
    group.add(fw);

    const rw = new THREE.Mesh(wheelGeo, wheelMat);
    rw.rotation.z = Math.PI / 2;
    rw.position.set(0, 0.3, -0.6);
    group.add(rw);

    // Rider Torso & Helmet Figurine
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.55, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    torso.position.set(0, 1.0, -0.1);
    torso.rotation.x = 0.2;
    group.add(torso);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
    );
    helmet.position.set(0, 1.42, -0.02);
    group.add(helmet);
  } else if (v.type === 'emergency') {
    // ----------------------------------------
    // 108 AMBULANCE (WITH STROBING LIGHTBAR)
    // ----------------------------------------
    const AMB_W = 1.7;
    const AMB_H = 1.5;
    const AMB_L = 3.6;

    // White Medical Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(AMB_W, AMB_H, AMB_L), bodyMat);
    body.position.y = AMB_H / 2 + 0.3;
    body.castShadow = true;
    group.add(body);

    // Red Cross Decals (Emissive Red)
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xdc2626, emissiveIntensity: 0.4 });
    const crossL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.6), crossMat);
    crossL.position.set(-AMB_W / 2 - 0.01, 1.1, 0);
    group.add(crossL);

    const crossR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.6), crossMat);
    crossR.position.set(AMB_W / 2 + 0.01, 1.1, 0);
    group.add(crossR);

    // Roof Emergency Lightbar (Red / Blue Strobes)
    const barGeo = new THREE.BoxGeometry(AMB_W * 0.7, 0.22, 0.35);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const lightBar = new THREE.Mesh(barGeo, barMat);
    lightBar.position.set(0, AMB_H + 0.42, 0.4);
    group.add(lightBar);

    // Dual Strobe LED Domes
    const strobeRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.16, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3.0 })
    );
    strobeRed.position.set(-0.35, AMB_H + 0.48, 0.4);
    group.add(strobeRed);

    const strobeBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.16, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 3.0 })
    );
    strobeBlue.position.set(0.35, AMB_H + 0.48, 0.4);
    group.add(strobeBlue);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    [-1, 1].forEach((side) => {
      const fw = new THREE.Mesh(wheelGeo, wheelMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (AMB_W / 2), 0.32, 1.1);
      group.add(fw);

      const rw = new THREE.Mesh(wheelGeo, wheelMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (AMB_W / 2), 0.32, -1.1);
      group.add(rw);
    });
  } else {
    // ----------------------------------------
    // STANDARD PASSENGER CAR (SEDAN)
    // ----------------------------------------
    const CAR_W = 1.6;
    const CAR_H = 0.95;
    const CAR_L = 3.4;

    // Body in vehicle's assigned color (hex parsed)
    const colorHex = parseInt(v.color.replace('#', '0x'), 16) || 0x3b82f6;
    const carMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.4,
    });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(CAR_W, 0.55, CAR_L), carMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(CAR_W * 0.85, 0.5, CAR_L * 0.55), carMat);
    cabin.position.set(0, 0.88, -0.15);
    cabin.castShadow = true;
    group.add(cabin);

    // Front & Rear Glass
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b1320, roughness: 0.1, metalness: 0.9 });
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(CAR_W * 0.78, 0.48), glassMat);
    frontWindshield.position.set(0, 0.85, 0.42);
    frontWindshield.rotation.x = -0.35;
    group.add(frontWindshield);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

    [-1, 1].forEach((side) => {
      const fw = new THREE.Mesh(wheelGeo, wheelMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (CAR_W / 2), 0.28, 1.0);
      group.add(fw);

      const rw = new THREE.Mesh(wheelGeo, wheelMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (CAR_W / 2), 0.28, -1.0);
      group.add(rw);
    });

    // Dual Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5e6, emissiveIntensity: 1.8 });
    const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    hlL.position.set(-0.55, 0.5, CAR_L / 2 + 0.02);
    group.add(hlL);

    const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    hlR.position.set(0.55, 0.5, CAR_L / 2 + 0.02);
    group.add(hlR);

    // Tail Lights (glow red when waiting)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: v.state === 'waiting' ? 0xff0000 : 0x770000,
      emissiveIntensity: v.state === 'waiting' ? 2.5 : 0.6,
    });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.02), tailMat);
    tlL.position.set(-0.55, 0.5, -CAR_L / 2 - 0.02);
    group.add(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.02), tailMat);
    tlR.position.set(0.55, 0.5, -CAR_L / 2 - 0.02);
    group.add(tlR);
  }

  return group;
}
