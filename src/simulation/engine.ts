import {
  Direction,
  MovementType,
  SignalMode,
  SignalPhase,
  SignalState,
  SimulationConfig,
  SimulationStats,
  Vehicle,
} from '../types/simulation';
import { AdaptiveSignalController } from './adaptiveController';
import { CollisionManager } from './collisionManager';
import { QueueManager, STOP_LINE_DISTANCE } from './queueManager';
import { StatisticsManager } from './statistics';
import { TrafficSignalController } from './trafficSignal';
import { createVehicle, drawVehicle } from './vehicle';

export const CANVAS_SIZE = 700;
export const HALF_SIZE = 350;
export const ROAD_WIDTH = 140;
export const HALF_ROAD = 70;
export const LANE_WIDTH = 35; // 2 incoming lanes (70px) + 2 outgoing lanes (70px)

// Lane center offsets for Indian Left-Hand Traffic (LHT):
// Outer lane (lane 0, curbside): 17.5px from curb (leftmost for driver)
// Inner lane (lane 1, centerline): 17.5px from central divider (rightmost for driver)
const LANE_0_OFFSET = 17.5;
const LANE_1_OFFSET = 17.5;

export class SimulationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private vehicles: Vehicle[] = [];
  private signalController: TrafficSignalController;
  private adaptiveController: AdaptiveSignalController;
  private statsManager: StatisticsManager;

  private config: SimulationConfig = {
    spawnRate: 2.0, // vehicles per second total
    signalMode: 'fixed',
    freeLeftTurn: false,
    timeScale: 1.0,
    fixedTimings: { green: 15, amber: 3, allRed: 1.5 },
    adaptiveSettings: {
      minGreen: 6,
      maxGreen: 28,
      amber: 3,
      allRed: 1.5,
      extensionUnit: 1.8,
    },
    directionDistribution: { north: 0.25, south: 0.25, east: 0.25, west: 0.25 },
  };

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private spawnAccumulator: number = 0;
  private seedValue: number = 123456789;
  private useSeededRng: boolean = false;
  private themeMode: 'dark' | 'light' = 'dark';

  // Callback to update React state
  private onStatsUpdate: ((stats: SimulationStats) => void) | null = null;
  private onSignalsUpdate: ((signals: Record<Direction, SignalState>, phase: SignalPhase) => void) | null = null;

  constructor(initialConfig?: Partial<SimulationConfig>, seed?: number) {
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }
    if (seed !== undefined) {
      this.seedValue = seed;
      this.useSeededRng = true;
    }

    this.signalController = new TrafficSignalController({
      fixedTimings: this.config.fixedTimings,
    });
    this.adaptiveController = new AdaptiveSignalController({
      minGreen: this.config.adaptiveSettings.minGreen,
      maxGreen: this.config.adaptiveSettings.maxGreen,
    });
    this.statsManager = new StatisticsManager();
  }

  // Seeded Random Number Generator for reproducible comparisons (Mulberry32)
  private mulberry32(): number {
    let t = (this.seedValue += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private getRandom(): number {
    return this.useSeededRng ? this.mulberry32() : Math.random();
  }

  public setThemeMode(mode: 'dark' | 'light'): void {
    this.themeMode = mode;
  }

  public getThemeMode(): 'dark' | 'light' {
    return this.themeMode;
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
  }

  public resizeCanvas(): void {
    if (!this.canvas) return;
    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    this.canvas.width = CANVAS_SIZE * dpr;
    this.canvas.height = CANVAS_SIZE * dpr;
  }

  public setCallbacks(
    onStats: (stats: SimulationStats) => void,
    onSignals: (signals: Record<Direction, SignalState>, phase: SignalPhase) => void
  ): void {
    this.onStatsUpdate = onStats;
    this.onSignalsUpdate = onSignals;
  }

  public updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setSignalMode(mode: SignalMode): void {
    this.config.signalMode = mode;
  }

  public setSpawnRate(rate: number): void {
    this.config.spawnRate = rate;
  }

  public setFreeLeftTurn(enabled: boolean): void {
    this.config.freeLeftTurn = enabled;
  }

  public setTimeScale(scale: number): void {
    this.config.timeScale = scale;
  }

  public getStats(): SimulationStats {
    const inFlightWait = this.getInFlightWaitTimes();
    return this.statsManager.getSnapshot(this.vehicles.length, inFlightWait);
  }

  public getSignals(): Record<Direction, SignalState> {
    return {
      north: this.signalController.getSignalState('north'),
      south: this.signalController.getSignalState('south'),
      east: this.signalController.getSignalState('east'),
      west: this.signalController.getSignalState('west'),
    };
  }

  public getAdaptiveLog() {
    return this.adaptiveController.getLastDecision();
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public start(): void {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public pause(): void {
    this.isPaused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public reset(): void {
    this.pause();
    this.isRunning = false;
    this.vehicles = [];
    this.signalController.reset();
    this.adaptiveController.reset();
    this.statsManager.reset();
    this.spawnAccumulator = 0;
    if (this.useSeededRng) {
      this.seedValue = 123456789;
    }

    if (this.ctx && this.canvas) {
      this.render(performance.now());
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.statsManager.getSnapshot(0));
    }
    if (this.onSignalsUpdate) {
      this.onSignalsUpdate(this.getSignals(), this.signalController.getPhase());
    }
  }

  /**
   * Spawns an emergency 108 ambulance in designated direction
   */
  public spawnEmergencyVehicle(direction: Direction = 'south'): void {
    const laneIndex = QueueManager.canSpawnInLane(this.vehicles, direction, 1) ? 1 : 0;
    const vehicle = createVehicle(direction, laneIndex, 'straight', 'emergency', () => this.getRandom());
    this.vehicles.push(vehicle);

    // Request green corridor from signal controller
    this.signalController.triggerEmergencyCorridor(direction);
  }

  /**
   * Spawn regular traffic based on rate and direction distribution
   */
  private trySpawnVehicles(dt: number): void {
    this.spawnAccumulator += dt * this.config.spawnRate;

    while (this.spawnAccumulator >= 1.0) {
      this.spawnAccumulator -= 1.0;

      const roll = this.getRandom();
      let cumulative = 0;
      let selectedDirection: Direction = 'north';
      const directions: Direction[] = ['north', 'south', 'east', 'west'];

      for (const dir of directions) {
        cumulative += this.config.directionDistribution[dir];
        if (roll <= cumulative) {
          selectedDirection = dir;
          break;
        }
      }

      // Free Left Turn: outer lane vehicles can turn left smoothly
      const isLeftTurn = this.config.freeLeftTurn && this.getRandom() < 0.35;
      const movement: MovementType = isLeftTurn ? 'left' : 'straight';
      // When Free Left Turn is enabled: Lane 0 is dedicated to left turns!
      // Straight vehicles take Lane 1 to keep the slip road 100% open and unblocked.
      const laneIndex = this.config.freeLeftTurn
        ? (isLeftTurn ? 0 : 1)
        : (isLeftTurn ? 0 : (this.getRandom() < 0.5 ? 0 : 1));

      // Verify lane clearance
      if (QueueManager.canSpawnInLane(this.vehicles, selectedDirection, laneIndex)) {
        const vehicle = createVehicle(selectedDirection, laneIndex, movement, undefined, () => this.getRandom());
        this.vehicles.push(vehicle);
      }
    }
  }

  private getInFlightWaitTimes(): Record<Direction, number> {
    const inFlightWait: Record<Direction, number> = { north: 0, south: 0, east: 0, west: 0 };
    for (const v of this.vehicles) {
      inFlightWait[v.origin] += v.timeSpentWaiting;
    }
    return inFlightWait;
  }

  /**
   * Fixed-timestep physics update
   */
  public updatePhysics(dt: number): void {
    const scaledDt = dt * this.config.timeScale;

    // 1. Spawning
    this.trySpawnVehicles(scaledDt);

    // 2. Measure current queues
    const currentQueues = QueueManager.calculateQueueLengths(this.vehicles);

    // 3. Adaptive Signal Controller Logic
    let nextGreenDuration: number | undefined = undefined;
    if (this.config.signalMode === 'adaptive') {
      const currentPhase = this.signalController.getPhase();
      const phaseElapsed = this.signalController.getPhaseElapsed();

      // Check for early gap-out if current active green has cleared
      const activeQueues = currentPhase === 'NS_GREEN'
        ? (currentQueues.north + currentQueues.south)
        : (currentQueues.east + currentQueues.west);
      const opposingQueues = currentPhase === 'NS_GREEN'
        ? (currentQueues.east + currentQueues.west)
        : (currentQueues.north + currentQueues.south);

      if (this.adaptiveController.shouldTerminateEarly(currentPhase, phaseElapsed, activeQueues, opposingQueues)) {
        this.signalController.forceNextPhase();
      }

      // If in all-red clearance, compute next green duration for the incoming phase
      if (currentPhase === 'ALL_RED_1') {
        nextGreenDuration = this.adaptiveController.computePhaseDuration('EW_GREEN', currentQueues);
      } else if (currentPhase === 'ALL_RED_2') {
        nextGreenDuration = this.adaptiveController.computePhaseDuration('NS_GREEN', currentQueues);
      }
    }

    // 4. Update Traffic Signals
    this.signalController.update(scaledDt, nextGreenDuration);

    // 5. Group vehicles by lane for leader-follower tracking
    const laneMap = QueueManager.groupVehiclesByLane(this.vehicles);

    // 6. Update vehicle physics, collision avoidance, and coordinates
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.totalTime += scaledDt;

      if (v.speed < 0.25 && !v.hasCrossedStopLine) {
        v.timeSpentWaiting += scaledDt;
      }

      // Find leader in the same lane
      const laneKey = `${v.origin}_${v.laneIndex}`;
      const laneVehicles = laneMap.get(laneKey) || [];
      const vIdx = laneVehicles.indexOf(v);
      const leader = vIdx > 0 ? laneVehicles[vIdx - 1] : null;

      const signal = this.signalController.getSignalState(v.origin);

      // Local spatial check: only yield if an active cross-traffic vehicle is physically in the merge exit
      let hasMergeConflict = false;
      if (v.movement === 'left' && v.distanceAlongPath >= 310 && v.distanceAlongPath <= 375) {
        for (const other of this.vehicles) {
          if (other === v || other.origin === v.origin) continue;
          const distSq = (other.x - v.x) * (other.x - v.x) + (other.y - v.y) * (other.y - v.y);
          if (distSq < 35 * 35 && other.hasCrossedStopLine) {
            hasMergeConflict = true;
            break;
          }
        }
      }

      CollisionManager.updateVehiclePhysics(
        v,
        leader,
        signal,
        this.config.freeLeftTurn,
        hasMergeConflict
      );

      // Compute actual (x, y, angle) coordinates based on distanceAlongPath
      this.computeVehicleCoordinates(v);

      // Check if emergency vehicle has crossed intersection and cleared
      if (v.isEmergency && v.hasCrossedStopLine && v.distanceAlongPath > STOP_LINE_DISTANCE + ROAD_WIDTH + 30) {
        this.signalController.clearEmergencyCorridor();
      }

      // Check if vehicle has completely exited the canvas
      if (v.distanceAlongPath > CANVAS_SIZE) {
        v.state = 'exited';
        this.statsManager.recordVehicleExit(v.origin, v.timeSpentWaiting);
        this.vehicles.splice(i, 1);
      }
    }

    // 7. Update statistics
    const inFlightWait = this.getInFlightWaitTimes();
    this.statsManager.updateTick(scaledDt, currentQueues, this.vehicles.length, inFlightWait);
  }

  /**
   * Computes (x, y) coordinates and heading angle for any vehicle on the canvas
   * strictly adhering to Indian Left-Hand Driving (LHT) rules.
   */
  private computeVehicleCoordinates(v: Vehicle): void {
    const d = v.distanceAlongPath;

    if (v.movement === 'left') {
      // Indian Free Left Turn Slip Curve
      this.computeLeftTurnCoordinates(v, d);
      return;
    }

    // Straight path calculations (Indian Left-Hand Driving)
    switch (v.origin) {
      case 'north': {
        // Enters from top (y=0) heading South (down)
        // In Left-Hand Traffic, driver heading South drives on the EAST half: x in [350, 420]
        // Lane 0 (outer, curbside, nearest to East curb x=420): 420 - 17.5 = 402.5
        // Lane 1 (inner, centerline, nearest to median x=350): 350 + 17.5 = 367.5
        const laneX = v.laneIndex === 0
          ? HALF_SIZE + HALF_ROAD - LANE_0_OFFSET // 402.5 (curbside)
          : HALF_SIZE + LANE_1_OFFSET;            // 367.5 (median)
        v.x = laneX;
        v.y = d;
        v.angle = Math.PI / 2; // facing down
        break;
      }
      case 'south': {
        // Enters from bottom (y=700) heading North (up)
        // In Left-Hand Traffic, driver heading North drives on the WEST half: x in [280, 350]
        // Lane 0 (outer, curbside, nearest to West curb x=280): 280 + 17.5 = 297.5
        // Lane 1 (inner, centerline, nearest to median x=350): 350 - 17.5 = 332.5
        const laneX = v.laneIndex === 0
          ? HALF_SIZE - HALF_ROAD + LANE_0_OFFSET // 297.5 (curbside)
          : HALF_SIZE - LANE_1_OFFSET;            // 332.5 (median)
        v.x = laneX;
        v.y = CANVAS_SIZE - d;
        v.angle = -Math.PI / 2; // facing up
        break;
      }
      case 'west': {
        // Enters from left (x=0) heading East (right)
        // In Left-Hand Traffic, driver heading East drives on the NORTH half: y in [280, 350]
        // Lane 0 (outer, curbside, nearest to North curb y=280): 280 + 17.5 = 297.5
        // Lane 1 (inner, centerline, nearest to median y=350): 350 - 17.5 = 332.5
        const laneY = v.laneIndex === 0
          ? HALF_SIZE - HALF_ROAD + LANE_0_OFFSET // 297.5 (curbside)
          : HALF_SIZE - LANE_1_OFFSET;            // 332.5 (median)
        v.x = d;
        v.y = laneY;
        v.angle = 0; // facing right
        break;
      }
      case 'east': {
        // Enters from right (x=700) heading West (left)
        // In Left-Hand Traffic, driver heading West drives on the SOUTH half: y in [350, 420]
        // Lane 0 (outer, curbside, nearest to South curb y=420): 420 - 17.5 = 402.5
        // Lane 1 (inner, centerline, nearest to median y=350): 350 + 17.5 = 367.5
        const laneY = v.laneIndex === 0
          ? HALF_SIZE + HALF_ROAD - LANE_0_OFFSET // 402.5 (curbside)
          : HALF_SIZE + LANE_1_OFFSET;            // 367.5 (median)
        v.x = CANVAS_SIZE - d;
        v.y = laneY;
        v.angle = Math.PI; // facing left
        break;
      }
    }
  }

  /**
   * Smooth 90-degree left-turn slip curve for authentic Indian Left-Hand Driving.
   * In India, a Left Turn is the near-side turn along the curb and never cuts across oncoming traffic!
   */
  private computeLeftTurnCoordinates(v: Vehicle, d: number): void {
    const turnStart = STOP_LINE_DISTANCE - 25; // 245
    const turnEnd = STOP_LINE_DISTANCE + HALF_ROAD + 25; // 365
    const curveLength = turnEnd - turnStart;

    if (d < turnStart) {
      // Straight approach before slip curve
      switch (v.origin) {
        case 'north':
          v.x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          v.y = d;
          v.angle = Math.PI / 2;
          break;
        case 'south':
          v.x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          v.y = CANVAS_SIZE - d;
          v.angle = -Math.PI / 2;
          break;
        case 'west':
          v.x = d;
          v.y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          v.angle = 0;
          break;
        case 'east':
          v.x = CANVAS_SIZE - d;
          v.y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          v.angle = Math.PI;
          break;
      }
    } else if (d <= turnEnd) {
      const t = (d - turnStart) / curveLength; // 0.0 to 1.0

      switch (v.origin) {
        case 'north': {
          // North heading South, turns LEFT into Eastbound road (along North half: y = 297.5)
          // Top-Right quadrant: curves from (402.5, 245) to (485, 297.5)
          const p0x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p0y = turnStart;                              // 245
          const p1x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p1y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p2x = HALF_SIZE + HALF_ROAD + (turnEnd - STOP_LINE_DISTANCE); // 485
          const p2y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5

          v.x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          v.y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
          v.angle = (Math.PI / 2) - t * (Math.PI / 2); // pi/2 (down) -> 0 (right)
          break;
        }
        case 'south': {
          // South heading North, turns LEFT into Westbound road (along South half: y = 402.5)
          // Bottom-Left quadrant: curves from (297.5, 455) to (215, 402.5)
          const p0x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p0y = CANVAS_SIZE - turnStart;               // 455
          const p1x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p1y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p2x = HALF_SIZE - HALF_ROAD - (turnEnd - STOP_LINE_DISTANCE); // 215
          const p2y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5

          v.x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          v.y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
          v.angle = (-Math.PI / 2) - t * (Math.PI / 2); // -pi/2 (up) -> -pi (left)
          break;
        }
        case 'west': {
          // West heading East, turns LEFT into Northbound road (along West half: x = 297.5)
          // Top-Left quadrant: curves from (245, 297.5) to (297.5, 215)
          const p0x = turnStart;                              // 245
          const p0y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p1x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p1y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p2x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          const p2y = HALF_SIZE - HALF_ROAD - (turnEnd - STOP_LINE_DISTANCE); // 215

          v.x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          v.y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
          v.angle = 0 - t * (Math.PI / 2); // 0 (right) -> -pi/2 (up)
          break;
        }
        case 'east': {
          // East heading West, turns LEFT into Southbound road (along East half: x = 402.5)
          // Bottom-Right quadrant: curves from (455, 402.5) to (402.5, 485)
          const p0x = CANVAS_SIZE - turnStart;               // 455
          const p0y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p1x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p1y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p2x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          const p2y = HALF_SIZE + HALF_ROAD + (turnEnd - STOP_LINE_DISTANCE); // 485

          v.x = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          v.y = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
          v.angle = Math.PI - t * (Math.PI / 2); // pi (left) -> pi/2 (down)
          break;
        }
      }
    } else {
      // Proceed along receiving road
      const distPastCurve = d - turnEnd;
      switch (v.origin) {
        case 'north':
          v.x = (HALF_SIZE + HALF_ROAD + (turnEnd - STOP_LINE_DISTANCE)) + distPastCurve;
          v.y = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5 (heading east)
          v.angle = 0;
          break;
        case 'south':
          v.x = (HALF_SIZE - HALF_ROAD - (turnEnd - STOP_LINE_DISTANCE)) - distPastCurve;
          v.y = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5 (heading west)
          v.angle = Math.PI;
          break;
        case 'west':
          v.x = HALF_SIZE - HALF_ROAD + LANE_0_OFFSET; // 297.5
          v.y = (HALF_SIZE - HALF_ROAD - (turnEnd - STOP_LINE_DISTANCE)) - distPastCurve; // heading north
          v.angle = -Math.PI / 2;
          break;
        case 'east':
          v.x = HALF_SIZE + HALF_ROAD - LANE_0_OFFSET; // 402.5
          v.y = (HALF_SIZE + HALF_ROAD + (turnEnd - STOP_LINE_DISTANCE)) + distPastCurve; // heading south
          v.angle = Math.PI / 2;
          break;
      }
    }
  }

  /**
   * Main simulation render loop
   */
  private loop = (timestamp: number): void => {
    if (!this.isRunning || this.isPaused) return;

    const elapsedMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    const dt = Math.min(0.1, elapsedMs / 1000);

    this.updatePhysics(dt);

    if (this.ctx && this.canvas) {
      this.render(timestamp);
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getStats());
    }
    if (this.onSignalsUpdate) {
      this.onSignalsUpdate(this.getSignals(), this.signalController.getPhase());
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Render the 4-way intersection, authentic Indian road elements:
   * - Left-Hand Traffic (LHT) alignment
   * - Realistic asphalt depth with ambient curb edge shadows
   * - Central Concrete Medians with 3D bevels & IRC Yellow-Black Kerb Striping
   * - Painted IRC Directional Stencil Arrows on asphalt lanes
   * - 3D Cantilever Signal Gantries with Sun Visors, Active Lens Glow, Downward Road Light
   * - Indian Zebra Crossings & Yellow Box Anti-Gridlock
   * - Corner Triangular Slip Islands for Free Left Turn
   * - Seamless adaptation to Dark (Asphalt Noir) and Light Themes
   */
  public render(timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const isDark = this.themeMode === 'dark';

    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Surrounding Terrain Ground / City Blocks
    const groundColor = isDark ? '#141010' : '#D1D9E2';
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Asphalt Road Surfaces
    const asphaltColor = isDark ? '#1C1919' : '#2B3441';
    ctx.fillStyle = asphaltColor;
    // Vertical Road (x: 280 to 420)
    ctx.fillRect(HALF_SIZE - HALF_ROAD, 0, ROAD_WIDTH, CANVAS_SIZE);
    // Horizontal Road (y: 280 to 420)
    ctx.fillRect(0, HALF_SIZE - HALF_ROAD, CANVAS_SIZE, ROAD_WIDTH);

    // 3. Ambient Curb Edge Shadows (Road Depth Effect)
    this.drawAsphaltEdgeShadows(ctx, isDark);

    // 4. Downward Road Illumination from Signals
    this.drawRoadSignalReflections(ctx);

    // 5. Indian Central Intersection: Yellow Box Junction Marking (Anti-Gridlock)
    this.drawYellowBoxJunction(ctx, isDark);

    // 6. Outer Curbs / Footpaths
    const curbStroke = isDark ? '#413939' : '#94A3B8';
    ctx.strokeStyle = curbStroke;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(0, 0, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(HALF_SIZE + HALF_ROAD, 0, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(0, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(HALF_SIZE + HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);

    // 7. Authentic Indian Raised Concrete Medians with Yellow & Black Kerb Striping (IRC Standard)
    this.drawIndianMedians(ctx, isDark);

    // 8. Dashed Lane Divider Markings
    this.drawLaneDividers(ctx, isDark);

    // 9. Painted IRC Lane Directional Stencil Arrows
    this.drawLaneArrows(ctx, isDark);

    // 10. Stop Lines for Incoming Traffic (LHT Alignment)
    this.drawStopLine(ctx, HALF_SIZE, HALF_SIZE - HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, 'north');
    this.drawStopLine(ctx, HALF_SIZE - HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE, HALF_SIZE + HALF_ROAD, 'south');
    this.drawStopLine(ctx, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE, 'west');
    this.drawStopLine(ctx, HALF_SIZE + HALF_ROAD, HALF_SIZE, HALF_SIZE + HALF_ROAD, HALF_SIZE + HALF_ROAD, 'east');

    // 11. Zebra Crosswalks
    this.drawIndianCrosswalks(ctx, isDark);

    // 12. Free Left Turn Channelizer Islands & Guides
    this.drawFreeLeftTurnIslands(ctx, isDark);

    // 13. Direction Badges & Queue Counters
    this.drawIndianDirectionBadges(ctx, isDark);

    // 14. Render Vehicles with Multi-pass Shadows & Physics Silhouettes
    for (const v of this.vehicles) {
      drawVehicle(ctx, v, timestamp, isDark);
    }

    // 15. Render 3D Cantilever Signal Gantries with Sun Visors & Lens Glow
    this.drawIndianSignalHeads(ctx, isDark);

    ctx.restore();
  }

  /**
   * Ambient Occlusion shadows along curb edges to give real physical asphalt depth
   */
  private drawAsphaltEdgeShadows(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    ctx.save();
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.20)';

    // Vertical road curb shadows
    // Left edge (x = 280)
    let grad = ctx.createLinearGradient(HALF_SIZE - HALF_ROAD, 0, HALF_SIZE - HALF_ROAD + 6, 0);
    grad.addColorStop(0, shadowColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(HALF_SIZE - HALF_ROAD, 0, 6, HALF_SIZE - HALF_ROAD);
    ctx.fillRect(HALF_SIZE - HALF_ROAD, HALF_SIZE + HALF_ROAD, 6, HALF_SIZE - HALF_ROAD);

    // Right edge (x = 420)
    grad = ctx.createLinearGradient(HALF_SIZE + HALF_ROAD, 0, HALF_SIZE + HALF_ROAD - 6, 0);
    grad.addColorStop(0, shadowColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(HALF_SIZE + HALF_ROAD - 6, 0, 6, HALF_SIZE - HALF_ROAD);
    ctx.fillRect(HALF_SIZE + HALF_ROAD - 6, HALF_SIZE + HALF_ROAD, 6, HALF_SIZE - HALF_ROAD);

    // Horizontal road curb shadows
    // Top edge (y = 280)
    grad = ctx.createLinearGradient(0, HALF_SIZE - HALF_ROAD, 0, HALF_SIZE - HALF_ROAD + 6);
    grad.addColorStop(0, shadowColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, 6);
    ctx.fillRect(HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, 6);

    // Bottom edge (y = 420)
    grad = ctx.createLinearGradient(0, HALF_SIZE + HALF_ROAD, 0, HALF_SIZE + HALF_ROAD - 6);
    grad.addColorStop(0, shadowColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, HALF_SIZE + HALF_ROAD - 6, HALF_SIZE - HALF_ROAD, 6);
    ctx.fillRect(HALF_SIZE + HALF_ROAD, HALF_SIZE + HALF_ROAD - 6, HALF_SIZE - HALF_ROAD, 6);

    ctx.restore();
  }

  /**
   * Dynamic downward colored illumination from signals onto stop line asphalt
   */
  private drawRoadSignalReflections(ctx: CanvasRenderingContext2D): void {
    const stops: Record<Direction, { x: number; y: number; rx: number; ry: number }> = {
      north: { x: HALF_SIZE + 35, y: HALF_SIZE - HALF_ROAD + 14, rx: 32, ry: 18 },
      south: { x: HALF_SIZE - 35, y: HALF_SIZE + HALF_ROAD - 14, rx: 32, ry: 18 },
      west: { x: HALF_SIZE - HALF_ROAD + 14, y: HALF_SIZE - 35, rx: 18, ry: 32 },
      east: { x: HALF_SIZE + HALF_ROAD - 14, y: HALF_SIZE + 35, rx: 18, ry: 32 },
    };

    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    for (const d of dirs) {
      const state = this.signalController.getSignalState(d);
      const pos = stops[d];
      const rgb = state.color === 'green' ? '54, 217, 138' : (state.color === 'amber' ? '255, 189, 89' : '255, 98, 104');
      const grad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, Math.max(pos.rx, pos.ry));
      grad.addColorStop(0, `rgba(${rgb}, 0.22)`);
      grad.addColorStop(0.6, `rgba(${rgb}, 0.08)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, pos.rx, pos.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Yellow Box Junction Marking (Anti-Gridlock diagonal grid)
   */
  private drawYellowBoxJunction(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, ROAD_WIDTH, ROAD_WIDTH);
    ctx.clip();

    ctx.strokeStyle = isDark ? 'rgba(255, 189, 89, 0.22)' : 'rgba(217, 119, 6, 0.28)';
    ctx.lineWidth = 2;
    for (let pos = -ROAD_WIDTH; pos <= ROAD_WIDTH * 2; pos += 16) {
      ctx.beginPath();
      ctx.moveTo(HALF_SIZE - HALF_ROAD + pos, HALF_SIZE - HALF_ROAD);
      ctx.lineTo(HALF_SIZE - HALF_ROAD + pos + ROAD_WIDTH, HALF_SIZE + HALF_ROAD);
      ctx.stroke();
    }

    // Outer perimeter boundary of yellow box
    ctx.strokeStyle = isDark ? 'rgba(255, 189, 89, 0.40)' : 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(HALF_SIZE - HALF_ROAD + 1, HALF_SIZE - HALF_ROAD + 1, ROAD_WIDTH - 2, ROAD_WIDTH - 2);

    ctx.restore();
  }

  /**
   * Draw Indian IRC-Standard Raised Concrete Medians with 3D Bevels & Yellow-Black Kerb Markings
   */
  private drawIndianMedians(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    const stripeLen = 14;
    const medianWidth = 7;
    const halfMed = medianWidth / 2;
    const darkKerb = isDark ? '#1C1919' : '#242020';
    const yellowKerb = isDark ? '#B59447' : '#D97706';

    const drawSection = (x1: number, y1: number, x2: number, y2: number, isVertical: boolean) => {
      ctx.save();
      // Drop Shadow for 3D elevation
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.22)';
      if (isVertical) {
        ctx.fillRect(x1 - halfMed + 1.5, y1 + 1.5, medianWidth, y2 - y1);
      } else {
        ctx.fillRect(x1 + 1.5, y1 - halfMed + 1.5, x2 - x1, medianWidth);
      }

      // Alternating Striped Segments
      const totalLen = isVertical ? y2 - y1 : x2 - x1;
      for (let p = 0; p < totalLen; p += stripeLen) {
        const isYellow = Math.floor(p / stripeLen) % 2 === 0;
        ctx.fillStyle = isYellow ? yellowKerb : darkKerb;
        const curLen = Math.min(stripeLen, totalLen - p);
        if (isVertical) {
          ctx.fillRect(x1 - halfMed, y1 + p, medianWidth, curLen);
        } else {
          ctx.fillRect(x1 + p, y1 - halfMed, curLen, medianWidth);
        }
      }

      // Top bevel highlight line (simulating sunlight from top-left)
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (isVertical) {
        ctx.moveTo(x1 - halfMed, y1);
        ctx.lineTo(x1 - halfMed, y2);
      } else {
        ctx.moveTo(x1, y1 - halfMed);
        ctx.lineTo(x2, y1 - halfMed);
      }
      ctx.stroke();

      ctx.restore();
    };

    // A) North Median (from y=0 to y=258 along x=350)
    drawSection(HALF_SIZE, 0, HALF_SIZE, HALF_SIZE - HALF_ROAD - 22, true);

    // B) South Median (from y=442 to y=700 along x=350)
    drawSection(HALF_SIZE, HALF_SIZE + HALF_ROAD + 22, HALF_SIZE, CANVAS_SIZE, true);

    // C) West Median (from x=0 to x=258 along y=350)
    drawSection(0, HALF_SIZE, HALF_SIZE - HALF_ROAD - 22, HALF_SIZE, false);

    // D) East Median (from x=442 to x=700 along y=350)
    drawSection(HALF_SIZE + HALF_ROAD + 22, HALF_SIZE, CANVAS_SIZE, HALF_SIZE, false);
  }

  private drawLaneDividers(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(242, 238, 238, 0.40)' : 'rgba(255, 255, 255, 0.60)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 10]);

    // Vertical Road Lane Dividers
    ctx.beginPath();
    ctx.moveTo(HALF_SIZE - LANE_WIDTH, 0);
    ctx.lineTo(HALF_SIZE - LANE_WIDTH, HALF_SIZE - HALF_ROAD);
    ctx.moveTo(HALF_SIZE + LANE_WIDTH, 0);
    ctx.lineTo(HALF_SIZE + LANE_WIDTH, HALF_SIZE - HALF_ROAD);

    ctx.moveTo(HALF_SIZE - LANE_WIDTH, HALF_SIZE + HALF_ROAD);
    ctx.lineTo(HALF_SIZE - LANE_WIDTH, CANVAS_SIZE);
    ctx.moveTo(HALF_SIZE + LANE_WIDTH, HALF_SIZE + HALF_ROAD);
    ctx.lineTo(HALF_SIZE + LANE_WIDTH, CANVAS_SIZE);
    ctx.stroke();

    // Horizontal Road Lane Dividers
    ctx.beginPath();
    ctx.moveTo(0, HALF_SIZE - LANE_WIDTH);
    ctx.lineTo(HALF_SIZE - HALF_ROAD, HALF_SIZE - LANE_WIDTH);
    ctx.moveTo(0, HALF_SIZE + LANE_WIDTH);
    ctx.lineTo(HALF_SIZE - HALF_ROAD, HALF_SIZE + LANE_WIDTH);

    ctx.moveTo(HALF_SIZE + HALF_ROAD, HALF_SIZE - LANE_WIDTH);
    ctx.lineTo(CANVAS_SIZE, HALF_SIZE - LANE_WIDTH);
    ctx.moveTo(HALF_SIZE + HALF_ROAD, HALF_SIZE + LANE_WIDTH);
    ctx.lineTo(CANVAS_SIZE, HALF_SIZE + LANE_WIDTH);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Painted IRC Lane Directional Stencil Arrows on Asphalt
   */
  private drawLaneArrows(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    const arrowColor = isDark ? 'rgba(242, 238, 238, 0.38)' : 'rgba(255, 255, 255, 0.62)';

    // Stencil arrow renderer
    const drawArrow = (x: number, y: number, angle: number, isCurbside: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = arrowColor;
      ctx.strokeStyle = arrowColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Straight shaft
      ctx.fillRect(-1.5, -8, 3, 16);
      // Straight arrowhead
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-4.5, -7);
      ctx.lineTo(4.5, -7);
      ctx.closePath();
      ctx.fill();

      // Branch arrow (Left turn for curbside, Right turn for centerline)
      if (isCurbside) {
        // Left turn curved branch
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.quadraticCurveTo(-6, 2, -9, -4);
        ctx.stroke();
        // Left arrowhead
        ctx.beginPath();
        ctx.moveTo(-13, -5);
        ctx.lineTo(-7, -2);
        ctx.lineTo(-7, -8);
        ctx.closePath();
        ctx.fill();
      } else {
        // Right turn curved branch
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.quadraticCurveTo(6, 2, 9, -4);
        ctx.stroke();
        // Right arrowhead
        ctx.beginPath();
        ctx.moveTo(13, -5);
        ctx.lineTo(7, -2);
        ctx.lineTo(7, -8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    // North Approach (East half, heading south: angle = Math.PI)
    drawArrow(HALF_SIZE + HALF_ROAD - LANE_0_OFFSET, 160, Math.PI, true);  // Lane 0: Straight + Left
    drawArrow(HALF_SIZE + LANE_1_OFFSET, 160, Math.PI, false);             // Lane 1: Straight + Right

    // South Approach (West half, heading north: angle = 0)
    drawArrow(HALF_SIZE - HALF_ROAD + LANE_0_OFFSET, 540, 0, true);        // Lane 0: Straight + Left
    drawArrow(HALF_SIZE - LANE_1_OFFSET, 540, 0, false);                   // Lane 1: Straight + Right

    // West Approach (North half, heading east: angle = Math.PI / 2)
    drawArrow(160, HALF_SIZE - HALF_ROAD + LANE_0_OFFSET, Math.PI / 2, true); // Lane 0
    drawArrow(160, HALF_SIZE - LANE_1_OFFSET, Math.PI / 2, false);            // Lane 1

    // East Approach (South half, heading west: angle = -Math.PI / 2)
    drawArrow(540, HALF_SIZE + HALF_ROAD - LANE_0_OFFSET, -Math.PI / 2, true); // Lane 0
    drawArrow(540, HALF_SIZE + LANE_1_OFFSET, -Math.PI / 2, false);            // Lane 1
  }

  private drawStopLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    direction: Direction
  ): void {
    const signal = this.signalController.getSignalState(direction);
    ctx.save();
    ctx.strokeStyle = signal.color === 'green' ? '#36D98A' : (signal.color === 'amber' ? '#FFBD59' : '#F2EEEE');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private drawIndianCrosswalks(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(242, 238, 238, 0.32)' : 'rgba(255, 255, 255, 0.60)';
    const stripeWidth = 6;
    const stripeGap = 6;

    // North crosswalk
    for (let x = HALF_SIZE - HALF_ROAD + 4; x < HALF_SIZE + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
      ctx.fillRect(x, HALF_SIZE - HALF_ROAD - 14, stripeWidth, 10);
    }
    // South crosswalk
    for (let x = HALF_SIZE - HALF_ROAD + 4; x < HALF_SIZE + HALF_ROAD - 4; x += stripeWidth + stripeGap) {
      ctx.fillRect(x, HALF_SIZE + HALF_ROAD + 4, stripeWidth, 10);
    }
    // West crosswalk
    for (let y = HALF_SIZE - HALF_ROAD + 4; y < HALF_SIZE + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
      ctx.fillRect(HALF_SIZE - HALF_ROAD - 14, y, 10, stripeWidth);
    }
    // East crosswalk
    for (let y = HALF_SIZE - HALF_ROAD + 4; y < HALF_SIZE + HALF_ROAD - 4; y += stripeWidth + stripeGap) {
      ctx.fillRect(HALF_SIZE + HALF_ROAD + 4, y, 10, stripeWidth);
    }
    ctx.restore();
  }

  /**
   * Corner Triangular Channelizer Islands for Free Left Turn
   */
  private drawFreeLeftTurnIslands(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    ctx.save();

    // Subtle slip path dashed lines if Free Left Turn is enabled
    if (this.config.freeLeftTurn) {
      ctx.strokeStyle = isDark ? 'rgba(198, 243, 107, 0.65)' : 'rgba(101, 163, 13, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Top-Right: North left turn to East
      ctx.beginPath();
      ctx.arc(HALF_SIZE + HALF_ROAD + 15, HALF_SIZE - HALF_ROAD - 15, 65, Math.PI, Math.PI * 0.5, true);
      ctx.stroke();

      // Bottom-Left: South left turn to West
      ctx.beginPath();
      ctx.arc(HALF_SIZE - HALF_ROAD - 15, HALF_SIZE + HALF_ROAD + 15, 65, 0, Math.PI * 1.5, true);
      ctx.stroke();

      // Top-Left: West left turn to North
      ctx.beginPath();
      ctx.arc(HALF_SIZE - HALF_ROAD - 15, HALF_SIZE - HALF_ROAD - 15, 65, Math.PI * 0.5, 0, true);
      ctx.stroke();

      // Bottom-Right: East left turn to South
      ctx.beginPath();
      ctx.arc(HALF_SIZE + HALF_ROAD + 15, HALF_SIZE + HALF_ROAD + 15, 65, Math.PI * 1.5, Math.PI, true);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Triangular Corner Islands with Yellow/Black Kerb edges
    const drawIsland = (px: number, py: number, r: number) => {
      // Drop Shadow
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.arc(px + 1.5, py + 1.5, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#1C1919' : '#E2E8F0';
      ctx.strokeStyle = isDark ? '#B59447' : '#0284C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    drawIsland(HALF_SIZE - HALF_ROAD - 12, HALF_SIZE - HALF_ROAD - 12, 10);
    drawIsland(HALF_SIZE + HALF_ROAD + 12, HALF_SIZE - HALF_ROAD - 12, 10);
    drawIsland(HALF_SIZE - HALF_ROAD - 12, HALF_SIZE + HALF_ROAD + 12, 10);
    drawIsland(HALF_SIZE + HALF_ROAD + 12, HALF_SIZE + HALF_ROAD + 12, 10);

    ctx.restore();
  }

  private drawIndianDirectionBadges(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    const queues = QueueManager.calculateQueueLengths(this.vehicles);

    // Positions matching Indian LHT incoming sides
    const positions: Record<Direction, { x: number; y: number; label: string }> = {
      north: { x: HALF_SIZE + 35, y: 35, label: 'NORTH' }, // East half (x=385)
      south: { x: HALF_SIZE - 35, y: CANVAS_SIZE - 35, label: 'SOUTH' }, // West half (x=315)
      west: { x: 35, y: HALF_SIZE - 35, label: 'WEST' }, // North half (y=315)
      east: { x: CANVAS_SIZE - 35, y: HALF_SIZE + 35, label: 'EAST' }, // South half (y=385)
    };

    ctx.save();
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    for (const d of dirs) {
      const pos = positions[d];
      const q = queues[d];

      // Badge Card
      ctx.fillStyle = isDark ? '#242020' : '#E4EAF0';
      ctx.strokeStyle = q > 6 ? '#DC2626' : (q > 3 ? '#FFBD59' : (isDark ? '#413939' : '#B0BCC9'));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pos.x - 38, pos.y - 12, 76, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Text with queue
      ctx.fillStyle = isDark ? '#F2EEEE' : '#0B1120';
      ctx.fillText(`${pos.label}: ${q}`, pos.x, pos.y);
    }
    ctx.restore();
  }

  private drawIndianSignalHeads(ctx: CanvasRenderingContext2D, isDark: boolean): void {
    const dirs: Direction[] = ['north', 'south', 'east', 'west'];

    // Signal head positions placed on driver's side curb in Indian Left-Hand Traffic:
    // North incoming is on East half -> Signal is on East curb (x=444, y=262)
    // South incoming is on West half -> Signal is on West curb (x=256, y=438)
    // West incoming is on North half -> Signal is on North curb (x=262, y=256)
    // East incoming is on South half -> Signal is on South curb (x=438, y=444)
    const coords: Record<Direction, { x: number; y: number; gantryAngle: number }> = {
      north: { x: HALF_SIZE + HALF_ROAD + 24, y: HALF_SIZE - HALF_ROAD - 18, gantryAngle: Math.PI },
      south: { x: HALF_SIZE - HALF_ROAD - 24, y: HALF_SIZE + HALF_ROAD + 18, gantryAngle: 0 },
      west: { x: HALF_SIZE - HALF_ROAD - 18, y: HALF_SIZE - HALF_ROAD - 24, gantryAngle: Math.PI / 2 },
      east: { x: HALF_SIZE + HALF_ROAD + 18, y: HALF_SIZE + HALF_ROAD + 24, gantryAngle: -Math.PI / 2 },
    };

    for (const d of dirs) {
      const state = this.signalController.getSignalState(d);
      const pos = coords[d];
      this.drawSingleSignalHead(ctx, pos.x, pos.y, state, pos.gantryAngle, isDark);
    }
  }

  /**
   * 3D Cantilever Signal Gantry with Sun Visors, Active Lens Glow & Tabular Countdown
   */
  private drawSingleSignalHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: SignalState,
    gantryAngle: number,
    isDark: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. Cantilever Gantry Arm & Mounting Pole
    ctx.save();
    ctx.rotate(gantryAngle);
    // Base mounting flange on curb
    ctx.fillStyle = isDark ? '#413939' : '#8C827A';
    ctx.fillRect(-3, -3, 6, 6);
    // Cantilever horizontal truss arm extending toward the roadway
    ctx.strokeStyle = isDark ? '#332B2B' : '#736B63';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();

    const w = 26;
    const h = 62;

    // 2. Drop Shadow of the Signal Housing
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 2, -h / 2 + 3, w, h, 6);
    ctx.fill();

    // 3. Main Signal Housing (Powder-Coated Weatherproof Aluminum)
    ctx.fillStyle = isDark ? '#1C1919' : '#2A2525';
    ctx.strokeStyle = isDark ? '#413939' : '#5A524D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Helper: Draw 3D Sun Visor Cowl over lamp lens
    const drawSunVisor = (cy: number) => {
      ctx.save();
      ctx.fillStyle = isDark ? '#141010' : '#1A1818';
      ctx.strokeStyle = isDark ? '#413939' : '#3E3834';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Arched cowl protruding over the top half of the lens
      ctx.arc(0, cy, 8, Math.PI, 0, false);
      ctx.lineTo(8, cy - 2);
      ctx.arc(0, cy - 2, 8, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // A) RED LIGHT (Top, cy = -19)
    const isRed = state.color === 'red';
    drawSunVisor(-19);
    ctx.fillStyle = isRed ? '#FF6268' : '#331515';
    ctx.beginPath();
    ctx.arc(0, -19, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isRed) {
      // Optical Lens Glow Bloom
      const glowGrad = ctx.createRadialGradient(0, -19, 2, 0, -19, 14);
      glowGrad.addColorStop(0, 'rgba(255, 98, 104, 0.65)');
      glowGrad.addColorStop(1, 'rgba(255, 98, 104, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, -19, 14, 0, Math.PI * 2);
      ctx.fill();

      // High-contrast shape symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('■', 0, -19);
    }

    // B) AMBER LIGHT (Middle, cy = 0)
    const isAmber = state.color === 'amber';
    drawSunVisor(0);
    ctx.fillStyle = isAmber ? '#FFBD59' : '#332711';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isAmber) {
      const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
      glowGrad.addColorStop(0, 'rgba(255, 189, 89, 0.65)');
      glowGrad.addColorStop(1, 'rgba(255, 189, 89, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆', 0, 0);
    }

    // C) GREEN LIGHT (Bottom, cy = 19)
    const isGreen = state.color === 'green';
    drawSunVisor(19);
    ctx.fillStyle = isGreen ? '#36D98A' : '#113320';
    ctx.beginPath();
    ctx.arc(0, 19, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isGreen) {
      const glowGrad = ctx.createRadialGradient(0, 19, 2, 0, 19, 14);
      glowGrad.addColorStop(0, 'rgba(54, 217, 138, 0.65)');
      glowGrad.addColorStop(1, 'rgba(54, 217, 138, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 19, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', 0, 19);
    }

    // 4. Digital Countdown Pill (Indian Electronic Traffic Timer)
    ctx.fillStyle = isDark ? '#141010' : '#FFFFFF';
    ctx.strokeStyle = state.color === 'green' ? '#36D98A' : (state.color === 'amber' ? '#FFBD59' : '#FF6268');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-17, h / 2 + 4, 34, 18, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#F2EEEE' : '#242020';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.remainingTime}s`, 0, h / 2 + 13);

    ctx.restore();
  }
}
