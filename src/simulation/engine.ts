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

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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
      const isLeftTurn = this.config.freeLeftTurn && this.getRandom() < 0.30;
      const movement: MovementType = isLeftTurn ? 'left' : 'straight';
      // Left turn vehicles must take lane 0 (curbside lane)
      const laneIndex = isLeftTurn ? 0 : (this.getRandom() < 0.5 ? 0 : 1);

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

    // Check if any conflicting traffic is currently inside the central intersection
    let hasCrossingTrafficInJunction = false;
    for (const v of this.vehicles) {
      if (v.hasCrossedStopLine && v.distanceAlongPath < STOP_LINE_DISTANCE + ROAD_WIDTH) {
        hasCrossingTrafficInJunction = true;
        break;
      }
    }

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

      CollisionManager.updateVehiclePhysics(
        v,
        leader,
        signal,
        this.config.freeLeftTurn,
        hasCrossingTrafficInJunction
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
   * - Left-Hand Traffic alignment
   * - Central Concrete Medians with Yellow-Black Kerb Striping
   * - Corner Triangular Slip Islands for Free Left Turn
   * - Indian Zebra Crossings & Yellow Box Anti-Gridlock
   * - Signals, Vehicles, and Real-time Queue Counters
   */
  public render(timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // 1. Canvas Background (Surrounding ground / city blocks)
    ctx.fillStyle = '#181414';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Asphalt Road Surfaces
    ctx.fillStyle = '#262323'; // Fresh Indian asphalt
    // Vertical Road
    ctx.fillRect(HALF_SIZE - HALF_ROAD, 0, ROAD_WIDTH, CANVAS_SIZE);
    // Horizontal Road
    ctx.fillRect(0, HALF_SIZE - HALF_ROAD, CANVAS_SIZE, ROAD_WIDTH);

    // 3. Indian Central Intersection: Yellow Box Junction Marking (Anti-Gridlock)
    ctx.save();
    ctx.beginPath();
    ctx.rect(HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, ROAD_WIDTH, ROAD_WIDTH);
    ctx.clip();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'; // Classic Indian yellow box
    ctx.lineWidth = 2.5;
    for (let pos = -ROAD_WIDTH; pos <= ROAD_WIDTH * 2; pos += 16) {
      ctx.beginPath();
      ctx.moveTo(HALF_SIZE - HALF_ROAD + pos, HALF_SIZE - HALF_ROAD);
      ctx.lineTo(HALF_SIZE - HALF_ROAD + pos + ROAD_WIDTH, HALF_SIZE + HALF_ROAD);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Outer Curbs / Footpaths
    ctx.strokeStyle = '#3D3535';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(HALF_SIZE + HALF_ROAD, 0, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(0, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);
    ctx.strokeRect(HALF_SIZE + HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD);

    // 5. Authentic Indian Raised Concrete Medians with Yellow & Black Kerb Striping (IRC Standard)
    this.drawIndianMedians(ctx);

    // 6. Dashed Lane Divider Markings
    this.drawLaneDividers(ctx);

    // 7. Stop Lines for Incoming Traffic (LHT Alignment)
    ctx.lineWidth = 4;
    // North stop line: on EAST half (x in [350, 420], y = 280)
    this.drawStopLine(ctx, HALF_SIZE, HALF_SIZE - HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE - HALF_ROAD, 'north');
    // South stop line: on WEST half (x in [280, 350], y = 420)
    this.drawStopLine(ctx, HALF_SIZE - HALF_ROAD, HALF_SIZE + HALF_ROAD, HALF_SIZE, HALF_SIZE + HALF_ROAD, 'south');
    // West stop line: on NORTH half (y in [280, 350], x = 280)
    this.drawStopLine(ctx, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE - HALF_ROAD, HALF_SIZE, 'west');
    // East stop line: on SOUTH half (y in [350, 420], x = 420)
    this.drawStopLine(ctx, HALF_SIZE + HALF_ROAD, HALF_SIZE, HALF_SIZE + HALF_ROAD, HALF_SIZE + HALF_ROAD, 'east');

    // 8. Zebra Crosswalks
    this.drawIndianCrosswalks(ctx);

    // 9. Free Left Turn Channelizer Islands & Guides
    this.drawFreeLeftTurnIslands(ctx);

    // 10. Direction Badges & Queue Counters
    this.drawIndianDirectionBadges(ctx);

    // 11. Render Vehicles
    for (const v of this.vehicles) {
      drawVehicle(ctx, v, timestamp);
    }

    // 12. Render Traffic Signals on Pedestals
    this.drawIndianSignalHeads(ctx);
  }

  /**
   * Draw Indian IRC-Standard Raised Concrete Medians with Yellow & Black Kerb Markings
   */
  private drawIndianMedians(ctx: CanvasRenderingContext2D): void {
    const stripeLen = 14;
    const medianWidth = 6;

    // A) North Median (from y=0 to y=260 along x=350)
    for (let y = 0; y < HALF_SIZE - HALF_ROAD - 20; y += stripeLen) {
      const isYellow = Math.floor(y / stripeLen) % 2 === 0;
      ctx.fillStyle = isYellow ? '#F59E0B' : '#111827';
      ctx.fillRect(HALF_SIZE - medianWidth / 2, y, medianWidth, Math.min(stripeLen, HALF_SIZE - HALF_ROAD - 20 - y));
    }

    // B) South Median (from y=440 to y=700 along x=350)
    for (let y = HALF_SIZE + HALF_ROAD + 20; y < CANVAS_SIZE; y += stripeLen) {
      const isYellow = Math.floor((y - (HALF_SIZE + HALF_ROAD + 20)) / stripeLen) % 2 === 0;
      ctx.fillStyle = isYellow ? '#F59E0B' : '#111827';
      ctx.fillRect(HALF_SIZE - medianWidth / 2, y, medianWidth, Math.min(stripeLen, CANVAS_SIZE - y));
    }

    // C) West Median (from x=0 to x=260 along y=350)
    for (let x = 0; x < HALF_SIZE - HALF_ROAD - 20; x += stripeLen) {
      const isYellow = Math.floor(x / stripeLen) % 2 === 0;
      ctx.fillStyle = isYellow ? '#F59E0B' : '#111827';
      ctx.fillRect(x, HALF_SIZE - medianWidth / 2, Math.min(stripeLen, HALF_SIZE - HALF_ROAD - 20 - x), medianWidth);
    }

    // D) East Median (from x=440 to x=700 along y=350)
    for (let x = HALF_SIZE + HALF_ROAD + 20; x < CANVAS_SIZE; x += stripeLen) {
      const isYellow = Math.floor((x - (HALF_SIZE + HALF_ROAD + 20)) / stripeLen) % 2 === 0;
      ctx.fillStyle = isYellow ? '#F59E0B' : '#111827';
      ctx.fillRect(x, HALF_SIZE - medianWidth / 2, Math.min(stripeLen, CANVAS_SIZE - x), medianWidth);
    }
  }

  private drawLaneDividers(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(224, 216, 208, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 10]);

    // Vertical Road Lane Dividers
    // North Approach & Exit
    ctx.beginPath();
    ctx.moveTo(HALF_SIZE - LANE_WIDTH, 0);
    ctx.lineTo(HALF_SIZE - LANE_WIDTH, HALF_SIZE - HALF_ROAD);
    ctx.moveTo(HALF_SIZE + LANE_WIDTH, 0);
    ctx.lineTo(HALF_SIZE + LANE_WIDTH, HALF_SIZE - HALF_ROAD);
    ctx.stroke();

    // South Approach & Exit
    ctx.beginPath();
    ctx.moveTo(HALF_SIZE - LANE_WIDTH, HALF_SIZE + HALF_ROAD);
    ctx.lineTo(HALF_SIZE - LANE_WIDTH, CANVAS_SIZE);
    ctx.moveTo(HALF_SIZE + LANE_WIDTH, HALF_SIZE + HALF_ROAD);
    ctx.lineTo(HALF_SIZE + LANE_WIDTH, CANVAS_SIZE);
    ctx.stroke();

    // Horizontal Road Lane Dividers
    // West Approach & Exit
    ctx.beginPath();
    ctx.moveTo(0, HALF_SIZE - LANE_WIDTH);
    ctx.lineTo(HALF_SIZE - HALF_ROAD, HALF_SIZE - LANE_WIDTH);
    ctx.moveTo(0, HALF_SIZE + LANE_WIDTH);
    ctx.lineTo(HALF_SIZE - HALF_ROAD, HALF_SIZE + LANE_WIDTH);
    ctx.stroke();

    // East Approach & Exit
    ctx.beginPath();
    ctx.moveTo(HALF_SIZE + HALF_ROAD, HALF_SIZE - LANE_WIDTH);
    ctx.lineTo(CANVAS_SIZE, HALF_SIZE - LANE_WIDTH);
    ctx.moveTo(HALF_SIZE + HALF_ROAD, HALF_SIZE + LANE_WIDTH);
    ctx.lineTo(CANVAS_SIZE, HALF_SIZE + LANE_WIDTH);
    ctx.stroke();

    ctx.restore();
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
    ctx.strokeStyle = signal.color === 'green' ? '#39B86B' : (signal.color === 'amber' ? '#F2B544' : '#E0D8D0');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private drawIndianCrosswalks(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(224, 216, 208, 0.28)';
    const stripeWidth = 6;
    const stripeGap = 6;

    // North crosswalk (in front of North stop line, spanning whole vertical road)
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
  private drawFreeLeftTurnIslands(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Subtle slip path dashed lines if Free Left Turn is enabled
    if (this.config.freeLeftTurn) {
      ctx.strokeStyle = 'rgba(181, 148, 71, 0.6)'; // Metallic Gold
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
      ctx.fillStyle = '#201C1C';
      ctx.strokeStyle = '#F59E0B'; // Yellow curb border
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

  private drawIndianDirectionBadges(ctx: CanvasRenderingContext2D): void {
    const queues = QueueManager.calculateQueueLengths(this.vehicles);

    // Positions matching Indian LHT incoming sides
    const positions: Record<Direction, { x: number; y: number; label: string }> = {
      north: { x: HALF_SIZE + 35, y: 35, label: 'NORTH' }, // East half (x=385)
      south: { x: HALF_SIZE - 35, y: CANVAS_SIZE - 35, label: 'SOUTH' }, // West half (x=315)
      west: { x: 35, y: HALF_SIZE - 35, label: 'WEST' }, // North half (y=315)
      east: { x: CANVAS_SIZE - 35, y: HALF_SIZE + 35, label: 'EAST' }, // South half (y=385)
    };

    ctx.save();
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    for (const d of dirs) {
      const pos = positions[d];
      const q = queues[d];

      // Badge Card
      ctx.fillStyle = '#242020';
      ctx.strokeStyle = q > 6 ? '#E54848' : (q > 3 ? '#F2B544' : '#413939');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pos.x - 38, pos.y - 12, 76, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Text with queue
      ctx.fillStyle = '#F2EEEE';
      ctx.fillText(`${pos.label}: ${q}`, pos.x, pos.y);
    }
    ctx.restore();
  }

  private drawIndianSignalHeads(ctx: CanvasRenderingContext2D): void {
    const dirs: Direction[] = ['north', 'south', 'east', 'west'];

    // Signal head positions placed on driver's side curb in Indian Left-Hand Traffic:
    // North incoming is on East half -> Signal is on East curb (x=442, y=262)
    // South incoming is on West half -> Signal is on West curb (x=258, y=438)
    // West incoming is on North half -> Signal is on North curb (x=262, y=258)
    // East incoming is on South half -> Signal is on South curb (x=438, y=442)
    const coords: Record<Direction, { x: number; y: number }> = {
      north: { x: HALF_SIZE + HALF_ROAD + 22, y: HALF_SIZE - HALF_ROAD - 18 },
      south: { x: HALF_SIZE - HALF_ROAD - 22, y: HALF_SIZE + HALF_ROAD + 18 },
      west: { x: HALF_SIZE - HALF_ROAD - 18, y: HALF_SIZE - HALF_ROAD - 22 },
      east: { x: HALF_SIZE + HALF_ROAD + 18, y: HALF_SIZE + HALF_ROAD + 22 },
    };

    for (const d of dirs) {
      const state = this.signalController.getSignalState(d);
      const pos = coords[d];
      this.drawSingleSignalHead(ctx, pos.x, pos.y, state);
    }
  }

  private drawSingleSignalHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: SignalState
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const w = 24;
    const h = 58;

    // Signal Housing (Black Powder Coated)
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Red Light (Top)
    const isRed = state.color === 'red';
    ctx.fillStyle = isRed ? '#E54848' : '#2D1515';
    ctx.beginPath();
    ctx.arc(0, -18, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isRed) {
      ctx.shadowColor = '#E54848';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('■', 0, -18);
      ctx.shadowBlur = 0;
    }

    // Amber Light (Middle)
    const isAmber = state.color === 'amber';
    ctx.fillStyle = isAmber ? '#F2B544' : '#2D2311';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isAmber) {
      ctx.shadowColor = '#F2B544';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆', 0, 0);
      ctx.shadowBlur = 0;
    }

    // Green Light (Bottom)
    const isGreen = state.color === 'green';
    ctx.fillStyle = isGreen ? '#39B86B' : '#112D1C';
    ctx.beginPath();
    ctx.arc(0, 18, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (isGreen) {
      ctx.shadowColor = '#39B86B';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▲', 0, 18);
      ctx.shadowBlur = 0;
    }

    // Digital Countdown Pill (Indian Electronic Traffic Timer)
    ctx.fillStyle = '#1F2937';
    ctx.strokeStyle = state.color === 'green' ? '#39B86B' : (state.color === 'amber' ? '#F2B544' : '#E54848');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-16, h / 2 + 3, 32, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F2EEEE';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.remainingTime}s`, 0, h / 2 + 11);

    ctx.restore();
  }
}
