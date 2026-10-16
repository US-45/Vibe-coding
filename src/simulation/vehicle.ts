import { Direction, MovementType, Vehicle, VehicleType } from '../types/simulation';

// Realistic vehicle dimensions and speeds (adapted for canvas road scale)
const VEHICLE_CONFIGS: Record<VehicleType, {
  length: number;
  width: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  colors: string[];
}> = {
  car: {
    length: 32,
    width: 17,
    maxSpeed: 2.8,
    acceleration: 0.08,
    deceleration: 0.16,
    colors: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#DC2626', '#2563EB', '#D97706'], // Popular Indian car colors (White, Silver, Grey, Red, Blue)
  },
  auto: { // Indian 3-wheeler auto-rickshaw (CNG Green/Yellow or Classic Yellow/Black)
    length: 24,
    width: 15,
    maxSpeed: 2.3,
    acceleration: 0.09,
    deceleration: 0.18,
    colors: ['#059669', '#10B981', '#1F2937'], // Green CNG body or Black
  },
  bus: { // Indian public city bus (DTC/BEST/BMTC style)
    length: 56,
    width: 21,
    maxSpeed: 2.1,
    acceleration: 0.05,
    deceleration: 0.12,
    colors: ['#DC2626', '#1E40AF', '#D97706'], // Red (BEST/DTC), Blue (BMTC), Orange
  },
  bike: { // Two-wheelers: Splendor / Pulsar / Activa
    length: 18,
    width: 9,
    maxSpeed: 3.1,
    acceleration: 0.12,
    deceleration: 0.22,
    colors: ['#1E293B', '#DC2626', '#2563EB', '#64748B'],
  },
  emergency: { // 108 Ambulance
    length: 38,
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
    else if (roll < 0.65) type = 'auto'; // 30% Auto-rickshaws (Classic Indian junction presence!)
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
    speed: config.maxSpeed * 0.75, // initial entry speed
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

export function drawVehicle(ctx: CanvasRenderingContext2D, vehicle: Vehicle, timestamp: number) {
  ctx.save();
  ctx.translate(vehicle.x, vehicle.y);
  ctx.rotate(vehicle.angle);

  const halfL = vehicle.length / 2;
  const halfW = vehicle.width / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(-halfL + 2, -halfW + 2, vehicle.length, vehicle.width);

  // 1. AUTO-RICKSHAW (Indian Tuk-Tuk)
  if (vehicle.type === 'auto') {
    // 3-wheeler body with tapered front
    ctx.fillStyle = vehicle.color; // Green CNG or Black lower body
    ctx.beginPath();
    ctx.moveTo(halfL, 0); // front nose
    ctx.lineTo(halfL * 0.3, -halfW);
    ctx.lineTo(-halfL, -halfW);
    ctx.lineTo(-halfL, halfW);
    ctx.lineTo(halfL * 0.3, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1F1A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Distinctive bright yellow canopy / roof
    ctx.fillStyle = '#F59E0B'; // Yellow roof
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.6, -halfW * 0.85, halfL * 0.95, vehicle.width * 0.85, 3);
    ctx.fill();

    // Windshield (narrow front)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(halfL * 0.8, 0);
    ctx.lineTo(halfL * 0.35, -halfW * 0.7);
    ctx.lineTo(halfL * 0.35, halfW * 0.7);
    ctx.closePath();
    ctx.fill();

    // Front single headlight
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 2, -1.5, 2, 3);

    // Rear engine grill / black bumper
    ctx.fillStyle = '#111827';
    ctx.fillRect(-halfL, -halfW * 0.7, 2, vehicle.width * 0.7);
  } 
  // 2. INDIAN PUBLIC BUS (BEST / DTC / City Transport)
  else if (vehicle.type === 'bus') {
    // Main bus body
    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 3);
    ctx.fill();
    ctx.strokeStyle = '#1F1A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Front windshield
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(halfL * 0.65, -halfW * 0.85, halfL * 0.25, vehicle.width * 0.85);

    // Side windows striping (passenger windows)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-halfL * 0.7, -halfW * 0.9, halfL * 1.25, 2.5);
    ctx.fillRect(-halfL * 0.7, halfW * 0.9 - 2.5, halfL * 1.25, 2.5);

    // White roof panel / luggage carrier
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-halfL * 0.5, -halfW * 0.5, halfL * 0.9, vehicle.width * 0.5);

    // Headlights
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 2, -halfW + 2, 2, 4);
    ctx.fillRect(halfL - 2, halfW - 6, 2, 4);

    // Tail lights
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-halfL, -halfW + 2, 2, 3);
    ctx.fillRect(-halfL, halfW - 5, 2, 3);

    // "BLOW HORN" text detail on rear
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 5px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HORN', -halfL * 0.4, 0);
  }
  // 3. TWO-WHEELER (Motorbike / Scooter)
  else if (vehicle.type === 'bike') {
    // Bike chassis
    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 2);
    ctx.fill();

    // Handlebars
    ctx.fillStyle = '#374151';
    ctx.fillRect(halfL * 0.3, -halfW - 1, 2, vehicle.width + 2);

    // Rider helmet (top-down circle)
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(-halfL * 0.1, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 1, -1.5, 2, 3);

    // Tail light
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-halfL, -1.5, 2, 3);
  }
  // 4. EMERGENCY 108 AMBULANCE
  else if (vehicle.type === 'emergency') {
    // White ambulance body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 4);
    ctx.fill();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Orange/Red side safety stripes
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(-halfL * 0.8, -halfW, halfL * 1.6, 2);
    ctx.fillRect(-halfL * 0.8, halfW - 2, halfL * 1.6, 2);

    // Red Cross on roof
    ctx.fillStyle = '#DC2626';
    const crossSize = 8;
    const thickness = 2.5;
    ctx.fillRect(-crossSize / 2, -thickness / 2, crossSize, thickness);
    ctx.fillRect(-thickness / 2, -crossSize / 2, thickness, crossSize);

    // Front windshield
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(halfL * 0.45, -halfW * 0.8, halfL * 0.3, vehicle.width * 0.8);

    // Dual emergency strobe beacon (alternating Red and Blue)
    const flashState = Math.floor(timestamp / 100) % 2 === 0;
    ctx.fillStyle = flashState ? '#EF4444' : '#3B82F6';
    ctx.shadowColor = flashState ? '#EF4444' : '#3B82F6';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(halfL * 0.2, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flashState ? '#3B82F6' : '#EF4444';
    ctx.shadowColor = flashState ? '#3B82F6' : '#EF4444';
    ctx.beginPath();
    ctx.arc(halfL * 0.2, 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }
  // 5. STANDARD CAR (Sedan / Hatchback)
  else {
    ctx.fillStyle = vehicle.color;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, vehicle.length, vehicle.width, 4);
    ctx.fill();
    ctx.strokeStyle = '#1F1A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Front windshield
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(halfL * 0.15, -halfW * 0.75, halfL * 0.35, vehicle.width * 0.75);
    // Rear window
    ctx.fillRect(-halfL * 0.7, -halfW * 0.7, halfL * 0.25, vehicle.width * 0.7);
    // Headlights
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(halfL - 2, -halfW + 2, 2, 3);
    ctx.fillRect(halfL - 2, halfW - 5, 2, 3);
    // Tail lights
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-halfL, -halfW + 2, 2, 3);
    ctx.fillRect(-halfL, halfW - 5, 2, 3);
  }

  // Waiting indicator
  if (vehicle.speed < 0.1 && vehicle.state === 'waiting') {
    ctx.fillStyle = 'rgba(229, 72, 72, 0.7)';
    ctx.fillRect(-halfL, -halfW, 2, vehicle.width);
  }

  ctx.restore();
}
