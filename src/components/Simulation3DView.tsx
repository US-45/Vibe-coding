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
  Sparkles,
  Building2,
  Trees,
  Compass,
  Video
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

type CameraPreset = 'isometric' | 'driver' | 'topDown' | 'gantry' | 'cinematic';
type LightingMode = 'day' | 'night' | 'dusk';

interface VehicleMeshGroup extends THREE.Group {
  userData: {
    wheels: THREE.Mesh[];
    brakeLights: THREE.Mesh[];
    headlights?: THREE.Mesh[];
    lightBeams?: THREE.Mesh[];
    strobeRed?: THREE.Mesh;
    strobeBlue?: THREE.Mesh;
    vehicleType: VehicleType;
  };
}

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
  const vehicleMeshesRef = useRef<Map<string, VehicleMeshGroup>>(new Map());
  const signalLampsRef = useRef<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh; glow: THREE.PointLight }>>({} as any);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    dirLight: THREE.DirectionalLight;
    streetLights: THREE.PointLight[];
    emergencyLightRed?: THREE.PointLight;
    emergencyLightBlue?: THREE.PointLight;
  } | null>(null);

  const isEmergency = currentPhase === 'EMERGENCY_ACTIVE' || currentPhase === 'EMERGENCY_CLEARANCE';

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d10);
    scene.fog = new THREE.FogExp2(0x0b0d10, 0.010);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 350);
    camera.position.set(28, 30, 36);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-Fidelity Tone Mapping & Soft Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Prevent dipping below ground
    controls.minDistance = 8;
    controls.maxDistance = 110;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xd4d8e0, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    dirLight.position.set(38, 55, 28);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 140;
    const d = 42;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // 6. Cobra-Head Modern Streetlights with downward soft illumination
    const streetLights: THREE.PointLight[] = [];
    const cornerPositions = [
      [-16, 7.5, -16],
      [16, 7.5, -16],
      [-16, 7.5, 16],
      [16, 7.5, 16],
    ];
    cornerPositions.forEach(([x, y, z]) => {
      const pLight = new THREE.PointLight(0xffdfa8, 1.4, 38, 1.3);
      pLight.position.set(x, y, z);
      scene.add(pLight);
      streetLights.push(pLight);

      // Curved Cobra-Head Lamp Post
      buildCobraStreetLamp(scene, x, z);
    });

    // 7. Dynamic 108 Emergency Strobe Point Lights for realistic scene pulsing
    const ambRedPoint = new THREE.PointLight(0xff0000, 0, 30, 1.5);
    ambRedPoint.position.set(0, 3, 0);
    scene.add(ambRedPoint);

    const ambBluePoint = new THREE.PointLight(0x0066ff, 0, 30, 1.5);
    ambBluePoint.position.set(0, 3, 0);
    scene.add(ambBluePoint);

    lightsRef.current = {
      ambient: ambientLight,
      dirLight,
      streetLights,
      emergencyLightRed: ambRedPoint,
      emergencyLightBlue: ambBluePoint,
    };

    // 8. Build 3D Indian Urban Environment: Roads, Medians, Markings, Gantries, and Buildings
    build3DJunctionEnvironment(scene);

    // 9. Build Overhead Signal Gantries with Active Road Spot Illumination
    buildSignalGantries(scene, signalLampsRef);

    // Handle Window Resize
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

      // Synchronize vehicle meshes with engine state and animate wheels
      if (engine) {
        syncVehiclesWithEngine(engine.getVehicles(), scene, vehicleMeshesRef);
      }

      // Update signal lights and their downward road glow
      updateSignalLamps(signals, signalLampsRef);

      // Dynamic Emergency Strobe animation
      if (isEmergency && lightsRef.current?.emergencyLightRed && lightsRef.current?.emergencyLightBlue) {
        const time = performance.now() * 0.012;
        const blink = Math.sin(time) > 0;
        lightsRef.current.emergencyLightRed.intensity = blink ? 3.8 : 0.1;
        lightsRef.current.emergencyLightBlue.intensity = blink ? 0.1 : 3.8;
      } else if (lightsRef.current?.emergencyLightRed && lightsRef.current?.emergencyLightBlue) {
        lightsRef.current.emergencyLightRed.intensity = 0;
        lightsRef.current.emergencyLightBlue.intensity = 0;
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
      scene.fog = new THREE.FogExp2(0x1a212d, 0.007);
      ambient.intensity = 1.05;
      ambient.color.setHex(0xffffff);
      dirLight.intensity = 2.4;
      dirLight.color.setHex(0xfff8ee);
      streetLights.forEach((l) => (l.intensity = 0.1));
    } else if (lightingMode === 'dusk') {
      scene.background = new THREE.Color(0x0c0f14);
      scene.fog = new THREE.FogExp2(0x0c0f14, 0.010);
      ambient.intensity = 0.60;
      ambient.color.setHex(0x94a3b8);
      dirLight.intensity = 1.4;
      dirLight.color.setHex(0xffaa5e);
      streetLights.forEach((l) => (l.intensity = 1.5));
    } else {
      // Night Mode
      scene.background = new THREE.Color(0x050608);
      scene.fog = new THREE.FogExp2(0x050608, 0.015);
      ambient.intensity = 0.22;
      ambient.color.setHex(0x384252);
      dirLight.intensity = 0.35;
      dirLight.color.setHex(0x64748b);
      streetLights.forEach((l) => (l.intensity = 2.8));
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
      // Ground perspective looking North into the Indian junction
      camera.position.set(2.2, 1.9, 24);
      controls.target.set(0, 1.2, -5);
    } else if (preset === 'topDown') {
      camera.position.set(0, 52, 0.1);
      controls.target.set(0, 0, 0);
    } else if (preset === 'gantry') {
      // Overhead gantry viewpoint framing South waiting queue & slip lane
      camera.position.set(7.5, 7.5, 17);
      controls.target.set(2.5, 2.0, 6);
    } else if (preset === 'cinematic') {
      // Dramatic wide city corner shot framing skyscrapers and traffic
      camera.position.set(-26, 18, 28);
      controls.target.set(0, 0, 0);
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
                <span>3D City Model</span>
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center space-x-1.5 font-mono text-[10px] text-[#929DA9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#36D98A] shadow-[0_0_6px_#36D98A]" />
            <span>WebGL 3D Engine • Three.js • Indian Metro Junction</span>
          </div>
        </div>

        {/* Camera Views & Lighting Controls */}
        <div className="flex items-center space-x-1.5 text-xs">
          {/* Camera Preset Selector */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 bg-[#0B0D10] p-0.5 rounded-lg border border-[#2A323B] font-mono text-[10px]">
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
            <button
              onClick={() => applyCameraPreset('cinematic')}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === 'cinematic'
                  ? 'bg-[#191F26] text-[#F3F5F7] font-bold border border-[#2A323B]'
                  : 'text-[#929DA9] hover:text-[#F3F5F7]'
              }`}
            >
              Cinematic
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
              title="Night mode (illuminated windows, headlights & streetlights)"
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
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 font-mono text-[9px] text-[#929DA9] bg-[#12161B]/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#2A323B] pointer-events-none">
          <Camera className="w-3 h-3 text-[#75B8FF]" />
          <span>DRAG TO ORBIT • SCROLL TO ZOOM</span>
        </div>

        {/* Vehicles Active Badge */}
        <div className="absolute bottom-3 right-3 font-mono text-[10px] bg-[#12161B]/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#2A323B] text-[#929DA9] pointer-events-none">
          ACTIVE 3D VEHICLES: <strong style={{ color: currentTheme.color }}>{activeVehiclesCount}</strong>
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
  // 1. City Terrain Base
  const terrainGeo = new THREE.PlaneGeometry(180, 180);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.95,
    metalness: 0.05,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.05;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // 2. Asphalt Road Cross (14m road width = 14 world units, 75m length)
  const ROAD_W = 14;
  const ROAD_L = 76;

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x161a22,
    roughness: 0.75,
    metalness: 0.15,
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

  // 3. Central Yellow-Box Junction (Criss-Cross Diagonal Grid Markings)
  buildYellowBoxJunction(scene, ROAD_W);

  // 4. White Dashed Lane Dividers (Separating Lane 0 and Lane 1)
  buildDashedLaneDividers(scene, ROAD_W, ROAD_L);

  // 5. Zebra Pedestrian Crossings (4 approaches)
  buildZebraCrossing(scene, 0, 7.5, 'horizontal');
  buildZebraCrossing(scene, 0, -7.5, 'horizontal');
  buildZebraCrossing(scene, 7.5, 0, 'vertical');
  buildZebraCrossing(scene, -7.5, 0, 'vertical');

  // 6. Stop Lines with IRC specification
  buildStopLines(scene, ROAD_W);

  // 7. Asphalt Turn Directional Arrows
  buildRoadArrows(scene, ROAD_W);

  // 8. IRC Raised Concrete Medians with Yellow/Black striping & Green Planters
  buildIRCMedianWithPlanters(scene, 0, 22.5, 27, 'vertical');
  buildIRCMedianWithPlanters(scene, 0, -22.5, 27, 'vertical');
  buildIRCMedianWithPlanters(scene, 22.5, 0, 27, 'horizontal');
  buildIRCMedianWithPlanters(scene, -22.5, 0, 27, 'horizontal');

  // 9. Corner Sidewalks with Alternating Yellow/Black Kerb Stones
  buildCornerSidewalks(scene, ROAD_W / 2);

  // 10. Indian Urban Architecture: 4 Corner Building Complexes
  buildCityCorners(scene, ROAD_W / 2);

  // 11. Modern City Bus Stop Shelter on Sidewalk
  buildBusStopShelter(scene, 10.5, 14.5);

  // 12. Sidewalk Trees & Shade Foliage
  buildSidewalkTrees(scene, ROAD_W / 2);

  // 13. Overhead Cantilever Highway Gantries with Green Indian Direction Signs
  buildHighwayGantries(scene, ROAD_W);
}

// Build Indian Yellow-Box Junction Hatching
function buildYellowBoxJunction(scene: THREE.Scene, roadWidth: number) {
  const boxGroup = new THREE.Group();
  const half = roadWidth / 2; // 7 units
  const lineMat = new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 });

  // Outer border
  const borderPoints: THREE.Vector3[] = [
    new THREE.Vector3(-half, 0.025, -half),
    new THREE.Vector3(half, 0.025, -half),
    new THREE.Vector3(half, 0.025, half),
    new THREE.Vector3(-half, 0.025, half),
    new THREE.Vector3(-half, 0.025, -half),
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
  boxGroup.add(new THREE.Line(borderGeo, lineMat));

  // Diagonal cross hatches
  const step = 2.3;
  for (let offset = -half + step; offset < half; offset += step) {
    // Diagonal 1 (\)
    const pts1: THREE.Vector3[] = [
      new THREE.Vector3(offset, 0.025, -half),
      new THREE.Vector3(half, 0.025, -offset),
    ];
    boxGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), lineMat));

    const pts2: THREE.Vector3[] = [
      new THREE.Vector3(-half, 0.025, offset),
      new THREE.Vector3(-offset, 0.025, half),
    ];
    boxGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), lineMat));

    // Diagonal 2 (/)
    const pts3: THREE.Vector3[] = [
      new THREE.Vector3(offset, 0.025, half),
      new THREE.Vector3(half, 0.025, offset),
    ];
    boxGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), lineMat));

    const pts4: THREE.Vector3[] = [
      new THREE.Vector3(-half, 0.025, -offset),
      new THREE.Vector3(-offset, 0.025, -half),
    ];
    boxGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts4), lineMat));
  }

  scene.add(boxGroup);
}

// Dashed White Lane Dividers (Separates curbside lane and straight lane)
function buildDashedLaneDividers(scene: THREE.Scene, roadWidth: number, roadLength: number) {
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const dashGeoH = new THREE.PlaneGeometry(0.3, 1.6);
  const dashGeoV = new THREE.PlaneGeometry(1.6, 0.3);

  const group = new THREE.Group();
  const halfRoad = roadWidth / 2; // 7
  const laneDividerOffset = halfRoad / 2; // 3.5

  // South approach incoming (x = +3.5, z from 8.5 to 36)
  for (let z = 9; z <= 35; z += 3.2) {
    const dash = new THREE.Mesh(dashGeoH, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(laneDividerOffset, 0.02, z);
    group.add(dash);
  }

  // South approach outgoing (x = -3.5, z from 8.5 to 36)
  for (let z = 9; z <= 35; z += 3.2) {
    const dash = new THREE.Mesh(dashGeoH, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-laneDividerOffset, 0.02, z);
    group.add(dash);
  }

  // North approach incoming (x = -3.5, z from -9 to -35)
  for (let z = -9; z >= -35; z -= 3.2) {
    const dash = new THREE.Mesh(dashGeoH, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-laneDividerOffset, 0.02, z);
    group.add(dash);
  }

  // North approach outgoing (x = +3.5, z from -9 to -35)
  for (let z = -9; z >= -35; z -= 3.2) {
    const dash = new THREE.Mesh(dashGeoH, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(laneDividerOffset, 0.02, z);
    group.add(dash);
  }

  // East approach incoming (z = +3.5, x from 9 to 35)
  for (let x = 9; x <= 35; x += 3.2) {
    const dash = new THREE.Mesh(dashGeoV, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.02, laneDividerOffset);
    group.add(dash);
  }

  // East approach outgoing (z = -3.5, x from 9 to 35)
  for (let x = 9; x <= 35; x += 3.2) {
    const dash = new THREE.Mesh(dashGeoV, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.02, -laneDividerOffset);
    group.add(dash);
  }

  // West approach incoming (z = -3.5, x from -9 to -35)
  for (let x = -9; x >= -35; x -= 3.2) {
    const dash = new THREE.Mesh(dashGeoV, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.02, -laneDividerOffset);
    group.add(dash);
  }

  // West approach outgoing (z = +3.5, x from -9 to -35)
  for (let x = -9; x >= -35; x -= 3.2) {
    const dash = new THREE.Mesh(dashGeoV, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.02, laneDividerOffset);
    group.add(dash);
  }

  scene.add(group);
}

// Zebra Pedestrian Crossings
function buildZebraCrossing(scene: THREE.Scene, cx: number, cz: number, orient: 'horizontal' | 'vertical') {
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
  const numStripes = 8;
  const stripeW = 0.55;
  const stripeL = 2.0;

  for (let i = 0; i < numStripes; i++) {
    const offset = (i - numStripes / 2 + 0.5) * 0.82;
    const geo = orient === 'horizontal' ? new THREE.PlaneGeometry(stripeW, stripeL) : new THREE.PlaneGeometry(stripeL, stripeW);
    const stripe = new THREE.Mesh(geo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(
      orient === 'horizontal' ? cx + offset : cx,
      0.024,
      orient === 'horizontal' ? cz : cz + offset
    );
    scene.add(stripe);
  }
}

// Stop Lines
function buildStopLines(scene: THREE.Scene, roadWidth: number) {
  const stopLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hStopGeo = new THREE.PlaneGeometry(roadWidth / 2, 0.45);
  const vStopGeo = new THREE.PlaneGeometry(0.45, roadWidth / 2);

  // South Stop Line (Drivers heading North on East half x > 0)
  const southStop = new THREE.Mesh(hStopGeo, stopLineMat);
  southStop.rotation.x = -Math.PI / 2;
  southStop.position.set(roadWidth / 4, 0.03, 7.0);
  scene.add(southStop);

  // North Stop Line (Drivers heading South on West half x < 0)
  const northStop = new THREE.Mesh(hStopGeo, stopLineMat);
  northStop.rotation.x = -Math.PI / 2;
  northStop.position.set(-roadWidth / 4, 0.03, -7.0);
  scene.add(northStop);

  // East Stop Line (Drivers heading West on South half z > 0)
  const eastStop = new THREE.Mesh(vStopGeo, stopLineMat);
  eastStop.rotation.x = -Math.PI / 2;
  eastStop.position.set(7.0, 0.03, roadWidth / 4);
  scene.add(eastStop);

  // West Stop Line (Drivers heading East on North half z < 0)
  const westStop = new THREE.Mesh(vStopGeo, stopLineMat);
  westStop.rotation.x = -Math.PI / 2;
  westStop.position.set(-7.0, 0.03, -roadWidth / 4);
  scene.add(westStop);
}

// Asphalt Turn Directional Arrows
function buildRoadArrows(scene: THREE.Scene, roadWidth: number) {
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  const arrowGroup = new THREE.Group();

  // South approach: Straight arrow on Lane 1 (x=1.75, z=12), Left arrow on Lane 0 (x=5.25, z=12)
  const straightGeo = new THREE.PlaneGeometry(0.35, 1.8);
  const sArrow = new THREE.Mesh(straightGeo, arrowMat);
  sArrow.rotation.x = -Math.PI / 2;
  sArrow.position.set(1.75, 0.022, 12);
  arrowGroup.add(sArrow);

  // Free Left Turn Arrow curved indicator
  const leftArrowGeo = new THREE.PlaneGeometry(0.35, 1.4);
  const lArrow = new THREE.Mesh(leftArrowGeo, arrowMat);
  lArrow.rotation.x = -Math.PI / 2;
  lArrow.position.set(5.25, 0.022, 12);
  arrowGroup.add(lArrow);

  scene.add(arrowGroup);
}

// IRC Raised Concrete Medians with Yellow/Black striping & Green Planters
function buildIRCMedianWithPlanters(
  scene: THREE.Scene,
  cx: number,
  cz: number,
  length: number,
  orient: 'vertical' | 'horizontal'
) {
  const MEDIAN_W = 0.9;
  const MEDIAN_H = 0.4;
  const segments = Math.floor(length / 1.6);
  const segLength = length / segments;

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.7 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });

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

    // Green Bush / Planter hedge in every second segment
    if (i % 2 === 1 && i > 1 && i < segments - 2) {
      const hedgeGeo = orient === 'vertical'
        ? new THREE.BoxGeometry(MEDIAN_W * 0.75, 0.45, segLength * 0.8)
        : new THREE.BoxGeometry(segLength * 0.8, 0.45, MEDIAN_W * 0.75);
      const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedge.position.y = MEDIAN_H + 0.22;
      if (orient === 'vertical') {
        hedge.position.z = segOffset;
      } else {
        hedge.position.x = segOffset;
      }
      hedge.castShadow = true;
      group.add(hedge);
    }
  }

  group.position.set(cx, 0, cz);
  scene.add(group);
}

// Corner Sidewalks with Alternating Yellow/Black Kerb Stones
function buildCornerSidewalks(scene: THREE.Scene, halfRoad: number) {
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x181e26, roughness: 0.85 });
  const SW_SIZE = 28;

  const corners = [
    { x: halfRoad + SW_SIZE / 2, z: halfRoad + SW_SIZE / 2 },
    { x: -halfRoad - SW_SIZE / 2, z: halfRoad + SW_SIZE / 2 },
    { x: halfRoad + SW_SIZE / 2, z: -halfRoad - SW_SIZE / 2 },
    { x: -halfRoad - SW_SIZE / 2, z: -halfRoad - SW_SIZE / 2 },
  ];

  corners.forEach(({ x, z }) => {
    const swMesh = new THREE.Mesh(new THREE.BoxGeometry(SW_SIZE, 0.35, SW_SIZE), sidewalkMat);
    swMesh.position.set(x, 0.175, z);
    swMesh.receiveShadow = true;
    scene.add(swMesh);
  });

  // Alternating Yellow and Black kerb stone borders along the intersection road edges
  buildCurbStones(scene, halfRoad);
}

// Kerb stones along the road edge
function buildCurbStones(scene: THREE.Scene, halfRoad: number) {
  const yellowKerb = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
  const blackKerb = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.7 });
  const group = new THREE.Group();

  const curbLength = 26;
  const numBlocks = 16;
  const blockL = curbLength / numBlocks;

  // Along each corner curb edge
  const corners = [
    { startX: halfRoad, startZ: halfRoad, dirX: 1, dirZ: 0 },
    { startX: halfRoad, startZ: halfRoad, dirX: 0, dirZ: 1 },
    { startX: -halfRoad, startZ: halfRoad, dirX: -1, dirZ: 0 },
    { startX: -halfRoad, startZ: halfRoad, dirX: 0, dirZ: 1 },
    { startX: halfRoad, startZ: -halfRoad, dirX: 1, dirZ: 0 },
    { startX: halfRoad, startZ: -halfRoad, dirX: 0, dirZ: -1 },
    { startX: -halfRoad, startZ: -halfRoad, dirX: -1, dirZ: 0 },
    { startX: -halfRoad, startZ: -halfRoad, dirX: 0, dirZ: -1 },
  ];

  corners.forEach((c) => {
    for (let i = 0; i < numBlocks; i++) {
      const isYellow = i % 2 === 0;
      const geo = c.dirX !== 0 ? new THREE.BoxGeometry(blockL, 0.38, 0.25) : new THREE.BoxGeometry(0.25, 0.38, blockL);
      const mesh = new THREE.Mesh(geo, isYellow ? yellowKerb : blackKerb);
      const dist = (i + 0.5) * blockL;
      mesh.position.set(
        c.startX + c.dirX * dist,
        0.19,
        c.startZ + c.dirZ * dist
      );
      group.add(mesh);
    }
  });

  scene.add(group);
}

// Indian Urban Architecture: 4 Corner Building Complexes
function buildCityCorners(scene: THREE.Scene, halfRoad: number) {
  // ----------------------------------------------------
  // CORNER 1: NORTH-EAST (Commercial & Banking Tower)
  // ----------------------------------------------------
  const neGroup = new THREE.Group();
  neGroup.position.set(halfRoad + 13, 0, -halfRoad - 13);

  // Podium
  const nePodium = new THREE.Mesh(
    new THREE.BoxGeometry(22, 5, 20),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 })
  );
  nePodium.position.y = 2.5;
  nePodium.castShadow = true;
  nePodium.receiveShadow = true;
  neGroup.add(nePodium);

  // Main Glass Tower
  const neTower = new THREE.Mesh(
    new THREE.BoxGeometry(16, 20, 15),
    new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.25, metalness: 0.85 })
  );
  neTower.position.y = 15;
  neTower.castShadow = true;
  neTower.receiveShadow = true;
  neGroup.add(neTower);

  // Storefront Sign: HDFC BANK
  const hdfcSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.4),
    new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('HDFC BANK', '24x7 ATM & BRANCH', '#004c8f', '#ffffff'),
      roughness: 0.4,
    })
  );
  hdfcSign.position.set(-6, 3.8, 10.05);
  neGroup.add(hdfcSign);

  // Rooftop Sintex Water Tanks (Black cylindrical tanks with ribbed bands)
  buildSintexWaterTank(neGroup, 4, 25.5, 4);
  buildSintexWaterTank(neGroup, 1, 25.5, 4);

  // Rooftop Antenna Mast
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 7, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
  );
  mast.position.set(-5, 28.5, -4);
  neGroup.add(mast);

  scene.add(neGroup);

  // ----------------------------------------------------
  // CORNER 2: SOUTH-EAST (Tech Park Tower)
  // ----------------------------------------------------
  const seGroup = new THREE.Group();
  seGroup.position.set(halfRoad + 13, 0, halfRoad + 13);

  const seTower = new THREE.Mesh(
    new THREE.BoxGeometry(18, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x111c26, roughness: 0.3, metalness: 0.7 })
  );
  seTower.position.y = 12;
  seTower.castShadow = true;
  seTower.receiveShadow = true;
  seGroup.add(seTower);

  // Tech Sign
  const techSign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.5),
    new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('SMART TECH PARK', 'TOWER 4 • METRO HUB', '#10b981', '#ffffff'),
      roughness: 0.4,
    })
  );
  techSign.position.set(-4, 4.5, -9.05);
  seGroup.add(techSign);

  // Rooftop HVAC chillers
  const hvac = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.8, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
  );
  hvac.position.set(3, 24.9, 2);
  seGroup.add(hvac);

  buildSintexWaterTank(seGroup, -4, 24.8, 3);
  scene.add(seGroup);

  // ----------------------------------------------------
  // CORNER 3: SOUTH-WEST (Metro Residency Apartments)
  // ----------------------------------------------------
  const swGroup = new THREE.Group();
  swGroup.position.set(-halfRoad - 13, 0, halfRoad + 13);

  const swTower = new THREE.Mesh(
    new THREE.BoxGeometry(19, 17, 18),
    new THREE.MeshStandardMaterial({ color: 0x272e38, roughness: 0.7 })
  );
  swTower.position.y = 8.5;
  swTower.castShadow = true;
  swTower.receiveShadow = true;
  swGroup.add(swTower);

  // Retail: Chai Point
  const chaiSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.2),
    new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('CHAI POINT', 'FRESH TEA & SNACKS', '#d97706', '#ffffff'),
      roughness: 0.4,
    })
  );
  chaiSign.position.set(4, 3.2, -9.05);
  swGroup.add(chaiSign);

  buildSintexWaterTank(swGroup, 4, 17.6, 4);
  buildSintexWaterTank(swGroup, 6.5, 17.6, 4);
  scene.add(swGroup);

  // ----------------------------------------------------
  // CORNER 4: NORTH-WEST (Commercial Complex & Pharmacy)
  // ----------------------------------------------------
  const nwGroup = new THREE.Group();
  nwGroup.position.set(-halfRoad - 13, 0, -halfRoad - 13);

  const nwTower = new THREE.Mesh(
    new THREE.BoxGeometry(18, 15, 17),
    new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.65 })
  );
  nwTower.position.y = 7.5;
  nwTower.castShadow = true;
  nwTower.receiveShadow = true;
  nwGroup.add(nwTower);

  // Retail: Apollo Pharmacy
  const apolloSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.3),
    new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('APOLLO 24|7', 'PHARMACY & CLINIC', '#059669', '#ffffff'),
      roughness: 0.4,
    })
  );
  apolloSign.position.set(4, 3.2, 8.55);
  nwGroup.add(apolloSign);

  buildSintexWaterTank(nwGroup, -3, 15.6, -3);
  scene.add(nwGroup);
}

// Procedural Black Sintex Water Tank
function buildSintexWaterTank(parent: THREE.Group, x: number, y: number, z: number) {
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: 0.6, metalness: 0.2 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 16), tankMat);
  tank.position.set(x, y + 0.75, z);
  tank.castShadow = true;
  parent.add(tank);

  // White lid
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
  lid.position.set(x, y + 1.55, z);
  parent.add(lid);
}

// Indian City Bus Stop Shelter on Sidewalk
function buildBusStopShelter(scene: THREE.Scene, x: number, z: number) {
  const shelter = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

  // 4 Steel Upright Posts
  [-1.5, 1.5].forEach((px) => {
    [-0.7, 0.7].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), steelMat);
      post.position.set(px, 1.3, pz);
      post.castShadow = true;
      shelter.add(post);
    });
  });

  // Curved Translucent Canopy Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.1, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, transparent: true, opacity: 0.8 })
  );
  roof.position.set(0, 2.65, 0);
  roof.castShadow = true;
  shelter.add(roof);

  // Stainless Steel Waiting Bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.5), steelMat);
  bench.position.set(0, 0.5, 0);
  bench.castShadow = true;
  shelter.add(bench);

  // Bus Stop Totem Display: "ROUTE 42A"
  const totem = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1.2),
    new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('BMTC', 'ROUTE 42A', '#dc2626', '#ffffff'),
    })
  );
  totem.position.set(1.9, 1.6, 0);
  shelter.add(totem);

  shelter.position.set(x, 0.35, z);
  scene.add(shelter);
}

// Sidewalk Shade Trees (Neem / Banyan style)
function buildSidewalkTrees(scene: THREE.Scene, halfRoad: number) {
  const treePositions = [
    [halfRoad + 3.5, halfRoad + 4.5],
    [halfRoad + 10.5, halfRoad + 4.5],
    [halfRoad + 4.5, halfRoad + 10.5],
    [-halfRoad - 3.5, halfRoad + 4.5],
    [-halfRoad - 10.5, halfRoad + 4.5],
    [halfRoad + 3.5, -halfRoad - 4.5],
    [halfRoad + 10.5, -halfRoad - 4.5],
    [-halfRoad - 3.5, -halfRoad - 4.5],
    [-halfRoad - 10.5, -halfRoad - 4.5],
  ];

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });

  treePositions.forEach(([x, z]) => {
    const tree = new THREE.Group();

    // Wood Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.8, 8), trunkMat);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    tree.add(trunk);

    // Multi-Layer Foliage Spheres
    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), leavesMat1);
    foliage1.position.y = 3.2;
    foliage1.castShadow = true;
    tree.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), leavesMat2);
    foliage2.position.set(0.4, 4.0, 0.3);
    foliage2.castShadow = true;
    tree.add(foliage2);

    tree.position.set(x, 0.35, z);
    scene.add(tree);
  });
}

// Curved Cobra-Head Street Lamp
function buildCobraStreetLamp(scene: THREE.Scene, x: number, z: number) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 });
  const lamp = new THREE.Group();

  // Vertical Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.0, 10), poleMat);
  pole.position.y = 3.5;
  pole.castShadow = true;
  lamp.add(pole);

  // Curved Cobra Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.5, 8), poleMat);
  arm.rotation.z = Math.PI / 3;
  arm.position.set(x > 0 ? -1.0 : 1.0, 7.3, 0);
  arm.castShadow = true;
  lamp.add(arm);

  // Luminaire Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.2, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xffedd5, emissiveIntensity: 1.2 })
  );
  head.position.set(x > 0 ? -2.0 : 2.0, 7.8, 0);
  lamp.add(head);

  lamp.position.set(x, 0, z);
  scene.add(lamp);
}

// Overhead Highway Direction Gantries (IRC Green Signboards)
function buildHighwayGantries(scene: THREE.Scene, roadWidth: number) {
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });

  // 1. South Approach Gantry (Overhead across incoming lanes at z = 14)
  const southGantry = new THREE.Group();
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6.5, 8), gantryMat);
  poleL.position.set(7.5, 3.25, 14);
  southGantry.add(poleL);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 0.25), gantryMat);
  beam.position.set(3.5, 6.2, 14);
  southGantry.add(beam);

  const signTexture = createGantrySignTexture('MUMBAI / TECH HUB', 'AIRPORT VIA RING ROAD', true);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 1.8),
    new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.4 })
  );
  signMesh.position.set(3.5, 6.2, 14.15);
  southGantry.add(signMesh);

  scene.add(southGantry);
}

// Build 4 Overhead Cantilever Traffic Signal Gantries with Road Glow Lights
function buildSignalGantries(
  scene: THREE.Scene,
  signalLampsRef: React.MutableRefObject<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh; glow: THREE.PointLight }>>
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
    const boxGeo = new THREE.BoxGeometry(0.85, 2.3, 0.5);
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
    redMesh.position.set(0, 0.68, 0.26);
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
    greenMesh.position.set(0, -0.68, 0.26);
    headBox.add(greenMesh);

    // Dynamic Road Glow Light (Casts colored glow on the asphalt beneath the signal)
    const roadGlow = new THREE.PointLight(0x000000, 0, 14, 1.8);
    roadGlow.position.set(cfg.headPos[0], 2.2, cfg.headPos[2]);
    scene.add(roadGlow);

    signalLampsRef.current[dir] = {
      red: redMesh,
      amber: amberMesh,
      green: greenMesh,
      glow: roadGlow,
    };

    scene.add(group);
  });
}

function updateSignalLamps(
  signals: Record<Direction, SignalState>,
  signalLampsRef: React.MutableRefObject<Record<Direction, { red: THREE.Mesh; amber: THREE.Mesh; green: THREE.Mesh; glow: THREE.PointLight }>>
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
      redMat.emissiveIntensity = 2.6;
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
      amberMat.emissiveIntensity = 2.6;
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
      greenMat.emissiveIntensity = 2.6;
    } else {
      greenMat.color.setHex(0x042817);
      greenMat.emissive.setHex(0x000000);
      greenMat.emissiveIntensity = 0;
    }

    // Dynamic Road Glow point light
    if (lamps.glow) {
      if (isGreen) {
        lamps.glow.color.setHex(0x10b981);
        lamps.glow.intensity = 1.4;
      } else if (isAmber) {
        lamps.glow.color.setHex(0xf59e0b);
        lamps.glow.intensity = 1.4;
      } else {
        lamps.glow.color.setHex(0xef4444);
        lamps.glow.intensity = 1.2;
      }
    }
  });
}

// Synchronize all vehicle 3D models with the simulation engine & rotate wheels
function syncVehiclesWithEngine(
  vehicles: Vehicle[],
  scene: THREE.Scene,
  vehicleMeshesRef: React.MutableRefObject<Map<string, VehicleMeshGroup>>
) {
  const currentIds = new Set(vehicles.map((v) => v.id));

  // 1. Remove exited vehicles
  vehicleMeshesRef.current.forEach((group, id) => {
    if (!currentIds.has(id)) {
      scene.remove(group);
      vehicleMeshesRef.current.delete(id);
    }
  });

  // 2. Update or create meshes for active vehicles
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
    meshGroup.rotation.y = Math.atan2(Math.cos(v.angle), Math.sin(v.angle));

    // Dynamic Wheel Rotation based on speed
    if (meshGroup.userData?.wheels) {
      const speed = v.speed || 0;
      const rotStep = speed * 0.15;
      meshGroup.userData.wheels.forEach((w) => {
        w.rotation.x += rotStep;
      });
    }

    // Dynamic Active Brake Lights (Glow bright red when stopping/waiting)
    if (meshGroup.userData?.brakeLights) {
      const isBraking = v.state === 'waiting' || v.speed < 0.2;
      meshGroup.userData.brakeLights.forEach((bl) => {
        const mat = bl.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissiveIntensity = isBraking ? 2.8 : 0.4;
          mat.color.setHex(isBraking ? 0xff2222 : 0x660000);
          mat.emissive.setHex(isBraking ? 0xff2222 : 0x330000);
        }
      });
    }

    // Dynamic Ambulance Strobe flashing
    if (meshGroup.userData?.vehicleType === 'emergency') {
      const now = performance.now() * 0.014;
      const redOn = Math.sin(now) > 0;
      if (meshGroup.userData.strobeRed) {
        const mat = meshGroup.userData.strobeRed.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = redOn ? 4.5 : 0.2;
      }
      if (meshGroup.userData.strobeBlue) {
        const mat = meshGroup.userData.strobeBlue.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = redOn ? 0.2 : 4.5;
      }
    }
  });
}

// Create detailed procedural 3D vehicle models
function create3DVehicleMesh(v: Vehicle): VehicleMeshGroup {
  const group = new THREE.Group() as VehicleMeshGroup;
  const wheels: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];

  group.userData = {
    wheels,
    brakeLights,
    vehicleType: v.type,
  };

  if (v.type === 'auto') {
    // ----------------------------------------
    // INDIAN AUTO-RICKSHAW (3-WHEELER)
    // ----------------------------------------
    // Green CNG Lower Body
    const lowerBodyGeo = new THREE.BoxGeometry(1.35, 0.75, 2.1);
    const lowerMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
    const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerMat);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Yellow Canvas Canopy / Hood
    const roofGeo = new THREE.BoxGeometry(1.3, 0.65, 1.85);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.15;
    roof.position.z = -0.1;
    roof.castShadow = true;
    group.add(roof);

    // Front Windshield
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.55), glassMat);
    glass.position.set(0, 1.05, 0.84);
    glass.rotation.x = -0.18;
    group.add(glass);

    // Front Steering Fork & Handlebars
    const fork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    fork.position.set(0, 0.35, 0.95);
    group.add(fork);

    // 3 Wheels (1 front centered, 2 rear) with Silver spoke hubs
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    // Front single wheel
    const frontWheel = new THREE.Mesh(wheelGeo, tireMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.24, 0.95);
    group.add(frontWheel);
    wheels.push(frontWheel);

    // Rear left & right wheels
    const rearL = new THREE.Mesh(wheelGeo, tireMat);
    rearL.rotation.z = Math.PI / 2;
    rearL.position.set(-0.70, 0.24, -0.65);
    group.add(rearL);
    wheels.push(rearL);

    const rearR = new THREE.Mesh(wheelGeo, tireMat);
    rearR.rotation.z = Math.PI / 2;
    rearR.position.set(0.70, 0.24, -0.65);
    group.add(rearR);
    wheels.push(rearR);

    // Front single round headlight
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe082, emissiveIntensity: 1.8 })
    );
    headlight.position.set(0, 0.65, 1.06);
    group.add(headlight);

    // Rear Brake Lamps
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x330000, emissiveIntensity: 0.5 });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.02), tailMat);
    bl1.position.set(-0.45, 0.55, -1.06);
    group.add(bl1);
    brakeLights.push(bl1);

    const bl2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.02), tailMat.clone());
    bl2.position.set(0.45, 0.55, -1.06);
    group.add(bl2);
    brakeLights.push(bl2);
  } else if (v.type === 'bus') {
    // ----------------------------------------
    // INDIAN CITY TRANSIT BUS (BEST / BMTC / DTC)
    // ----------------------------------------
    const BUS_W = 1.95;
    const BUS_H = 1.85;
    const BUS_L = 5.8;

    // Crimson Red Lower Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(BUS_W, BUS_H, BUS_L), bodyMat);
    body.position.y = BUS_H / 2 + 0.35;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // White / Cream Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(BUS_W * 0.98, 0.22, BUS_L * 0.99),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    roof.position.y = BUS_H + 0.45;
    roof.castShadow = true;
    group.add(roof);

    // Roof-mounted AC Unit Pod
    const acPod = new THREE.Mesh(
      new THREE.BoxGeometry(BUS_W * 0.7, 0.35, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    acPod.position.set(0, BUS_H + 0.65, 0.5);
    group.add(acPod);

    // Front Destination LED Display ("42A CONNAUGHT PL")
    const ledTexture = createBusLedTexture('42A', 'CITY CENTER');
    const destBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(BUS_W * 0.75, 0.4),
      new THREE.MeshStandardMaterial({ map: ledTexture, emissive: 0xf59e0b, emissiveIntensity: 0.8 })
    );
    destBoard.position.set(0, BUS_H + 0.15, BUS_L / 2 + 0.02);
    group.add(destBoard);

    // Rear "HORN OK PLEASE" Indian Truck/Bus Art Panel
    const rearPanelTexture = createHornOkPleaseTexture();
    const hornSign = new THREE.Mesh(
      new THREE.PlaneGeometry(BUS_W * 0.78, 0.6),
      new THREE.MeshStandardMaterial({ map: rearPanelTexture, roughness: 0.5 })
    );
    hornSign.position.set(0, 0.95, -BUS_L / 2 - 0.02);
    hornSign.rotation.y = Math.PI;
    group.add(hornSign);

    // Tinted Side Windows
    const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const sideWinL = new THREE.Mesh(new THREE.PlaneGeometry(BUS_L * 0.88, 0.6), winMat);
    sideWinL.rotation.y = -Math.PI / 2;
    sideWinL.position.set(-BUS_W / 2 - 0.01, 1.45, 0);
    group.add(sideWinL);

    const sideWinR = new THREE.Mesh(new THREE.PlaneGeometry(BUS_L * 0.88, 0.6), winMat);
    sideWinR.rotation.y = Math.PI / 2;
    sideWinR.position.set(BUS_W / 2 + 0.01, 1.45, 0);
    group.add(sideWinR);

    // Front Windshield
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(BUS_W * 0.85, 0.75), winMat);
    frontWindshield.position.set(0, 1.35, BUS_L / 2 + 0.01);
    group.add(frontWindshield);

    // 6 Large Wheels (2 front, 4 rear duals)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    [-1, 1].forEach((side) => {
      // Front wheel
      const fw = new THREE.Mesh(wheelGeo, tireMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (BUS_W / 2), 0.38, 1.85);
      group.add(fw);
      wheels.push(fw);

      // Rear wheels
      const rw = new THREE.Mesh(wheelGeo, tireMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (BUS_W / 2), 0.38, -1.85);
      group.add(rw);
      wheels.push(rw);
    });

    // Rear Brake Lights
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x330000, emissiveIntensity: 0.5 });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.02), tailMat);
    bl1.position.set(-0.7, 0.65, -BUS_L / 2 - 0.02);
    group.add(bl1);
    brakeLights.push(bl1);

    const bl2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.02), tailMat.clone());
    bl2.position.set(0.7, 0.65, -BUS_L / 2 - 0.02);
    group.add(bl2);
    brakeLights.push(bl2);
  } else if (v.type === 'bike') {
    // ----------------------------------------
    // TWO-WHEELER (MOTORBIKE + RIDER FIGURINE)
    // ----------------------------------------
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 1.4), bikeMat);
    frame.position.y = 0.5;
    group.add(frame);

    // 2 Spoke Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const fw = new THREE.Mesh(wheelGeo, tireMat);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(0, 0.3, 0.6);
    group.add(fw);
    wheels.push(fw);

    const rw = new THREE.Mesh(wheelGeo, tireMat);
    rw.rotation.z = Math.PI / 2;
    rw.position.set(0, 0.3, -0.6);
    group.add(rw);
    wheels.push(rw);

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    handle.position.set(0, 0.85, 0.45);
    group.add(handle);

    // Rider Torso & Helmet Figurine
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.55, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    torso.position.set(0, 1.02, -0.08);
    torso.rotation.x = 0.2;
    group.add(torso);

    // Bright Safety Helmet (Yellow/Orange/White)
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
    );
    helmet.position.set(0, 1.45, -0.02);
    group.add(helmet);

    // Rear taillight
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x330000, emissiveIntensity: 0.5 });
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.02), tailMat);
    bl.position.set(0, 0.58, -0.72);
    group.add(bl);
    brakeLights.push(bl);
  } else if (v.type === 'emergency') {
    // ----------------------------------------
    // 108 AMBULANCE (WITH DUAL STROBE LIGHTBAR)
    // ----------------------------------------
    const AMB_W = 1.75;
    const AMB_H = 1.55;
    const AMB_L = 3.8;

    // White Medical Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(AMB_W, AMB_H, AMB_L), bodyMat);
    body.position.y = AMB_H / 2 + 0.32;
    body.castShadow = true;
    group.add(body);

    // Red Cross Decals
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xdc2626, emissiveIntensity: 0.6 });
    [-1, 1].forEach((side) => {
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.7), crossMat);
      crossH.position.set(side * (AMB_W / 2 + 0.01), 1.15, 0);
      group.add(crossH);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.22), crossMat);
      crossV.position.set(side * (AMB_W / 2 + 0.01), 1.15, 0);
      group.add(crossV);
    });

    // Roof Emergency Lightbar Housing
    const barGeo = new THREE.BoxGeometry(AMB_W * 0.72, 0.24, 0.35);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const lightBar = new THREE.Mesh(barGeo, barMat);
    lightBar.position.set(0, AMB_H + 0.44, 0.4);
    group.add(lightBar);

    // Dual Strobe LED Domes
    const strobeRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3.5 })
    );
    strobeRed.position.set(-0.35, AMB_H + 0.5, 0.4);
    group.add(strobeRed);
    group.userData.strobeRed = strobeRed;

    const strobeBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 3.5 })
    );
    strobeBlue.position.set(0.35, AMB_H + 0.5, 0.4);
    group.add(strobeBlue);
    group.userData.strobeBlue = strobeBlue;

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 14);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    [-1, 1].forEach((side) => {
      const fw = new THREE.Mesh(wheelGeo, tireMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (AMB_W / 2), 0.32, 1.15);
      group.add(fw);
      wheels.push(fw);

      const rw = new THREE.Mesh(wheelGeo, tireMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (AMB_W / 2), 0.32, -1.15);
      group.add(rw);
      wheels.push(rw);
    });

    // Brake Lights
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x330000, emissiveIntensity: 0.5 });
    const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.02), tailMat);
    bl1.position.set(-0.6, 0.65, -AMB_L / 2 - 0.02);
    group.add(bl1);
    brakeLights.push(bl1);

    const bl2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.02), tailMat.clone());
    bl2.position.set(0.6, 0.65, -AMB_L / 2 - 0.02);
    group.add(bl2);
    brakeLights.push(bl2);
  } else {
    // ----------------------------------------
    // STANDARD PASSENGER CAR (SEDAN / HATCHBACK)
    // ----------------------------------------
    const CAR_W = 1.65;
    const CAR_H = 0.98;
    const CAR_L = 3.5;

    const colorHex = parseInt(v.color.replace('#', '0x'), 16) || 0x3b82f6;
    const carMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.45,
    });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(CAR_W, 0.55, CAR_L), carMat);
    chassis.position.y = 0.46;
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(CAR_W * 0.86, 0.52, CAR_L * 0.56), carMat);
    cabin.position.set(0, 0.9, -0.15);
    cabin.castShadow = true;
    group.add(cabin);

    // Front & Rear Glass
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b1320, roughness: 0.1, metalness: 0.9 });
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(CAR_W * 0.8, 0.5), glassMat);
    frontWindshield.position.set(0, 0.88, 0.44);
    frontWindshield.rotation.x = -0.38;
    group.add(frontWindshield);

    // Side Mirrors
    const mirrorMat = new THREE.MeshStandardMaterial({ color: colorHex });
    [-1, 1].forEach((side) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), mirrorMat);
      mirror.position.set(side * (CAR_W / 2 + 0.06), 0.85, 0.4);
      group.add(mirror);
    });

    // 4 Wheels with Alloy Hubs
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

    [-1, 1].forEach((side) => {
      const fw = new THREE.Mesh(wheelGeo, tireMat);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(side * (CAR_W / 2), 0.28, 1.05);
      group.add(fw);
      wheels.push(fw);

      const rw = new THREE.Mesh(wheelGeo, tireMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(side * (CAR_W / 2), 0.28, -1.05);
      group.add(rw);
      wheels.push(rw);
    });

    // Dual Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5e6, emissiveIntensity: 2.0 });
    const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    hlL.position.set(-0.58, 0.52, CAR_L / 2 + 0.02);
    group.add(hlL);

    const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    hlR.position.set(0.58, 0.52, CAR_L / 2 + 0.02);
    group.add(hlR);

    // Tail Lights (Active Brake Lights)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x660000,
      emissive: 0x330000,
      emissiveIntensity: 0.5,
    });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.02), tailMat);
    tlL.position.set(-0.58, 0.52, -CAR_L / 2 - 0.02);
    group.add(tlL);
    brakeLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.02), tailMat.clone());
    tlR.position.set(0.58, 0.52, -CAR_L / 2 - 0.02);
    group.add(tlR);
    brakeLights.push(tlR);
  }

  return group;
}

// ==========================================
// PROCEDURAL CANVAS TEXTURE HELPERS (100% OFFLINE)
// ==========================================

// IRC Highway Signboard Texture
function createGantrySignTexture(title: string, subtitle: string, hasFreeLeft: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 512, 160);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 144);
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 484, 132);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑ ' + title, 32, 55);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#c6f36b';
    ctx.fillText(subtitle, 32, 105);

    if (hasFreeLeft) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('FREE LEFT ↱', 480, 80);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Indian Transit Bus Front Destination LED Matrix Board
function createBusLedTexture(route: string, destination: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${route} ${destination}`, 128, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Indian "HORN OK PLEASE" Automotive Art Panel
function createHornOkPleaseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffe082';
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 116);

    ctx.fillStyle = '#d32f2f';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HORN', 55, 68);

    ctx.beginPath();
    ctx.arc(128, 64, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('OK', 128, 64);

    ctx.fillStyle = '#d32f2f';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('PLEASE', 200, 68);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SPEED 40 KM/H', 128, 110);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Storefront & Corporate Signboards
function createStoreSignTexture(name: string, category: string, bg: string, textCol: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = textCol;
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 24);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(category, 128, 48);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
