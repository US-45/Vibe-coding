import { Direction, MovementType, Vehicle, VehicleType } from '../types/simulation';

// Realistic vehicle dimensions and speeds (scaled for canvas road scale)
const VEHICLE_CONFIGS: Record<VehicleType, {
  length: number;
  width: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  colors: string[];
}> = {
  car: {
    length: 34,
    width: 17,
    maxSpeed: 2.8,
    acceleration: 0.08,
    deceleration: 0.16,
    colors: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#DC2626', '#2563EB', '#D97706', '#334155'],
  },
  auto: {
    length: 25,
    width: 15,
    maxSpeed: 2.3,
    acceleration: 0.09,
    deceleration: 0.18,
    colors: ['#059669', '#10B981', '#1E293B'], // Green CNG or Classic Black
  },
  bus: {
    length: 58,
    width: 21,
    maxSpeed: 2.1,
    acceleration: 0.05,
    deceleration: 0.12,
    colors: ['#B91C1C', '#1D4ED8', '#C2410C', '#047857'], // Red, Blue, Orange, Green
  },
  bike: {
    length: 20,
    width: 9,
    maxSpeed: 3.1,
    acceleration: 0.12,
    deceleration: 0.22,
    colors: ['#1E293B', '#DC2626', '#2563EB', '#475569'],
  },
  emergency: {
    length: 40,
    width: 19,
    maxSpeed: 3.4,
    acceleration: 0.12,
    deceleration: 0.20,
    colors: ['#FFFFFF'],
  },
};

let vehicleCounter = 0;

export function createVehicle(
  origin: Direction,
  laneIndex: number,
  movement: MovementType,
  forcedType?: VehicleType,
  seedRandom?: () => number
): Vehicle {
  const rand = seedRandom || Math.random;
  vehicleCounter++;
  
  let type: VehicleType = forcedType || 'car';
  if (!forcedType) {
    const roll = rand();
    if (roll < 0.35) type = 'car';
    else if (roll < 0.65) type = 'auto'; // 30% Auto-rickshaws
    else if (roll < 0.88) type = 'bike'; // 23% Two-wheelers
    else type = 'bus'; // 12% Public buses
  }

  const config = VEHICLE_CONFIGS[type];
  const colorIndex = Math.floor(rand() * config.colors.length);
  const color = config.colors[colorIndex];

  return {
    id: `veh_${origin}_${Date.now()}_${vehicleCounter}`,
    type,
    origin,
    laneIndex,
    movement,
    length: config.length,
    width: config.width,
    color,
    accentColor: type === 'emergency' ? '#DC2626' : undefined,
    distanceAlongPath: 0,
    speed: config.maxSpeed * 0.75,
    maxSpeed: config.maxSpeed,
    acceleration: config.acceleration,
    deceleration: config.deceleration,
    x: 0,
    y: 0,
    angle: 0,
    state: 'approaching',
    hasCrossedStopLine: false,
    timeSpentWaiting: 0,
    totalTime: 0,
    isEmergency: type === 'emergency',
    sirenBlink: false,
  };
}

/**
 * High-definition 2.5D automotive top-down vehicle rendering
 * Features:
 * - Multi-layer ambient occlusion undercarriage drop shadows
 * - Sculpted aerodynamic contours & body gradients
 * - Curved tinted windshields & side window pillars
 * - Forward LED headlight beam projection
 * - Dynamic active brake taillights flaring during braking/stopping
 * - Distinct authentic Indian vehicular silhouettes (Auto, Bus, Bike, Ambulance, Sedan)
 */
export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  vehicle: Vehicle,
  timestamp: number,
  isDark: boolean = true
) {
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);
  ctx.rotate(vehicle.angle);

  const halfL = vehicle.length / 2;
  const halfW = vehicle.width / 2;
  const isBraking = vehicle.speed < 0.2 || vehicle.state === 'waiting';

  // 1. Multi-pass Realistic Undercarriage Drop Shadow (Directional: light from top-left)
  ctx.save();
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 2, -halfW + 2.5, vehicle.length + 1, vehicle.width + 1, 4);
  ctx.fill();

  // Tighter inner contact shadow
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.30)';
  ctx.beginPath();
  ctx.roundRect(-halfL + 1, -halfW + 1, vehicle.length - 2, vehicle.width - 2, 3);
  ctx.fill();
  ctx.restore();

  // 2. VEHICLE SPECIFIC 3D GEOMETRY

  if (vehicle.type === 'auto') {
    // ==========================================
    // INDIAN AUTO-RICKSHAW (3-WHEELER TUK-TUK)
    // ==========================================
    // Lower body chassis (Tapered front fork)
    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.moveTo(halfL, 0); // front nose wheel fork
    ctx.lineTo(halfL * 0.35, -halfW);
    ctx.lineTo(-halfL, -halfW);
    ctx.lineTo(-halfL, halfW);
    ctx.lineTo(halfL * 0.35, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isDark ? '#141010' : '#4A4540';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Distinctive Sunshine Yellow Canopy / Hood with 3D rib contours
    const canopyGrad = ctx.createLinearGradient(0, -halfW * 0.85, 0, halfW * 0.85);
    canopyGrad.addColorStop(0, '#F59E0B');
    canopyGrad.addColorStop(0.5, '#FBBF24');
    canopyGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.65, -halfW * 0.85, halfL * 1.05, vehicle.width * 0.85, 3);
    ctx.fill();

    // Canopy seam ribs
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-halfL * 0.2, -halfW * 0.85);
    ctx.lineTo(-halfL * 0.2, halfW * 0.85);
    ctx.moveTo(halfL * 0.15, -halfW * 0.85);
    ctx.lineTo(halfL * 0.15, halfW * 0.85);
    ctx.stroke();

    // Driver area & windshield
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(halfL * 0.85, 0);
    ctx.lineTo(halfL * 0.4, -halfW * 0.65);
    ctx.lineTo(halfL * 0.4, halfW * 0.65);
    ctx.closePath();
    ctx.fill();

    // Handlebar & Meter
    ctx.fillStyle = '#64748B';
    ctx.fillRect(halfL * 0.45, -2.5, 1.2, 5);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(halfL * 0.35, -1, 1.5, 2);

    // Front Headlight with beam cone
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 1.5, -2, 2, 4);

    // Forward light beam cone
    const beamGrad = ctx.createLinearGradient(halfL, 0, halfL + 18, 0);
    beamGrad.addColorStop(0, isDark ? 'rgba(254, 240, 138, 0.45)' : 'rgba(254, 240, 138, 0.25)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(halfL, -2);
    ctx.lineTo(halfL + 18, -6);
    ctx.lineTo(halfL + 18, 6);
    ctx.lineTo(halfL, 2);
    ctx.closePath();
    ctx.fill();

    // Rear Taillights (glow red when braking)
    ctx.fillStyle = isBraking ? '#FF2222' : '#DC2626';
    if (isBraking) {
      ctx.shadowColor = '#FF2222';
      ctx.shadowBlur = 6;
    }
    ctx.fillRect(-halfL, -halfW + 1.5, 1.5, 3);
    ctx.fillRect(-halfL, halfW - 4.5, 1.5, 3);
    ctx.shadowBlur = 0;

  } else if (vehicle.type === 'bus') {
    // ==========================================
    // INDIAN CITY TRANSIT BUS (BEST / DTC)
    // ==========================================
    // Main bus body with 3D gradient
    const busGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    busGrad.addColorStop(0, vehicle.color);
    busGrad.addColorStop(0.35, '#FFFFFF');
    busGrad.addColorStop(0.7, vehicle.color);
    busGrad.addColorStop(1, '#7F1D1D');

    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 3);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#141010' : '#413939';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Front Windshield with subtle wiper detail
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(halfL * 0.68, -halfW * 0.88, halfL * 0.26, vehicle.width * 0.88, 2);
    ctx.fill();

    // Front digital LED destination matrix board ("42A CITY CENTER")
    ctx.fillStyle = '#000000';
    ctx.fillRect(halfL * 0.64, -halfW * 0.6, 2, vehicle.width * 0.6);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(halfL * 0.65, -halfW * 0.55, 1.2, vehicle.width * 0.55);

    // Tinted Side Passenger Windows (stripes on left and right)
    ctx.fillStyle = '#1E293B';
    const numWindows = 6;
    const winWidth = (halfL * 1.35) / numWindows;
    for (let i = 0; i < numWindows; i++) {
      const wx = -halfL * 0.72 + i * winWidth;
      ctx.fillRect(wx, -halfW * 0.95, winWidth - 1.5, 2.5);
      ctx.fillRect(wx, halfW * 0.95 - 2.5, winWidth - 1.5, 2.5);
    }

    // White Roof Pod & AC Units
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.45, -halfW * 0.55, halfL * 0.9, vehicle.width * 0.55, 2);
    ctx.fill();

    // AC cooling fans grilles
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-halfL * 0.35, -halfW * 0.35, 6, vehicle.width * 0.35);
    ctx.fillRect(-halfL * 0.05, -halfW * 0.35, 6, vehicle.width * 0.35);

    // Front Dual Headlights + Beams
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 2, -halfW + 2, 2, 4);
    ctx.fillRect(halfL - 2, halfW - 6, 2, 4);

    // Headlight light cones
    const busBeam = ctx.createLinearGradient(halfL, 0, halfL + 25, 0);
    busBeam.addColorStop(0, isDark ? 'rgba(254, 240, 138, 0.4)' : 'rgba(254, 240, 138, 0.2)');
    busBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = busBeam;
    ctx.beginPath();
    ctx.moveTo(halfL, -halfW + 2);
    ctx.lineTo(halfL + 25, -halfW - 3);
    ctx.lineTo(halfL + 25, halfW + 3);
    ctx.lineTo(halfL, halfW - 2);
    ctx.closePath();
    ctx.fill();

    // Rear "HORN OK PLEASE" Automotive Decal
    ctx.fillStyle = '#FBBF24';
    ctx.font = '900 5px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HORN', -halfL * 0.65, 0);

    // Rear Brake Lights (Intense flare on braking)
    ctx.fillStyle = isBraking ? '#FF1111' : '#B91C1C';
    if (isBraking) {
      ctx.shadowColor = '#FF2222';
      ctx.shadowBlur = 8;
    }
    ctx.fillRect(-halfL, -halfW + 2, 2, 4);
    ctx.fillRect(-halfL, halfW - 6, 2, 4);
    ctx.shadowBlur = 0;

  } else if (vehicle.type === 'bike') {
    // ==========================================
    // TWO-WHEELER (MOTORCYCLE + 3D RIDER)
    // ==========================================
    // Chassis & Fuel tank
    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 3);
    ctx.fill();

    // Handlebars with grips
    ctx.fillStyle = '#334155';
    ctx.fillRect(halfL * 0.35, -halfW - 1.5, 2, vehicle.width + 3);

    // Side mirrors
    ctx.fillStyle = '#64748B';
    ctx.fillRect(halfL * 0.45, -halfW - 2, 1.5, 1.5);
    ctx.fillRect(halfL * 0.45, halfW + 0.5, 1.5, 1.5);

    // 3D Rider Figurine (Helmet with visor reflection)
    const helmetGrad = ctx.createRadialGradient(-halfL * 0.1, -1, 1, -halfL * 0.1, 0, 4.5);
    helmetGrad.addColorStop(0, '#FACC15'); // Yellow safety helmet
    helmetGrad.addColorStop(0.7, '#D97706');
    helmetGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = helmetGrad;
    ctx.beginPath();
    ctx.arc(-halfL * 0.1, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Tinted helmet visor
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-halfL * 0.1 + 2, -2, 1.5, 4);

    // Rider jacket shoulders
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.45, -halfW * 0.85, 4, vehicle.width * 0.85, 2);
    ctx.fill();

    // Headlight & beam
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 1.5, -2, 2, 4);

    // Tail light
    ctx.fillStyle = isBraking ? '#FF2222' : '#DC2626';
    if (isBraking) {
      ctx.shadowColor = '#FF2222';
      ctx.shadowBlur = 6;
    }
    ctx.fillRect(-halfL, -1.5, 1.5, 3);
    ctx.shadowBlur = 0;

  } else if (vehicle.type === 'emergency') {
    // ==========================================
    // 108 EMERGENCY AMBULANCE
    // ==========================================
    // Medical white high-roof body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 4);
    ctx.fill();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Fluorescent Orange-Red side safety chevrons
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(-halfL * 0.85, -halfW, halfL * 1.7, 2);
    ctx.fillRect(-halfL * 0.85, halfW - 2, halfL * 1.7, 2);

    // Red Cross emblem on roof
    ctx.fillStyle = '#DC2626';
    const cSize = 9;
    const cThick = 3;
    ctx.fillRect(-cSize / 2, -cThick / 2, cSize, cThick);
    ctx.fillRect(-cThick / 2, -cSize / 2, cThick, cSize);

    // Front windshield
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(halfL * 0.45, -halfW * 0.8, halfL * 0.32, vehicle.width * 0.8);

    // Dual emergency strobe lightbar (alternating high-intensity Red and Blue)
    const flash = Math.floor(timestamp / 90) % 2 === 0;
    const redLight = flash ? '#FF0000' : '#450A0A';
    const blueLight = flash ? '#1D4ED8' : '#0066FF';

    ctx.save();
    ctx.fillStyle = flash ? '#FF0000' : '#0066FF';
    ctx.shadowColor = flash ? '#FF0000' : '#0066FF';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(halfL * 0.15, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#0066FF' : '#FF0000';
    ctx.shadowColor = flash ? '#0066FF' : '#FF0000';
    ctx.beginPath();
    ctx.arc(halfL * 0.15, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Front headlights + beams
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(halfL - 2, -halfW + 2, 2, 3.5);
    ctx.fillRect(halfL - 2, halfW - 5.5, 2, 3.5);

    // Rear brake lamps
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-halfL, -halfW + 2, 2, 3);
    ctx.fillRect(-halfL, halfW - 5, 2, 3);

  } else {
    // ==========================================
    // STANDARD PASSENGER CAR (SEDAN / SUV)
    // ==========================================
    // Contoured aerodynamic body with metallic specular gradient
    const carGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    carGrad.addColorStop(0, vehicle.color);
    carGrad.addColorStop(0.3, '#FFFFFF');
    carGrad.addColorStop(0.65, vehicle.color);
    carGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');

    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    // Slightly tapered front hood and rounded rear
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 4);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#141010' : '#413939';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Side mirrors on driver & passenger sides
    ctx.fillStyle = vehicle.color;
    ctx.fillRect(halfL * 0.25, -halfW - 2, 2.5, 2);
    ctx.fillRect(halfL * 0.25, halfW, 2.5, 2);

    // Front Windshield (curved tinted glass)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(halfL * 0.15, -halfW * 0.76, halfL * 0.36, vehicle.width * 0.76, 2);
    ctx.fill();

    // Glass reflection highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.2, -halfW * 0.5);
    ctx.lineTo(halfL * 0.45, -halfW * 0.1);
    ctx.stroke();

    // Roof panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.45, -halfW * 0.7, halfL * 0.6, vehicle.width * 0.7, 2);
    ctx.fill();

    // Rear Windshield
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.75, -halfW * 0.72, halfL * 0.26, vehicle.width * 0.72, 1.5);
    ctx.fill();

    // Dual Projector Headlights
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(halfL - 2, -halfW + 2, 2, 3.2);
    ctx.fillRect(halfL - 2, halfW - 5.2, 2, 3.2);

    // Headlight Forward Light Cones on Asphalt
    const carBeam = ctx.createLinearGradient(halfL, 0, halfL + 20, 0);
    carBeam.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)');
    carBeam.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = carBeam;
    ctx.beginPath();
    ctx.moveTo(halfL, -halfW + 2);
    ctx.lineTo(halfL + 20, -halfW - 2);
    ctx.lineTo(halfL + 20, halfW + 2);
    ctx.lineTo(halfL, halfW - 2);
    ctx.closePath();
    ctx.fill();

    // Dual Rear LED Taillights (Active brake flaring)
    ctx.fillStyle = isBraking ? '#FF1111' : '#B91C1C';
    if (isBraking) {
      ctx.shadowColor = '#FF2222';
      ctx.shadowBlur = 7;
    }
    ctx.fillRect(-halfL, -halfW + 2, 1.5, 3.2);
    ctx.fillRect(-halfL, halfW - 5.2, 1.5, 3.2);
    ctx.shadowBlur = 0;
  }

  // Active waiting status badge (understated red outline if halted)
  if (isBraking && vehicle.state === 'waiting') {
    ctx.strokeStyle = 'rgba(255, 98, 104, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-halfL - 1, -halfW - 1, vehicle.length + 2, vehicle.width + 2, 4);
    ctx.stroke();
  }

  ctx.restore();
}
