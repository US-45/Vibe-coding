import { Direction, SignalPhase } from '../types/simulation';

export interface AdaptiveDecision {
  allocatedGreenTime: number;
  reason: string;
  nsQueue: number;
  ewQueue: number;
  timestamp: number;
}

export class AdaptiveSignalController {
  private minGreen: number = 6;
  private maxGreen: number = 28;
  private amberTime: number = 3;
  private allRedTime: number = 1.5;
  private lastDecision: AdaptiveDecision | null = null;
  private recentDecisions: AdaptiveDecision[] = [];

  constructor(settings?: { minGreen?: number; maxGreen?: number }) {
    if (settings?.minGreen) this.minGreen = settings.minGreen;
    if (settings?.maxGreen) this.maxGreen = settings.maxGreen;
  }

  public reset(): void {
    this.lastDecision = null;
    this.recentDecisions = [];
  }

  public getLastDecision(): AdaptiveDecision | null {
    return this.lastDecision;
  }

  public getRecentDecisions(): AdaptiveDecision[] {
    return this.recentDecisions;
  }

  /**
   * Computes the optimal green phase duration for the upcoming phase
   * based on measured queue lengths.
   */
  public computePhaseDuration(
    targetPhase: 'NS_GREEN' | 'EW_GREEN',
    queues: Record<Direction, number>
  ): number {
    const nsQueue = queues.north + queues.south;
    const ewQueue = queues.east + queues.west;

    const targetQueue = targetPhase === 'NS_GREEN' ? nsQueue : ewQueue;
    const opposingQueue = targetPhase === 'NS_GREEN' ? ewQueue : nsQueue;

    // Base calculation:
    // If targetQueue is 0 -> minGreen (6s)
    // Scale proportionally with queue size: e.g. 1.8 seconds per queued vehicle
    let duration = this.minGreen + Math.round(targetQueue * 1.8);

    // If targetQueue is significantly heavier than opposing queue, allocate extra bonus
    if (targetQueue > opposingQueue * 2 && targetQueue >= 4) {
      duration += 3;
    }

    // Clamp between minGreen and maxGreen
    duration = Math.max(this.minGreen, Math.min(this.maxGreen, duration));

    const phaseName = targetPhase === 'NS_GREEN' ? 'North-South' : 'East-West';
    const reason = `${phaseName} demand: ${targetQueue} veh vs ${opposingQueue} veh -> Allocated ${duration}s Green`;

    this.lastDecision = {
      allocatedGreenTime: duration,
      reason,
      nsQueue,
      ewQueue,
      timestamp: Date.now(),
    };

    this.recentDecisions.unshift(this.lastDecision);
    if (this.recentDecisions.length > 5) {
      this.recentDecisions.pop();
    }

    return duration;
  }

  /**
   * Evaluates whether an active green phase should terminate early.
   * If the active direction has completely emptied out (0 queued or approaching within 100px)
   * and has run for at least minGreen, we can switch early to save waiting time for the other directions.
   */
  public shouldTerminateEarly(
    currentPhase: SignalPhase,
    phaseElapsed: number,
    activeQueues: number,
    opposingQueues: number
  ): boolean {
    if (currentPhase !== 'NS_GREEN' && currentPhase !== 'EW_GREEN') {
      return false;
    }

    // Must have served at least minimum green
    if (phaseElapsed < this.minGreen) {
      return false;
    }

    // If active direction has 0 vehicles queued and opposing has vehicles waiting
    if (activeQueues === 0 && opposingQueues > 0 && phaseElapsed >= this.minGreen + 2) {
      return true;
    }

    return false;
  }
}
