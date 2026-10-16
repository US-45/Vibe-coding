import { Direction, DirectionStats, SimulationStats } from '../types/simulation';

export class StatisticsManager {
  private carsPassed: number = 0;
  private totalWaitTimeCompleted: number = 0; // accumulated wait time of vehicles that exited
  private elapsedTime: number = 0; // in seconds
  private lastHistorySampleTime: number = 0;

  private directionStats: Record<Direction, DirectionStats> = {
    north: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    south: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    east: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    west: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
  };

  private history: Array<{
    time: number;
    passed: number;
    avgWaitTime: number;
    queueLength: number;
  }> = [];

  public reset(): void {
    this.carsPassed = 0;
    this.totalWaitTimeCompleted = 0;
    this.elapsedTime = 0;
    this.lastHistorySampleTime = 0;

    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    for (const d of dirs) {
      this.directionStats[d] = {
        carsPassed: 0,
        currentQueue: 0,
        maxQueue: 0,
        totalWaitTime: 0,
        avgWaitTime: 0,
      };
    }

    this.history = [];
  }

  /**
   * Called when a vehicle completes its transit and leaves the canvas
   */
  public recordVehicleExit(origin: Direction, waitTime: number): void {
    this.carsPassed++;
    this.totalWaitTimeCompleted += waitTime;

    const dStats = this.directionStats[origin];
    dStats.carsPassed++;
    dStats.totalWaitTime += waitTime;
    dStats.avgWaitTime = Number((dStats.totalWaitTime / Math.max(1, dStats.carsPassed)).toFixed(1));
  }

  /**
   * Update live queues and elapsed time every simulation tick
   */
  public updateTick(
    dt: number,
    currentQueues: Record<Direction, number>,
    activeVehicleCount: number,
    inFlightWaitTimes: Record<Direction, number>
  ): void {
    this.elapsedTime += dt;

    let totalCurrentQueue = 0;
    const dirs: Direction[] = ['north', 'south', 'east', 'west'];

    for (const d of dirs) {
      const q = currentQueues[d];
      totalCurrentQueue += q;
      this.directionStats[d].currentQueue = q;
      if (q > this.directionStats[d].maxQueue) {
        this.directionStats[d].maxQueue = q;
      }

      // Compute live running average wait time incorporating in-flight waiting
      const completedWait = this.directionStats[d].totalWaitTime;
      const inFlightWait = inFlightWaitTimes[d] || 0;
      const totalUnits = this.directionStats[d].carsPassed + q;
      if (totalUnits > 0) {
        this.directionStats[d].avgWaitTime = Number(
          ((completedWait + inFlightWait) / totalUnits).toFixed(1)
        );
      }
    }

    // Sample history every 1 second of simulation time
    if (this.elapsedTime - this.lastHistorySampleTime >= 1.0) {
      this.lastHistorySampleTime = this.elapsedTime;
      
      const overallAvg = this.getAverageWaitTime(inFlightWaitTimes);

      this.history.push({
        time: Math.floor(this.elapsedTime),
        passed: this.carsPassed,
        avgWaitTime: overallAvg,
        queueLength: totalCurrentQueue,
      });

      // Keep up to 120 samples
      if (this.history.length > 120) {
        this.history.shift();
      }
    }
  }

  private getAverageWaitTime(inFlightWaitTimes?: Record<Direction, number>): number {
    let totalInFlight = 0;
    let totalInFlightVehicles = 0;

    if (inFlightWaitTimes) {
      const dirs: Direction[] = ['north', 'south', 'east', 'west'];
      for (const d of dirs) {
        totalInFlight += inFlightWaitTimes[d] || 0;
        totalInFlightVehicles += this.directionStats[d].currentQueue;
      }
    }

    const totalTracked = this.carsPassed + totalInFlightVehicles;
    if (totalTracked === 0) return 0;

    return Number(((this.totalWaitTimeCompleted + totalInFlight) / totalTracked).toFixed(1));
  }

  public getSnapshot(activeVehicleCount: number, inFlightWaitTimes?: Record<Direction, number>): SimulationStats {
    let totalWaiting = 0;
    let maxRecorded = 0;

    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    for (const d of dirs) {
      totalWaiting += this.directionStats[d].currentQueue;
      if (this.directionStats[d].maxQueue > maxRecorded) {
        maxRecorded = this.directionStats[d].maxQueue;
      }
    }

    return {
      carsPassed: this.carsPassed,
      activeVehicles: activeVehicleCount,
      totalWaitingVehicles: totalWaiting,
      averageWaitTime: this.getAverageWaitTime(inFlightWaitTimes),
      maxRecordedQueue: maxRecorded,
      elapsedTime: Math.floor(this.elapsedTime),
      directionStats: {
        north: { ...this.directionStats.north },
        south: { ...this.directionStats.south },
        east: { ...this.directionStats.east },
        west: { ...this.directionStats.west },
      },
      history: [...this.history],
    };
  }
}
