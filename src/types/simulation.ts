export type Direction = 'north' | 'south' | 'east' | 'west';

export type SignalColor = 'red' | 'amber' | 'green';

export type SignalPhase = 
  | 'NS_GREEN'
  | 'NS_AMBER'
  | 'ALL_RED_1'
  | 'EW_GREEN'
  | 'EW_AMBER'
  | 'ALL_RED_2'
  | 'EMERGENCY_CLEARANCE'
  | 'EMERGENCY_ACTIVE';

export type SignalMode = 'fixed' | 'adaptive';

export type VehicleType = 'car' | 'auto' | 'bus' | 'bike' | 'emergency';

export type MovementType = 'straight' | 'left';

export interface Vehicle {
  id: string;
  type: VehicleType;
  origin: Direction;
  laneIndex: number; // 0 = outer (left turn / straight), 1 = inner (straight)
  movement: MovementType;
  
  // Dimensions & appearance
  length: number;
  width: number;
  color: string;
  accentColor?: string;
  label?: string; // For B&W accessibility or emergency
  
  // Position along path (distance from start of approach in px)
  distanceAlongPath: number;
  speed: number; // current speed px/frame
  maxSpeed: number; // max cruise speed
  acceleration: number; // max acceleration
  deceleration: number; // max deceleration
  
  // Coordinates for canvas drawing
  x: number;
  y: number;
  angle: number; // heading in radians
  
  // State
  state: 'approaching' | 'waiting' | 'crossing' | 'exited';
  hasCrossedStopLine: boolean;
  timeSpentWaiting: number; // in seconds
  totalTime: number; // in seconds
  
  // Emergency vehicle specific
  isEmergency?: boolean;
  sirenBlink?: boolean;
}

export interface SignalState {
  color: SignalColor;
  label: 'GO' | 'WAIT' | 'STOP';
  symbol: '▲' | '◆' | '■';
  remainingTime: number; // in seconds
  totalPhaseTime: number;
}

export interface DirectionStats {
  carsPassed: number;
  currentQueue: number;
  maxQueue: number;
  totalWaitTime: number;
  avgWaitTime: number;
}

export interface SimulationStats {
  carsPassed: number;
  activeVehicles: number;
  totalWaitingVehicles: number;
  averageWaitTime: number;
  maxRecordedQueue: number;
  elapsedTime: number;
  directionStats: Record<Direction, DirectionStats>;
  history: Array<{
    time: number;
    passed: number;
    avgWaitTime: number;
    queueLength: number;
  }>;
}

export interface SimulationConfig {
  spawnRate: number; // vehicles per second total (1 to 8)
  signalMode: SignalMode;
  freeLeftTurn: boolean;
  timeScale: number; // 1x, 2x, 4x simulation speed
  fixedTimings: {
    green: number; // seconds (default 15)
    amber: number; // seconds (default 3)
    allRed: number; // seconds (default 1.5)
  };
  adaptiveSettings: {
    minGreen: number; // seconds (default 6)
    maxGreen: number; // seconds (default 28)
    amber: number; // seconds (default 3)
    allRed: number; // seconds (default 1.5)
    extensionUnit: number; // seconds per vehicle
  };
  directionDistribution: Record<Direction, number>; // weight 0.0 - 1.0 (default 0.25 each)
  randomSeed?: number;
}

export interface ComparisonRecord {
  timestamp: string;
  spawnRate: number;
  duration: number;
  fixed: {
    carsPassed: number;
    avgWaitTime: number;
    maxQueue: number;
    avgQueue: number;
  };
  adaptive: {
    carsPassed: number;
    avgWaitTime: number;
    maxQueue: number;
    avgQueue: number;
  };
  improvementPct: {
    throughput: number; // % more cars passed
    waitTime: number; // % reduction in waiting time
    queue: number; // % reduction in queue
  };
}
